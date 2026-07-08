#!/usr/bin/env python3
"""Smoke-check DISPATCH manual verification state updates."""
from __future__ import annotations

import json
import sqlite3
import sys
import tempfile
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "dispatch" / "router"))

# Keep this smoke test dependency-light: dispatch_router imports yaml at module
# import time, but the manual verification helper exercised here does not need
# YAML parsing.
yaml_stub = types.ModuleType("yaml")
setattr(yaml_stub, "safe_load", lambda *_a, **_k: None)
sys.modules.setdefault("yaml", yaml_stub)

import dispatch_router as R  # noqa: E402


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        db_path = str(Path(tmp) / "dispatch-test.db")
        con = R._db(db_path)
        con.execute(
            """INSERT INTO routing_decisions(
                ts, task, category, complexity, urgency, confidence,
                chosen_surface, chosen_model, via, served_by, latency_ms, status, considered
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                "2026-01-01T00:00:00",
                "manual verification smoke",
                "execution_routine",
                "routine",
                "queue",
                "explicit",
                "cursor",
                "composer-2.5",
                "executor",
                "cursor (mac executor)",
                123,
                "executed_verify_fail_escalated",
                "[]",
            ),
        )
        decision_id = con.execute("SELECT last_insert_rowid()").fetchone()[0]
        con.execute(
            """INSERT INTO verification_jobs(
                routing_decision_id, ts, updated_ts, status, task, output,
                classification_json, selection_json, attempts_json
            ) VALUES(?,?,?,?,?,?,?,?,?)""",
            (
                decision_id,
                "2026-01-01T00:00:00",
                "2026-01-01T00:00:00",
                "queued",
                "manual verification smoke",
                "output",
                "{}",
                "{}",
                "[]",
            ),
        )
        con.commit()
        con.close()

        result = R.mark_decision_manually_verified(
            decision_id,
            reviewer="sage",
            note="local smoke passed",
            evidence={"commands": ["npm run lint", "npm run build"]},
            db_path=db_path,
        )
        assert result is not None
        assert result["verification"]["state"] == "passed"
        assert result["verification"]["source"] == "manual"
        assert result["verification_jobs_updated"] == 1

        con = sqlite3.connect(db_path)
        con.row_factory = sqlite3.Row
        row = con.execute("SELECT verification_json FROM routing_decisions WHERE id=?", (decision_id,)).fetchone()
        job = con.execute("SELECT status, result_json FROM verification_jobs WHERE routing_decision_id=?", (decision_id,)).fetchone()
        con.close()

        verification = json.loads(row["verification_json"])
        job_result = json.loads(job["result_json"])
        assert verification["state"] == "passed"
        assert verification["attempts"][-1]["phase"] == "manual_review"
        assert job["status"] == "passed"
        assert job_result["state"] == "passed"

        print(json.dumps({"ok": True, "decision_id": decision_id, "state": verification["state"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
