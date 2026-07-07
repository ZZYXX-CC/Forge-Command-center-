#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
import textwrap

PROXMOX_HOST = "forge-node-01"
LXC_ID = "101"

REMOTE_CODE = r"""
import calendar
import json
import os
import sqlite3
import sys
import tempfile
import time
from pathlib import Path

tmp = tempfile.NamedTemporaryFile(prefix="dispatch-subscription-limit-", suffix=".db", delete=False)
tmp.close()
os.environ["DISPATCH_DB"] = tmp.name
sys.path.insert(0, "/opt/dispatch/router")

import dispatch_router as R

def future_reset_phrase():
    future = time.localtime(time.time() + 86400)
    month = calendar.month_abbr[future.tm_mon]
    hour = future.tm_hour
    marker = "am" if hour < 12 else "pm"
    hour_12 = hour % 12 or 12
    return f"You've hit your weekly limit - resets {month} {future.tm_mday} at {hour_12}{marker} (Africa/Lagos)"

def seed_subscription_limit(message):
    con = sqlite3.connect(tmp.name)
    R._ensure_runtime_table(con)
    con.execute(
        '''INSERT INTO model_runtime_state(surface,model,failure_count,last_failure,last_error)
           VALUES(?,?,?,?,?)''',
        ("claude-code", "claude-sonnet-5", 1, time.time(), message),
    )
    con.commit()
    con.close()

try:
    message = future_reset_phrase()
    seed_subscription_limit(message)
    R.executor_surfaces = lambda: set(R.CLI_SURFACES)
    R.litellm_models = lambda: set(R.LITELLM_MODEL_PROXY_ALIASES.values())

    cfg = R.load_config()
    cls = R.classify(
        "Plan an infrastructure recovery and round-clock orchestration improvement.",
        routing_intent={
            "task_type": "planning",
            "domain": "infrastructure",
            "verification_policy": "required",
        },
    )
    selected = R.select(cfg, cls)
    chosen = selected.get("chosen") or {}
    claude = next(
        (
            row
            for row in selected.get("considered", [])
            if row.get("surface") == "claude-code" and row.get("model") == "claude-sonnet-5"
        ),
        {},
    )
    payload = {
        "ok": claude.get("rejection_reason") == "quota_exhausted"
        and not (chosen.get("surface") == "claude-code" and chosen.get("model") == "claude-sonnet-5"),
        "seededError": message,
        "chosen": {
            "surface": chosen.get("surface"),
            "model": chosen.get("model"),
            "rejection_reason": chosen.get("rejection_reason"),
        },
        "claudeSonnet": {
            "quota_reset_at": claude.get("quota_reset_at"),
            "quota_remaining": claude.get("quota_remaining"),
            "rejection_reason": claude.get("rejection_reason"),
            "last_error": claude.get("last_error"),
        },
        "whyLog": selected.get("why_log") or [],
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
