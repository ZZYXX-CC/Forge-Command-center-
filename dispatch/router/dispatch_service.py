#!/usr/bin/env python3
"""
DISPATCH as an OpenAI-compatible endpoint (fleet integration layer).

Any OpenAI client (a Hermes agent, the Command Center, Telegram intake) can set
its base_url to this service and transparently get DISPATCH's tier-aware,
subscription-first routing with full fallback. The chosen surface and the routing
decision are echoed back in an `x_dispatch` field on the response.

Runs beside the router in the LXC. Imports the router so there is one brain.
"""
from __future__ import annotations
import json
import threading
import time
import uuid
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import sqlite3

import dispatch_router as R


def recent_decisions(limit: int = 50) -> list:
    """Read the router's decision log for the panel."""
    try:
        con = sqlite3.connect(R.DB_PATH)
        con.row_factory = sqlite3.Row
        rows = con.execute("SELECT * FROM routing_decisions ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [dict(r) for r in rows]
    except Exception:
        return []


def surface_statuses() -> list:
    """Return live availability for configured DISPATCH surfaces."""
    try:
        cfg = R.load_config()
    except Exception:
        cfg = {"surfaces": {}}
    litellm_up = R.litellm_models()
    executor_up = R.executor_surfaces()
    rows = []
    for name, meta in (cfg.get("surfaces") or {}).items():
        via = None
        available = False
        detail = meta.get("status")
        proxy = R.LITELLM_SURFACE_MODELS.get(name)
        if proxy:
            via = "litellm"
            available = proxy in litellm_up
            detail = proxy
        elif name in R.CLI_SURFACES:
            via = "executor"
            executor_name = R.EXEC_ALIAS.get(name, name)
            available = executor_name in executor_up
            detail = executor_name
        rows.append({
            "surface": name,
            "kind": meta.get("kind"),
            "host": meta.get("host"),
            "billing": meta.get("billing") or meta.get("subscription") or ("free" if meta.get("free") else None),
            "via": via,
            "available": available,
            "detail": detail,
        })
    return rows


def registry_status(refresh: bool = False) -> list:
    return R.apply_runtime_to_model_status(R.get_registry(refresh=refresh).status_rows(surface_statuses()))


def verification_jobs() -> list:
    return R.recent_verification_jobs()


def verifier_worker() -> None:
    while True:
        try:
            R.process_verification_jobs_once(limit=1)
        except Exception:
            pass
        time.sleep(20)


def _text(content) -> str:
    if isinstance(content, list):  # OpenAI content-parts form
        return " ".join(p.get("text", "") for p in content if isinstance(p, dict))
    return content or ""


def _flatten(messages) -> str:
    return "\n\n".join(
        _text(m.get("content")) if m.get("role") == "user"
        else f"[{m.get('role')}] {_text(m.get('content'))}"
        for m in messages
    )


def execute_litellm_chat(proxy_model: str, messages: list, timeout: int = 180) -> dict:
    payload = json.dumps({"model": proxy_model, "messages": messages, "max_tokens": 1024}).encode()
    req = urllib.request.Request(f"{R.LITELLM_URL}/v1/chat/completions", data=payload,
                                 headers={"Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as r:
        d = json.load(r)
    return {"content": d["choices"][0]["message"]["content"], "served_by": d.get("model"),
            "latency_ms": int((time.time() - t0) * 1000)}


def execute_executor(surface: str, text: str, model: str | None,
                     cwd: str | None = None, repo: str | None = None,
                     timeout: int = 600) -> dict:
    """Forward executor-backed runs with optional repo working directory."""
    return R.execute_executor(surface, text, model, cwd=cwd, repo=repo, timeout=timeout)


def route_chat(messages: list, cwd: str | None = None, repo: str | None = None,
               routing_intent: dict | None = None, dry_run: bool = False):
    cfg = R.load_config()
    users_idx = [i for i, m in enumerate(messages) if m.get("role") == "user"]
    task = _text(messages[users_idx[-1]].get("content")) if users_idx else _flatten(messages)
    cls = R.classify(task, routing_intent=routing_intent)
    sel = R.select(cfg, cls)
    result, status = None, "no_available_surface"
    if cls["confidence"] == "low":
        status = "low_confidence_defer_sage"

    errors = []
    # Try the selected surface first, then walk the remaining available,
    # routable, non-gated candidates. One dead executor/backend must not
    # collapse the whole DISPATCH route.
    candidates = []
    if sel.get("chosen"):
        candidates.append(sel["chosen"])
    for candidate in sel.get("considered", []):
        if candidate not in candidates:
            candidates.append(candidate)

    if dry_run:
        exec_task, vael_pre, vael_brief = task, None, None
    else:
        exec_task, vael_pre, vael_brief = R.apply_vael_before(cfg, cls, sel.get("tier", ""), task, cwd=cwd, repo=repo)
    exec_messages = [dict(m) for m in messages]
    if users_idx and exec_task != task:
        exec_messages[users_idx[-1]] = {**exec_messages[users_idx[-1]], "content": exec_task}
    exec_flat = _flatten(exec_messages)

    for ch in candidates:
        if not ch or not ch.get("routable") or not ch.get("available") or ch.get("gated_out") or ch.get("rejection_reason"):
            continue
        if dry_run:
            sel["chosen"] = ch
            status = "would_execute(dry_run)"
            result = {
                "content": f"Dry run: would route to {ch.get('surface')} / {ch.get('model') or ch.get('agent')}.",
                "served_by": ch.get("model") or ch.get("surface"),
                "latency_ms": 0,
            }
            break
        try:
            if ch["via"] == "litellm":
                result = execute_litellm_chat(ch["proxy"], exec_messages, timeout=R._candidate_timeout(cls, ch))
            else:
                result = execute_executor(ch["surface"], exec_flat, ch["model"], cwd=cwd, repo=repo,
                                          timeout=R._candidate_timeout(cls, ch))
            R.record_runtime_success(ch)
            if vael_brief:
                result["vael_brief"] = vael_brief
            status = "executed" if not errors else "executed_after_fallback:" + ";".join(errors[:8])
            if vael_pre:
                status = f"{status}_{vael_pre}"
            sel["chosen"] = ch
            result, sel, vstat = R.apply_verification(cfg, cls, sel, task, result,
                                                        cwd=cwd, repo=repo, messages=exec_messages)
            if vstat:
                status = f"{status}_{vstat}"
            result, vael_post = R.apply_vael_after(cfg, cls, sel.get("tier", ""), task, result,
                                                     cwd=cwd, repo=repo)
            if vael_post:
                status = f"{status}_{vael_post}"
            break
        except Exception as e:
            R.record_runtime_failure(ch, e)
            errors.append(f"{ch.get('surface')}:{type(e).__name__}")
            status = "exec_error_chain:" + ";".join(errors[:5])

    con = R._db()
    R.refresh_selection_metadata(cls, sel)
    decision_id = R.log_decision(con, task, cls, sel, result, status)
    if not dry_run:
        R.enqueue_verification_job(con, decision_id, task, cls, sel, result)
    return cls, sel, result, status


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"status": "ok", "service": "dispatch"})
        elif self.path == "/v1/models":
            self._send(200, {"object": "list", "data": [{"id": "dispatch-auto", "object": "model",
                                                         "owned_by": "dispatch"}]})
        elif self.path.startswith("/decisions"):
            self._send(200, {"decisions": recent_decisions()})
        elif self.path.startswith("/surfaces"):
            self._send(200, {"surfaces": surface_statuses(), "models": registry_status()})
        elif self.path.startswith("/registry/status"):
            self._send(200, {"models": registry_status()})
        elif self.path.startswith("/registry"):
            self._send(200, {"models": R.get_registry().public_models()})
        elif self.path.startswith("/verification/jobs"):
            self._send(200, {"jobs": verification_jobs()})
        else:
            self._send(404, {"error": "not found"})

    def _read_json_body(self) -> dict:
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or b"{}")

    def do_POST(self):
        if self.path == "/registry/refresh":
            return self._send(200, {"models": registry_status(refresh=True)})
        if self.path.startswith("/verification/decisions/") and self.path.endswith("/manual-pass"):
            try:
                body = self._read_json_body()
            except Exception as e:
                return self._send(400, {"error": {"message": str(e)}})
            parts = self.path.strip("/").split("/")
            decision_id = parts[2] if len(parts) == 4 else None
            result = R.mark_decision_manually_verified(
                decision_id,
                reviewer=body.get("reviewer") or "sage",
                note=body.get("note") or "",
                evidence=body.get("evidence"),
            )
            if not result:
                return self._send(404, {"error": {"message": "routing decision not found"}})
            return self._send(200, result)
        if self.path != "/v1/chat/completions":
            return self._send(404, {"error": "not found"})
        try:
            body = self._read_json_body()
        except Exception as e:
            return self._send(400, {"error": {"message": str(e)}})
        messages = body.get("messages", [])
        cwd = body.get("cwd") or body.get("repo")
        routing_intent = body.get("routing_intent") or body.get("task_intent") or body.get("metadata")
        if routing_intent is not None and not isinstance(routing_intent, dict):
            return self._send(400, {"error": {"message": "routing_intent/metadata must be an object"}})
        if not messages:
            return self._send(400, {"error": {"message": "messages required"}})
        cls, sel, result, status = route_chat(messages, cwd=cwd, repo=body.get("repo"),
                                             routing_intent=routing_intent,
                                             dry_run=bool(body.get("dry_run")))
        if not result:
            return self._send(503, {"error": {"message": f"dispatch: {status}", "type": "no_surface"}})
        ch = sel["chosen"]
        x_dispatch = {"tier": sel["tier"], "category": cls["category"],
                      "complexity": cls["complexity"], "chosen_surface": ch["surface"],
                      "via": ch["via"], "latency_ms": result["latency_ms"], "status": status,
                      "routing_intent": routing_intent,
                      "vael_approval": result.get("vael_approval"),
                      "classification": cls,
                      "classifier_model": cls.get("classifier_model"),
                      "chosen_model": ch.get("model"),
                      "considered": sel.get("considered") or [],
                      "rejections": sel.get("rejections") or [],
                      "why_log": sel.get("why_log") or [],
                      "verification": R.verification_state(result, status),
                      "quota_snapshot": sel.get("quota_snapshot") or {},
                      "circuit_snapshot": sel.get("circuit_snapshot") or {}}
        x_dispatch.update(R._result_metadata(result))

        self._send(200, {
            "id": f"chatcmpl-{uuid.uuid4().hex[:12]}", "object": "chat.completion",
            "created": int(time.time()), "model": result["served_by"],
            "choices": [{"index": 0, "message": {"role": "assistant", "content": result["content"]},
                         "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            "x_dispatch": x_dispatch,
        })

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print("DISPATCH OpenAI-compatible endpoint on :4001")
    threading.Thread(target=verifier_worker, name="dispatch-verifier", daemon=True).start()
    ThreadingHTTPServer(("0.0.0.0", 4001), Handler).serve_forever()
