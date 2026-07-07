#!/usr/bin/env python3
from __future__ import annotations

import copy
import json
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

import scripts.sage_orchestrator as S


NOW = int(time.time() * 1000)
WORK_ITEMS = {
    "work-temp": {
        "workId": "work-temp",
        "title": "Temporary timeout recovery",
        "status": "blocked",
        "priority": "medium",
        "orchestrator": "SAGE",
        "executor": "DISPATCH",
        "owner": "kern",
        "blocker": "timed out",
        "updatedAt": NOW - 3_600_000,
    },
    "work-permanent": {
        "workId": "work-permanent",
        "title": "Permanent blocker",
        "status": "blocked",
        "priority": "medium",
        "orchestrator": "SAGE",
        "executor": "DISPATCH",
        "owner": "kern",
        "blocker": "manual review required",
        "updatedAt": NOW - 3_600_000,
    },
}
EVENTS = {
    "work-temp": [],
    "work-permanent": [],
    "work-failed": [],
}
EXECUTOR_RUNS = []
ROUTING_DECISIONS = []


def fake_query(path: str, args: dict):
    if path == "work:listWorkItems":
        status = args.get("status")
        limit = args.get("limit", 25)
        rows = [copy.deepcopy(item) for item in WORK_ITEMS.values() if item.get("status") == status]
        return rows[:limit]
    if path == "work:getWorkItem":
        work_id = args["workId"]
        return {
            "item": copy.deepcopy(WORK_ITEMS[work_id]),
            "events": copy.deepcopy(EVENTS.get(work_id, [])),
        }
    if path == "work:listVerificationRuns":
        return []
    raise AssertionError(f"unexpected query: {path}")


def fake_mutation(path: str, args: dict):
    if path == "work:updateWorkItem":
        work_id = args["workId"]
        WORK_ITEMS[work_id].update({k: v for k, v in args.items() if k != "workId"})
        WORK_ITEMS[work_id]["updatedAt"] = NOW
        return work_id
    if path == "work:addWorkEvent":
        EVENTS.setdefault(args["workId"], []).append(copy.deepcopy(args))
        return args["workId"]
    if path == "work:recordExecutorRun":
        existing = next((run for run in EXECUTOR_RUNS if run["runId"] == args["runId"]), None)
        if existing:
            existing.update(copy.deepcopy(args))
        else:
            EXECUTOR_RUNS.append(copy.deepcopy(args))
        return args["runId"]
    if path == "work:upsertRoutingDecision":
        ROUTING_DECISIONS.append(copy.deepcopy(args))
        return args["sourceId"]
    if path == "work:upsertWorkItem":
        WORK_ITEMS[args["workId"]] = copy.deepcopy(args)
        return args["workId"]
    raise AssertionError(f"unexpected mutation: {path}")


def main() -> int:
    S.convex_query = fake_query
    S.convex_mutation = fake_mutation
    S.BLOCKED_RETRY_AFTER_MS = 30 * 60 * 1000
    S.MAX_BLOCKED_REQUEUES = 1
    recovered = S.recover_blocked_dispatch_items()
    failed_item = {
        "workId": "work-failed",
        "title": "Failed dispatch bookkeeping",
        "status": "ready",
        "priority": "medium",
        "orchestrator": "SAGE",
        "executor": "DISPATCH",
        "owner": "kern",
        "summary": "Exercise failure artifact recording.",
    }
    WORK_ITEMS["work-failed"] = copy.deepcopy(failed_item)
    failure_run_id = f"sage-dispatch:{failed_item['workId']}:{NOW - 1000}"
    fake_mutation("work:recordExecutorRun", {
        "workId": failed_item["workId"],
        "runId": failure_run_id,
        "executor": "SAGE",
        "surface": "dispatch-auto",
        "status": "running",
        "startedAt": NOW - 1000,
    })
    failure = S.record_sage_dispatch_failure(failed_item, TimeoutError("timed out"), NOW - 1000, failure_run_id)
    success_item = {
        "workId": "work-success",
        "title": "Successful dispatch bookkeeping",
        "status": "ready",
        "priority": "low",
        "orchestrator": "SAGE",
        "executor": "DISPATCH",
        "owner": "kern",
        "dryRun": True,
        "summary": "Exercise running run update on success.",
    }
    WORK_ITEMS["work-success"] = copy.deepcopy(success_item)
    EVENTS["work-success"] = []
    S.dispatch_chat = lambda _payload: {
        "model": "dispatch-auto",
        "choices": [{"message": {"content": "Dry run: would route to nim / deepseek-ai/deepseek-v4-pro."}}],
        "x_dispatch": {
            "chosen_surface": "nim",
            "chosen_model": "deepseek-ai/deepseek-v4-pro",
            "via": "litellm",
            "classification": {"confidence": "explicit"},
            "verification": {"state": "waived"},
            "why_log": ["test route"],
        },
    }
    success = S.dispatch_work_item(success_item)
    success_runs = [run for run in EXECUTOR_RUNS if run.get("workId") == "work-success"]
    failed_runs = [run for run in EXECUTOR_RUNS if run.get("workId") == "work-failed"]
    payload = {
        "ok": (
            recovered == [{"workId": "work-temp", "status": "requeued", "retry": 1}]
            and WORK_ITEMS["work-temp"]["status"] == "ready"
            and WORK_ITEMS["work-temp"]["blocker"] == ""
            and WORK_ITEMS["work-permanent"]["status"] == "blocked"
            and len(EVENTS["work-temp"]) == 1
            and EVENTS["work-temp"][0]["type"] == "sage_blocked_requeued"
            and failure["status"] == "blocked"
            and WORK_ITEMS["work-failed"]["status"] == "blocked"
            and len(failed_runs) == 1
            and failed_runs[0]["runId"] == failure_run_id
            and failed_runs[0]["status"] == "error"
            and failed_runs[0]["error"] == "timed out"
            and len(EVENTS["work-failed"]) == 1
            and EVENTS["work-failed"][0]["type"] == "sage_dispatch_failed"
            and success["status"] == "done"
            and WORK_ITEMS["work-success"]["status"] == "done"
            and len(success_runs) == 1
            and success_runs[0]["status"] == "ok"
            and success_runs[0]["surface"] == "nim"
            and success_runs[0].get("completedAt") is not None
            and len(ROUTING_DECISIONS) == 1
            and ROUTING_DECISIONS[0]["workId"] == "work-success"
        ),
        "recovered": recovered,
        "failure": failure,
        "success": success,
        "temporary": WORK_ITEMS["work-temp"],
        "permanent": WORK_ITEMS["work-permanent"],
        "failed": WORK_ITEMS["work-failed"],
        "successful": WORK_ITEMS["work-success"],
        "events": EVENTS["work-temp"],
        "failedEvents": EVENTS["work-failed"],
        "successEvents": EVENTS["work-success"],
        "executorRuns": EXECUTOR_RUNS,
        "routingDecisions": ROUTING_DECISIONS,
    }
    print(json.dumps(payload, indent=2))
    return 0 if payload["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
