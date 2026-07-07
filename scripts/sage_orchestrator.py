#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

DISPATCH_URL = os.environ.get("DISPATCH_URL", "http://192.168.1.178:4001").rstrip("/")
CONVEX_URL = os.environ.get("CONVEX_URL", os.environ.get("VITE_CONVEX_URL", "http://192.168.1.179:3210")).rstrip("/")
SYNC_INTERVAL_MS = int(os.environ.get("SYNC_INTERVAL_MS", "120000"))
MAX_PER_TICK = int(os.environ.get("MAX_PER_TICK", "1"))
STALE_IN_PROGRESS_MS = int(os.environ.get("STALE_IN_PROGRESS_MS", str(45 * 60 * 1000)))
MAX_STALE_REQUEUES = int(os.environ.get("MAX_STALE_REQUEUES", "1"))
RECOVERY_SCAN_LIMIT = int(os.environ.get("RECOVERY_SCAN_LIMIT", "25"))
SAGE_HEARTBEAT_INTERVAL_MS = int(os.environ.get("SAGE_HEARTBEAT_INTERVAL_MS", str(15 * 60 * 1000)))
RUNTIME_WORK_ID = os.environ.get("RUNTIME_WORK_ID", "system-forge-runtime")
LAST_HEARTBEAT_MS = 0


def clean_args(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: clean_args(v) for k, v in value.items() if v is not None}
    if isinstance(value, list):
        return [clean_args(v) for v in value]
    return value


