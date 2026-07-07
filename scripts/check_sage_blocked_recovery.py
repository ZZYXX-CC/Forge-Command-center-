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
}


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
    payload = {
        "ok": (
            recovered == [{"workId": "work-temp", "status": "requeued", "retry": 1}]
            and WORK_ITEMS["work-temp"]["status"] == "ready"
            and WORK_ITEMS["work-temp"]["blocker"] == ""
            and WORK_ITEMS["work-permanent"]["status"] == "blocked"
            and len(EVENTS["work-temp"]) == 1
            and EVENTS["work-temp"][0]["type"] == "sage_blocked_requeued"
        ),
        "recovered": recovered,
        "temporary": WORK_ITEMS["work-temp"],
        "permanent": WORK_ITEMS["work-permanent"],
        "events": EVENTS["work-temp"],
    }
    print(json.dumps(payload, indent=2))
    return 0 if payload["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
