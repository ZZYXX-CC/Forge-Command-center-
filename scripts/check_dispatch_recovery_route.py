#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
import textwrap

PROXMOX_HOST = "forge-node-01"
LXC_ID = "101"

REMOTE_CODE = r"""
import json
import os
import sqlite3
import sys
import tempfile
import time
from pathlib import Path

tmp = tempfile.NamedTemporaryFile(prefix="dispatch-recovery-", suffix=".db", delete=False)
tmp.close()
os.environ["DISPATCH_DB"] = tmp.name
sys.path.insert(0, "/opt/dispatch/router")

import dispatch_router as R

def copy_live_runtime_state():
    live = "/opt/dispatch/router/dispatch-log.db"
    if not Path(live).exists():
        return
    src = sqlite3.connect(live)
    src.row_factory = sqlite3.Row
    dst = sqlite3.connect(tmp.name)
    R._ensure_runtime_table(dst)
    try:
        rows = src.execute("SELECT * FROM model_runtime_state").fetchall()
    except sqlite3.Error:
        rows = []
    for row in rows:
        dst.execute(
            '''INSERT INTO model_runtime_state(surface,model,failure_count,circuit_open_until,quota_reset_at,last_success,last_failure,last_error)
               VALUES(?,?,?,?,?,?,?,?)
               ON CONFLICT(surface,model) DO UPDATE SET
                 failure_count=excluded.failure_count,
                 circuit_open_until=excluded.circuit_open_until,
                 quota_reset_at=excluded.quota_reset_at,
                 last_success=excluded.last_success,
                 last_failure=excluded.last_failure,
                 last_error=excluded.last_error''',
            (
                row["surface"], row["model"], row["failure_count"], row["circuit_open_until"],
                row["quota_reset_at"], row["last_success"], row["last_failure"], row["last_error"],
            ),
        )
    dst.commit()
    dst.close()
    src.close()

def seed_cooldowns():
    con = sqlite3.connect(tmp.name)
    R._ensure_runtime_table(con)
    now = time.time()
    reset_at = now + 3600
    blocked = [
        ("claude-code", "claude-sonnet-5"),
        ("claude-code", "claude-opus-4-8"),
        ("claude-code", "claude-fable-5"),
        ("codex-cli-gpt55", "gpt-5.5"),
        ("hermes-kern-gpt55", "gpt-5.5"),
        ("codex", "gpt-5.5"),
        ("gemini-cli", "gemini-3.1-pro-preview"),
    ]
    for surface, model in blocked:
        con.execute(
            '''INSERT INTO model_runtime_state(surface,model,failure_count,circuit_open_until,quota_reset_at,last_failure,last_error)
               VALUES(?,?,?,?,?,?,?)
               ON CONFLICT(surface,model) DO UPDATE SET
                 failure_count=excluded.failure_count,
                 quota_reset_at=excluded.quota_reset_at,
                 last_failure=excluded.last_failure,
                 last_error=excluded.last_error''',
            (surface, model, 1, None, reset_at, now, "simulated subscription quota cooldown"),
        )
    con.commit()
    con.close()

try:
    copy_live_runtime_state()
    seed_cooldowns()
    cfg = R.load_config()
    cls = R.classify(
        "Plan a high-stakes architecture recovery path.",
        routing_intent={
            "task_type": "planning",
            "domain": "planning",
            "sensitivity": "high",
            "verification_policy": "required",
        },
    )
    sel = R.select(cfg, cls)
    chosen = sel.get("chosen") or {}
    payload = {
        "ok": bool(chosen.get("surface")),
        "zenmuxChosen": chosen.get("surface") == "zenmux",
        "chosen": {
            "surface": chosen.get("surface"),
            "model": chosen.get("model"),
            "proxy": chosen.get("proxy"),
            "available": chosen.get("available"),
            "rejection_reason": chosen.get("rejection_reason"),
        },
        "zenmuxCandidates": [
            {
                "model": rec.get("model"),
                "available": rec.get("available"),
                "rejection_reason": rec.get("rejection_reason"),
            }
            for rec in sel.get("considered", [])
            if rec.get("surface") == "zenmux"
        ],
        "subscriptionRejections": [
            {
                "surface": rec.get("surface"),
                "model": rec.get("model"),
                "reason": rec.get("rejection_reason"),
            }
            for rec in sel.get("considered", [])
            if rec.get("billing") == "subscription" and rec.get("rejection_reason")
        ],
        "whyLog": sel.get("why_log") or [],
    }
    print(json.dumps(payload, indent=2))
    raise SystemExit(0 if payload["ok"] else 1)
finally:
    try:
        Path(tmp.name).unlink()
    except FileNotFoundError:
        pass
"""


def main() -> int:
    cmd = [
        "ssh",
        PROXMOX_HOST,
        f"pct exec {LXC_ID} -- /opt/litellm/venv/bin/python3 -",
    ]
    result = subprocess.run(
        cmd,
        input=textwrap.dedent(REMOTE_CODE),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