def convex_call(kind: str, path: str, args: dict[str, Any]) -> Any:
    body = json.dumps({
        "path": path,
        "format": "convex_encoded_json",
        "args": [clean_args(args)],
    }).encode()
    req = urllib.request.Request(
        f"{CONVEX_URL}/api/{kind}",
        data=body,
        headers={"Content-Type": "application/json", "Convex-Client": "forge-sage-orchestrator-python"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        payload = json.load(response)
    if payload.get("status") != "success":
        raise RuntimeError(payload.get("errorMessage") or payload)
    return payload.get("value")


def convex_query(path: str, args: dict[str, Any]) -> Any:
    return convex_call("query", path, args)


def convex_mutation(path: str, args: dict[str, Any]) -> Any:
    return convex_call("mutation", path, args)


def dispatch_chat(payload: dict[str, Any]) -> dict[str, Any]:
    req = urllib.request.Request(
        f"{DISPATCH_URL}/v1/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode(errors="replace")
        raise RuntimeError(f"DISPATCH HTTP {exc.code}: {body}") from exc


def infer_domain(item: dict[str, Any]) -> str:
    text = " ".join(str(item.get(key) or "") for key in ("title", "summary", "owner", "surface")).lower()
    if any(word in text for word in ("ui", "ux", "design", "frontend", "react", "component", "layout")):
        return "ui_design"
    if any(word in text for word in ("deploy", "lxc", "convex", "schema", "infrastructure", "router", "dispatch", "ssh", "systemd")):
        return "infrastructure"
    if any(word in text for word in ("trade", "trading", "futures", "market", "edge", "quant")):
        return "trading"
    if any(word in text for word in ("plan", "architecture", "strategy", "review", "security")):
        return "planning"
    return "code"


def infer_authority(item: dict[str, Any], domain: str) -> str:
    owner = str(item.get("owner") or "").strip().lower()
    if owner in {"kern", "vael", "edge"}:
        return owner
    if domain == "ui_design":
        return "vael"
    if domain in {"infrastructure", "code"}:
        return "kern"
    if domain == "trading":
        return "edge"
    if owner == "sage":
        return "sage"
    return "sage"


def verification_policy(item: dict[str, Any], domain: str) -> str:
    priority = item.get("priority")
    if priority in {"high", "critical"} or domain in {"infrastructure", "trading"}:
        return "required"
    return "time_bounded"


def prompt_for_item(item: dict[str, Any]) -> str:
    parts = [
        f"Work item: {item.get('title')}",
        f"Priority: {item.get('priority')}",
        f"Owner: {item.get('owner') or 'unassigned'}",
    ]
    if item.get("branch"):
        parts.append(f"Branch: {item.get('branch')}")
    if item.get("summary"):
        parts.append(f"Summary:\n{item.get('summary')}")
    parts.append(
        "Return concise execution output, any blockers, and artifact paths or verification notes. "
        "Do not claim completion unless the requested work was actually performed."
    )
    return "\n\n".join(parts)


def extract_output(response: dict[str, Any]) -> str:
    choices = response.get("choices") or []
    if choices and isinstance(choices[0], dict):
        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, str):
            return content
    if response.get("error"):
        return str(response.get("error"))
    return json.dumps(response)[:4000]


def event_count(detail: dict[str, Any], event_type: str) -> int:
    return sum(1 for event in detail.get("events") or [] if event.get("type") == event_type)


def ensure_runtime_work_item() -> None:
    convex_mutation("work:upsertWorkItem", {
        "workId": RUNTIME_WORK_ID,
        "title": "FORGE runtime health monitor",
        "summary": (
            "Durable audit stream for service health, sync worker state, SAGE orchestration, "
            "verifier queue, registry availability, and runtime transitions."
        ),
        "status": "in_progress",
        "priority": "high",
        "orchestrator": "SYSTEM",
        "owner": "kern",
        "executor": "dispatch-convex-sync",
        "surface": "convex",
        "verificationStatus": "waived",
        "verificationSummary": "Runtime heartbeat monitor.",
    })


def queue_count(status: str) -> int:
    rows = convex_query("work:listWorkItems", {"status": status, "limit": 100}) or []
    return len(rows)


def maybe_emit_sage_heartbeat(maintenance: dict[str, Any], processed: list[dict[str, Any]]) -> dict[str, Any] | None:
    global LAST_HEARTBEAT_MS
    now = int(time.time() * 1000)
    if LAST_HEARTBEAT_MS and SAGE_HEARTBEAT_INTERVAL_MS > 0 and now - LAST_HEARTBEAT_MS < SAGE_HEARTBEAT_INTERVAL_MS:
        return None

    summary = {
        "ready": queue_count("ready"),
        "in_progress": queue_count("in_progress"),
        "review": queue_count("review"),
        "blocked": queue_count("blocked"),
        "processed_count": len(processed),
        "recovered_count": len(maintenance.get("recovered") or []),
        "verified_count": len(maintenance.get("verified") or []),
        "interval_ms": SAGE_HEARTBEAT_INTERVAL_MS,
    }
    ensure_runtime_work_item()
    convex_mutation("work:addWorkEvent", {
        "workId": RUNTIME_WORK_ID,
        "type": "sage_orchestrator_heartbeat",
        "actor": "SAGE",
        "message": (
            "SAGE orchestrator heartbeat: "
            f"{summary['ready']} ready, {summary['in_progress']} in progress, "
            f"{summary['review']} in review, {summary['blocked']} blocked."
        ),
        "metadata": json.dumps({
            "summary": summary,
            "maintenance": maintenance,
            "processed": processed[:10],
            "dispatch_url": DISPATCH_URL,
            "convex_url": CONVEX_URL,
        }),
    })
    LAST_HEARTBEAT_MS = now
    return summary


def recover_stale_in_progress() -> list[dict[str, Any]]:
    now = int(time.time() * 1000)
    stale_before = now - STALE_IN_PROGRESS_MS
    rows = convex_query("work:listWorkItems", {"status": "in_progress", "limit": RECOVERY_SCAN_LIMIT}) or []
    recovered: list[dict[str, Any]] = []
    for item in rows:
        work_id = item.get("workId")
        if not work_id:
            continue
        if str(item.get("orchestrator") or "").upper() != "SAGE":
            continue
        if str(item.get("executor") or "").upper() != "DISPATCH":
            continue
        if int(item.get("updatedAt") or now) > stale_before:
            continue
        detail = convex_query("work:getWorkItem", {"workId": work_id}) or {}
        current = detail.get("item") or {}
        if current.get("status") != "in_progress":
            continue
        if event_count(detail, "sage_dispatch_completed") > 0:
            continue
        retries = event_count(detail, "sage_dispatch_requeued")
        if retries < MAX_STALE_REQUEUES:
            convex_mutation("work:updateWorkItem", {
                "workId": work_id,
                "status": "ready",
                "verificationStatus": "not_started",
                "verificationSummary": "SAGE recovered this item after a stale in-flight DISPATCH attempt.",
                "blocker": None,
            })
            convex_mutation("work:addWorkEvent", {
                "workId": work_id,
                "type": "sage_dispatch_requeued",
                "actor": "SAGE",
                "message": "Requeued stale in-progress item after no DISPATCH completion was recorded.",
                "metadata": json.dumps({"stale_ms": now - int(current.get("updatedAt") or now), "retry": retries + 1}),
            })
            recovered.append({"workId": work_id, "status": "requeued", "retry": retries + 1})
        else:
            blocker = "SAGE dispatch attempt went stale repeatedly; manual review required before another retry."
            convex_mutation("work:updateWorkItem", {
                "workId": work_id,
                "status": "blocked",
                "blocker": blocker,
                "verificationStatus": "failed",
                "verificationSummary": blocker,
            })
            convex_mutation("work:addWorkEvent", {
                "workId": work_id,
                "type": "sage_dispatch_stale_blocked",
                "actor": "SAGE",
                "message": blocker,
                "metadata": json.dumps({"stale_ms": now - int(current.get("updatedAt") or now), "retries": retries}),
            })
            recovered.append({"workId": work_id, "status": "blocked", "retries": retries})
    return recovered


def reconcile_verification_results() -> list[dict[str, Any]]:
    rows = convex_query("work:listWorkItems", {"status": "review", "limit": RECOVERY_SCAN_LIMIT}) or []
    reconciled: list[dict[str, Any]] = []
    for item in rows:
        work_id = item.get("workId")
        if not work_id or item.get("verificationStatus") != "running":
            continue
        if str(item.get("orchestrator") or "").upper() != "SAGE":
            continue
        runs = convex_query("work:listVerificationRuns", {"workId": work_id, "limit": 5}) or []
        terminal = next((run for run in runs if run.get("state") in {
            "passed", "failed", "needs_review", "verifier_unavailable", "timeout"
        }), None)
        if not terminal:
            continue
        state = terminal.get("state")
        if state == "passed":
            status = "done"
            verification_status = "passed"
            summary = terminal.get("summary") or "Background verification passed."
        elif state == "failed":
            status = "review"
            verification_status = "failed"
            summary = terminal.get("summary") or "Background verification failed."
        else:
            status = "review"
            verification_status = "failed"
            summary = terminal.get("summary") or f"Background verifier ended as {state}."
        convex_mutation("work:updateWorkItem", {
            "workId": work_id,
            "status": status,
            "verificationStatus": verification_status,
            "verificationSummary": summary,
        })
        convex_mutation("work:addWorkEvent", {
            "workId": work_id,
            "type": "sage_verification_reconciled",
            "actor": "SAGE",
            "message": f"Reconciled background verifier state: {state}.",
            "metadata": json.dumps({
                "runId": terminal.get("runId"),
                "verifierSurface": terminal.get("verifierSurface"),
                "verifierModel": terminal.get("verifierModel"),
                "state": state,
            }),
        })
        reconciled.append({"workId": work_id, "state": state, "status": status})
    return reconciled


def dispatch_work_item(item: dict[str, Any]) -> dict[str, Any]:
    work_id = item["workId"]
    domain = infer_domain(item)
    authority = infer_authority(item, domain)
    policy = verification_policy(item, domain)
    prompt = prompt_for_item(item)
    dry_run = bool(item.get("dryRun"))
    now = int(time.time() * 1000)

    convex_mutation("work:updateWorkItem", {
        "workId": work_id,
        "status": "in_progress",
        "orchestrator": "SAGE",
        "owner": authority,
        "executor": "DISPATCH",
        "surface": "dispatch-auto",
        "verificationStatus": "waived" if dry_run else ("running" if policy == "required" else "not_started"),
        "verificationSummary": "SAGE queued this item through DISPATCH dry-run." if dry_run else "SAGE queued this item through DISPATCH.",
    })
    convex_mutation("work:addWorkEvent", {
        "workId": work_id,
        "type": "sage_dispatch_started",
        "actor": "SAGE",
        "message": f"SAGE sent work item to DISPATCH with {domain}/{authority} intent.",
        "metadata": json.dumps({"domain": domain, "authority": authority, "verification_policy": policy, "dry_run": dry_run}),
    })

    started = int(time.time() * 1000)
    response = dispatch_chat({
        "model": "dispatch-auto",
        "dry_run": dry_run,
        "messages": [{"role": "user", "content": prompt}],
        "routing_intent": {
            "task_type": "implementation" if domain not in {"planning"} else "planning",
            "domain": domain,
            "authority_agent": authority,
            "verification_policy": policy,
            "workId": work_id,
            "source": "sage_orchestrator",
        },
    })
    completed = int(time.time() * 1000)
    x_dispatch = response.get("x_dispatch") or {}
    verification = x_dispatch.get("verification") or {}
    output = extract_output(response)
    chosen_surface = x_dispatch.get("chosen_surface") or response.get("surface") or "dispatch-auto"
    chosen_model = x_dispatch.get("chosen_model") or response.get("model")
    route_status = "ok" if not response.get("error") else "error"
    verifier_state = verification.get("state") or verification.get("status")

    if route_status != "ok":
        status = "blocked"
        verification_status = "failed"
        verification_summary = str(response.get("error") or output[:240])
    elif dry_run:
        status = "done"
        verification_status = "waived"
        verification_summary = "DISPATCH dry-run completed; no model execution or verifier job was started."
    elif verifier_state == "passed":
        status = "done"
        verification_status = "passed"
        verification_summary = "DISPATCH completed and verification passed."
    elif verifier_state in {"failed", "needs_review", "timeout", "verifier_unavailable"}:
        status = "review"
        verification_status = "failed" if verifier_state == "failed" else "running"
        verification_summary = f"DISPATCH completed; verifier state is {verifier_state}."
    elif policy == "required":
        status = "review"
        verification_status = "running"
        verification_summary = "DISPATCH completed; verification is pending."
    else:
        status = "done"
        verification_status = "waived"
        verification_summary = "DISPATCH completed; verification was time-bounded or not required."

    convex_mutation("work:updateWorkItem", {
        "workId": work_id,
        "status": status,
        "surface": chosen_surface,
        "model": chosen_model,
        "verificationStatus": verification_status,
        "verificationSummary": verification_summary,
    })
    convex_mutation("work:recordExecutorRun", {
        "workId": work_id,
        "runId": f"sage-dispatch:{work_id}:{now}",
        "executor": "SAGE",
        "surface": chosen_surface,
        "model": chosen_model,
        "status": route_status,
        "promptPreview": prompt[:800],
        "outputPreview": output[:1200],
        "error": response.get("error"),
        "startedAt": started,
        "completedAt": completed,
        "latencyMs": completed - started,
    })
    convex_mutation("work:upsertRoutingDecision", {
        "sourceId": f"sage:{work_id}:{now}",
        "workId": work_id,
        "task": prompt[:1200],
        "category": domain,
        "complexity": "routine" if item.get("priority") in {"low", "medium"} else "hard",
        "urgency": item.get("priority"),
        "confidence": (x_dispatch.get("classification") or {}).get("confidence"),
        "chosenSurface": chosen_surface,
        "chosenModel": chosen_model,
        "via": x_dispatch.get("via"),
        "servedBy": x_dispatch.get("served_by"),
        "status": route_status,
        "latencyMs": completed - started,
        "consideredJson": json.dumps(x_dispatch.get("considered") or []),
        "classificationJson": json.dumps(x_dispatch.get("classification") or {}),
        "classifierModel": x_dispatch.get("classifier_model"),
        "whyLogJson": json.dumps(x_dispatch.get("why_log") or []),
        "rejectionsJson": json.dumps(x_dispatch.get("rejections") or []),
        "verificationJson": json.dumps(verification),
        "quotaSnapshotJson": json.dumps(x_dispatch.get("quota_snapshot") or {}),
        "circuitSnapshotJson": json.dumps(x_dispatch.get("circuit_snapshot") or {}),
        "decidedAt": completed,
    })
    convex_mutation("work:addWorkEvent", {
        "workId": work_id,
        "type": "sage_dispatch_completed",
        "actor": "SAGE",
        "message": f"DISPATCH {'dry-run ' if dry_run else ''}returned {route_status}; work item is now {status}.",
        "metadata": json.dumps({
            "surface": chosen_surface,
            "model": chosen_model,
            "verification": verification,
            "why_log": x_dispatch.get("why_log") or [],
            "dry_run": dry_run,
        }),
    })
    return {"workId": work_id, "status": status, "surface": chosen_surface, "model": chosen_model}


def tick() -> list[dict[str, Any]]:
    maintenance = {
        "recovered": recover_stale_in_progress(),
        "verified": reconcile_verification_results(),
    }
    ready = convex_query("work:listWorkItems", {"status": "ready", "limit": MAX_PER_TICK}) or []
    results = []
    for item in ready:
        try:
            results.append(dispatch_work_item(item))
        except Exception as exc:
            work_id = item.get("workId")
            if work_id:
                convex_mutation("work:updateWorkItem", {
                    "workId": work_id,
                    "status": "blocked",
                    "blocker": str(exc)[:1000],
                    "verificationStatus": "failed",
                    "verificationSummary": "SAGE orchestration failed before completion.",
                })
                convex_mutation("work:addWorkEvent", {
                    "workId": work_id,
                    "type": "sage_dispatch_failed",
                    "actor": "SAGE",
                    "message": str(exc)[:1000],
                })
            results.append({"workId": work_id, "status": "blocked", "error": str(exc)})
    heartbeat = maybe_emit_sage_heartbeat(maintenance, results)
    if heartbeat:
        results.insert(0, {"heartbeat": heartbeat})
    if maintenance["recovered"] or maintenance["verified"]:
        results.insert(0, {"maintenance": maintenance})
    return results


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    while True:
        results = tick()
        print(time.strftime("%Y-%m-%dT%H:%M:%S"), json.dumps({"processed": results}), flush=True)
        if args.once:
            return
        time.sleep(SYNC_INTERVAL_MS / 1000)


if __name__ == "__main__":
    main()
