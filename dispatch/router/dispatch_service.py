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
        rows = con.execute(
            "SELECT ts,task,category,complexity,urgency,confidence,chosen_surface,chosen_model,"
            "via,served_by,latency_ms,status,considered FROM routing_decisions ORDER BY id DESC LIMIT ?",
            (limit,)).fetchall()
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


def execute_litellm_chat(proxy_model: str, messages: list) -> dict:
    payload = json.dumps({"model": proxy_model, "messages": messages, "max_tokens": 1024}).encode()
    req = urllib.request.Request(f"{R.LITELLM_URL}/v1/chat/completions", data=payload,
                                 headers={"Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=180) as r:
        d = json.load(r)
    return {"content": d["choices"][0]["message"]["content"], "served_by": d.get("model"),
            "latency_ms": int((time.time() - t0) * 1000)}


def execute_executor(surface: str, text: str, model: str | None,
                     cwd: str | None = None, repo: str | None = None) -> dict:
    """Forward executor-backed runs with optional repo working directory."""
    return R.execute_executor(surface, text, model, cwd=cwd, repo=repo)


def route_chat(messages: list, cwd: str | None = None, repo: str | None = None):
    cfg = R.load_config()
    users = [m for m in messages if m.get("role") == "user"]
    task = _text(users[-1].get("content")) if users else _flatten(messages)
    cls = R.classify(task)
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

    for ch in candidates:
        if not ch or not ch.get("routable") or not ch.get("available") or ch.get("gated_out"):
            continue
        try:
            if ch["via"] == "litellm":
                result = execute_litellm_chat(ch["proxy"], messages)
            else:
                result = execute_executor(ch["surface"], _flatten(messages), ch["model"], cwd=cwd, repo=repo)
            status = "executed" if not errors else "executed_after_fallback:" + ";".join(errors[:3])
            sel["chosen"] = ch
            break
        except Exception as e:
            errors.append(f"{ch.get('surface')}:{type(e).__name__}")
            status = "exec_error_chain:" + ";".join(errors[:5])

    con = R._db()
    R.log_decision(con, task, cls, sel, result, status)
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
            self._send(200, {"surfaces": surface_statuses()})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/v1/chat/completions":
            return self._send(404, {"error": "not found"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception as e:
            return self._send(400, {"error": {"message": str(e)}})
        messages = body.get("messages", [])
        cwd = body.get("cwd") or body.get("repo")
        if not messages:
            return self._send(400, {"error": {"message": "messages required"}})
        cls, sel, result, status = route_chat(messages, cwd=cwd, repo=body.get("repo"))
        if not result:
            return self._send(503, {"error": {"message": f"dispatch: {status}", "type": "no_surface"}})
        ch = sel["chosen"]
        self._send(200, {
            "id": f"chatcmpl-{uuid.uuid4().hex[:12]}", "object": "chat.completion",
            "created": int(time.time()), "model": result["served_by"],
            "choices": [{"index": 0, "message": {"role": "assistant", "content": result["content"]},
                         "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            "x_dispatch": {"tier": sel["tier"], "category": cls["category"],
                           "complexity": cls["complexity"], "chosen_surface": ch["surface"],
                           "via": ch["via"], "latency_ms": result["latency_ms"], "status": status},
        })

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print("DISPATCH OpenAI-compatible endpoint on :4001")
    ThreadingHTTPServer(("0.0.0.0", 4001), Handler).serve_forever()
