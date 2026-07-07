#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
import time
import urllib.error
import urllib.request
from typing import Any

DISPATCH_URL = os.environ.get("DISPATCH_URL", "http://192.168.1.178:4001").rstrip("/")
CONVEX_URL = os.environ.get("CONVEX_URL", os.environ.get("VITE_CONVEX_URL", "http://192.168.1.179:3210")).rstrip("/")
LITELLM_URL = os.environ.get("LITELLM_URL", "http://192.168.1.178:4000").rstrip("/")
EXECUTOR_URL = os.environ.get("EXECUTOR_URL", "http://192.168.1.170:4100").rstrip("/")
COMMAND_CENTER_URL = os.environ.get("COMMAND_CENTER_URL", "http://command-center.nuvuestudio.net").rstrip("/")
SYNC_INTERVAL_MS = int(os.environ.get("SYNC_INTERVAL_MS", "60000"))
RUNTIME_WORK_ID = os.environ.get("RUNTIME_WORK_ID", "system-forge-runtime")
RUNTIME_STATE_FILE = os.environ.get("RUNTIME_STATE_FILE", "/tmp/forge-runtime-health.json")
RUNTIME_HEARTBEAT_EVENT_MS = int(os.environ.get("RUNTIME_HEARTBEAT_EVENT_MS", "900000"))
SYSTEMD_UNITS = [
    unit.strip()
    for unit in os.environ.get(
        "RUNTIME_SYSTEMD_UNITS",
        "litellm,dispatch-service,dispatch-convex-sync,forge-sage-orchestrator",
    ).split(",")
    if unit.strip()
]


def get_json(url: str) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "forge-dispatch-sync/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def get_text(url: str, timeout: int = 8) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "forge-dispatch-sync/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def post_json(url: str, args: dict[str, Any] | None = None) -> dict[str, Any]:
    body = json.dumps(args or {}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "forge-dispatch-sync/1.0"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def post_convex(path: str, args: dict[str, Any]) -> Any:
    body = json.dumps({
        "path": path,
        "format": "convex_encoded_json",
        "args": [clean_args(args)],
    }).encode()
    req = urllib.request.Request(
        f"{CONVEX_URL}/api/mutation",
        data=body,
        headers={"Content-Type": "application/json", "Convex-Client": "forge-dispatch-sync-python"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        payload = json.load(response)
    if payload.get("status") != "success":
        raise RuntimeError(payload.get("errorMessage") or payload)
    return payload.get("value")


def load_runtime_state() -> dict[str, Any]:
    try:
        with open(RUNTIME_STATE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except FileNotFoundError:
        return {}
    except Exception:
        return {}


def save_runtime_state(state: dict[str, Any]) -> None:
    directory = os.path.dirname(RUNTIME_STATE_FILE)
    if directory:
        os.makedirs(directory, exist_ok=True)
    tmp_path = f"{RUNTIME_STATE_FILE}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, sort_keys=True)
    os.replace(tmp_path, RUNTIME_STATE_FILE)


def clean_args(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: clean_args(v) for k, v in value.items() if v is not None}
    if isinstance(value, list):
        return [clean_args(v) for v in value]
    return value


def maybe_number(value: Any) -> int | float | None:
    return value if isinstance(value, (int, float)) else None


def parse_json(value: Any, fallback: Any) -> Any:
    if not isinstance(value, str) or not value:
        return fallback


def probe_endpoint(name: str, url: str, expect_json: bool = False, timeout: int = 8) -> dict[str, Any]:
    start = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "forge-dispatch-sync/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="replace")
            latency_ms = int((time.time() - start) * 1000)
            payload: Any = None
            if expect_json:
                payload = json.loads(raw)
            return {
                "name": name,
                "status": "up",
                "latency_ms": latency_ms,
                "url": url,
                "detail": payload if payload is not None else raw[:120],
            }
    except Exception as exc:
        return {
            "name": name,
            "status": "down",
            "latency_ms": int((time.time() - start) * 1000),
            "url": url,
            "error": str(exc),
        }


def probe_systemd(unit: str) -> dict[str, Any]:
    try:
        result = subprocess.run(
            ["systemctl", "is-active", unit],
            check=False,
            capture_output=True,
            text=True,
            timeout=5,
        )
        status = (result.stdout or result.stderr).strip() or "unknown"
        return {
            "name": f"systemd:{unit}",
            "status": "up" if status == "active" else "down",
            "detail": status,
        }
    except Exception as exc:
        return {
            "name": f"systemd:{unit}",
            "status": "unknown",
            "error": str(exc),
        }


def collect_runtime_health() -> dict[str, Any]:
    services = [
        probe_endpoint("litellm", f"{LITELLM_URL}/health/liveliness"),
        probe_endpoint("dispatch", f"{DISPATCH_URL}/health", expect_json=True),
        probe_endpoint("executor", f"{EXECUTOR_URL}/health", expect_json=True),
        probe_endpoint("command-center", f"{COMMAND_CENTER_URL}/healthz"),
        probe_endpoint("convex", CONVEX_URL),
    ]
    services.extend(probe_systemd(unit) for unit in SYSTEMD_UNITS)

    registry = probe_endpoint("dispatch-registry", f"{DISPATCH_URL}/registry/status", expect_json=True)
    verifier = probe_endpoint("dispatch-verifier", f"{DISPATCH_URL}/verification/jobs", expect_json=True)
    services.extend([registry, verifier])

    model_count = 0
    unavailable_models = 0
    quota_blocked = 0
    verifier_jobs = 0
    verifier_states: dict[str, int] = {}
    gateway_summary: dict[str, Any] = {}
    executor_detail = next((svc.get("detail") for svc in services if svc.get("name") == "executor"), None)
    if isinstance(executor_detail, dict) and isinstance(executor_detail.get("hermes_gateways"), dict):
        gateways = executor_detail["hermes_gateways"]
        gateway_summary = gateways.get("summary") or {}
        gateway_summary["status"] = gateways.get("status")
        executor_detail["hermes_gateways"] = {
            "status": gateways.get("status"),
            "summary": gateway_summary,
            "agents": [
                {
                    "agent": agent.get("agent"),
                    "status": agent.get("status"),
                    "reasons": agent.get("reasons") or [],
                    "pid": ((agent.get("launchd") or {}).get("pid")),
                    "state_age_seconds": ((agent.get("state") or {}).get("age_seconds")),
                    "telegram_state": ((agent.get("state") or {}).get("telegram_state")),
                }
                for agent in gateways.get("agents", [])
            ],
        }
    if isinstance(registry.get("detail"), dict):
        models = registry["detail"].get("models") or []
        model_count = len(models)
        for model in models:
            runtime = model.get("runtime") or {}
            if not runtime.get("available"):
                unavailable_models += 1
            if runtime.get("health") == "quota_exhausted":
                quota_blocked += 1
        registry["detail"] = {
            "model_count": model_count,
            "unavailable_models": unavailable_models,
            "quota_blocked": quota_blocked,
        }
    if isinstance(verifier.get("detail"), dict):
        jobs = verifier["detail"].get("jobs") or []
        verifier_jobs = len(jobs)
        for job in jobs:
            status = str(job.get("status") or "unknown")
            verifier_states[status] = verifier_states.get(status, 0) + 1
        verifier["detail"] = {
            "job_count": verifier_jobs,
            "states": verifier_states,
        }

    down = [svc for svc in services if svc.get("status") == "down"]
    unknown = [svc for svc in services if svc.get("status") == "unknown"]
    status = "healthy" if not down and not unknown else "degraded"
    return {
        "status": status,
        "checkedAt": int(time.time() * 1000),
        "services": services,
        "summary": {
            "service_count": len(services),
            "down": [svc["name"] for svc in down],
            "unknown": [svc["name"] for svc in unknown],
            "model_count": model_count,
            "unavailable_models": unavailable_models,
            "quota_blocked": quota_blocked,
            "verifier_jobs": verifier_jobs,
            "verifier_states": verifier_states,
            "hermes_gateways": gateway_summary,
        },
    }


def runtime_signature(snapshot: dict[str, Any]) -> str:
    compact = {
        "status": snapshot.get("status"),
        "services": {
            svc.get("name"): svc.get("status")
            for svc in snapshot.get("services", [])
        },
        "summary": snapshot.get("summary", {}),
    }
    return json.dumps(compact, sort_keys=True)


def upsert_runtime_work_item() -> None:
    post_convex("work:upsertWorkItem", {
        "workId": RUNTIME_WORK_ID,
        "title": "FORGE runtime health monitor",
        "summary": "Durable audit stream for service health, sync worker state, verifier queue, registry availability, and runtime transitions.",
        "status": "in_progress",
        "priority": "high",
        "orchestrator": "SYSTEM",
        "owner": "kern",
        "executor": "dispatch-convex-sync",
        "surface": "convex",
        "verificationStatus": "waived",
        "verificationSummary": "Runtime heartbeat monitor.",
    })


def append_runtime_event(event_type: str, message: str, metadata: dict[str, Any]) -> None:
    post_convex("work:appendWorkEvent", {
        "workId": RUNTIME_WORK_ID,
        "type": event_type,
        "actor": "Runtime Monitor",
        "message": message,
        "metadata": json.dumps(metadata, sort_keys=True),
    })


def flush_runtime_events(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    remaining: list[dict[str, Any]] = []
    if not events:
        return remaining
    try:
        upsert_runtime_work_item()
        for event in events:
            append_runtime_event(event["type"], event["message"], event["metadata"])
    except Exception:
        remaining = events
    return remaining


def sync_runtime_health() -> dict[str, Any]:
    state = load_runtime_state()
    pending = list(state.get("pending_events") or [])
    pending = flush_runtime_events(pending)

    snapshot = collect_runtime_health()
    signature = runtime_signature(snapshot)
    now_ms = int(time.time() * 1000)
    last_heartbeat_at = int(state.get("last_heartbeat_at") or 0)
    previous_signature = state.get("last_signature")
    changed = signature != previous_signature
    heartbeat_due = now_ms - last_heartbeat_at >= RUNTIME_HEARTBEAT_EVENT_MS

    events: list[dict[str, Any]] = []
    if changed:
        events.append({
            "type": "runtime_health_changed",
            "message": f"Runtime health changed: {snapshot['status']}",
            "metadata": snapshot,
        })
    elif heartbeat_due:
        events.append({
            "type": "runtime_health_heartbeat",
            "message": f"Runtime heartbeat: {snapshot['status']}",
            "metadata": snapshot,
        })

    unsent = flush_runtime_events(events)
    pending.extend(unsent)

    state.update({
        "last_signature": signature,
        "last_snapshot": snapshot,
        "pending_events": pending[-50:],
    })
    if events and not unsent:
        state["last_heartbeat_at"] = now_ms
    save_runtime_state(state)
    return {
        "status": snapshot["status"],
        "events": len(events) - len(unsent),
        "pending_events": len(state["pending_events"]),
        **snapshot["summary"],
    }
    try:
        return json.loads(value)
    except Exception:
        return fallback


def sync_models() -> int:
    try:
        models = post_json(f"{DISPATCH_URL}/registry/refresh").get("models", [])
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        models = get_json(f"{DISPATCH_URL}/registry/status").get("models", [])
    for model in models:
        post_convex("work:upsertModelRegistry", {
            "registryId": model.get("id"),
            "provider": model.get("provider"),
            "surface": model.get("surface"),
            "model": model.get("model"),
            "capabilitiesJson": json.dumps(model.get("capabilities") or []),
            "authorityRolesJson": json.dumps(model.get("authority_roles") or []),
            "allowedDomainsJson": json.dumps(model.get("allowed_domains") or []),
            "tier": model.get("tier"),
            "trustLevel": model.get("trust_level"),
            "quotaJson": json.dumps(model.get("quota") or {}),
            "costJson": json.dumps(model.get("cost") or {}),
        })
        runtime = model.get("runtime") or {}
        post_convex("work:upsertModelRuntimeStatus", {
            "registryId": model.get("id"),
            "surface": model.get("surface"),
            "model": model.get("model"),
            "health": runtime.get("health") or "unknown",
            "available": bool(runtime.get("available")),
            "via": runtime.get("via"),
            "quotaUsed": maybe_number(runtime.get("quota_used")),
            "quotaRemaining": maybe_number(runtime.get("quota_remaining")),
            "circuitState": runtime.get("circuit_state") or "closed",
            "lastSuccess": int(runtime["last_success"] * 1000) if maybe_number(runtime.get("last_success")) else None,
            "lastFailure": int(runtime["last_failure"] * 1000) if maybe_number(runtime.get("last_failure")) else None,
            "lastError": runtime.get("last_error"),
        })
    return len(models)


def sync_decisions() -> int:
    decisions = get_json(f"{DISPATCH_URL}/decisions").get("decisions", [])
    for decision in decisions:
        classification = parse_json(decision.get("classification_json"), {}) or {}
        if not isinstance(classification, dict):
            classification = {}
        post_convex("work:upsertRoutingDecision", {
            "sourceId": f"dispatch:{decision.get('id')}",
            "task": decision.get("task") or "",
            "category": decision.get("category") or classification.get("category") or "unknown",
            "complexity": decision.get("complexity") or classification.get("complexity") or "routine",
            "urgency": decision.get("urgency") or classification.get("urgency"),
            "confidence": decision.get("confidence") or classification.get("confidence"),
            "chosenSurface": decision.get("chosen_surface"),
            "chosenModel": decision.get("chosen_model"),
            "via": decision.get("via"),
            "servedBy": decision.get("served_by"),
            "status": decision.get("status") or "unknown",
            "latencyMs": maybe_number(decision.get("latency_ms")),
            "consideredJson": decision.get("considered"),
            "classificationJson": decision.get("classification_json"),
            "classifierModel": classification.get("classifier_model"),
            "whyLogJson": decision.get("why_log"),
            "rejectionsJson": decision.get("rejections"),
            "verificationJson": decision.get("verification_json"),
            "quotaSnapshotJson": decision.get("quota_snapshot"),
            "circuitSnapshotJson": decision.get("circuit_snapshot"),
        })
    return len(decisions)


def sync_verification_jobs() -> int:
    jobs = get_json(f"{DISPATCH_URL}/verification/jobs").get("jobs", [])
    allowed = {"pending", "passed", "failed", "needs_review", "verifier_unavailable", "timeout"}
    for job in jobs:
        attempts = parse_json(job.get("attempts_json"), []) or []
        if not isinstance(attempts, list):
            attempts = []
        status = job.get("status")
        state = status if status in allowed else "needs_review"
        verifier = next((a for a in attempts if a.get("status") == "passed" and (a.get("surface") or a.get("model"))), None)
        if verifier is None:
            verifier = next((a for a in attempts if a.get("surface") or a.get("model")), {})
        post_convex("work:recordVerificationRun", {
            "runId": f"dispatch-verification:{job.get('id')}",
            "routingDecisionId": f"dispatch:{job.get('routing_decision_id')}" if job.get("routing_decision_id") else None,
            "verifierSurface": verifier.get("surface"),
            "verifierModel": verifier.get("model"),
            "state": state,
            "summary": f"Async verifier {state}",
            "attemptsJson": job.get("attempts_json") or "[]",
            "startedAt": int(time.time() * 1000),
            "completedAt": None if state == "pending" else int(time.time() * 1000),
        })
    return len(jobs)


def sync_once() -> dict[str, Any]:
    result: dict[str, Any] = {
        "models": sync_models(),
        "decisions": sync_decisions(),
        "jobs": sync_verification_jobs(),
    }
    result["runtime"] = sync_runtime_health()
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    while True:
        result = sync_once()
        print(time.strftime("%Y-%m-%dT%H:%M:%S"), json.dumps(result), flush=True)
        if args.once:
            return
        time.sleep(SYNC_INTERVAL_MS / 1000)


if __name__ == "__main__":
    main()
