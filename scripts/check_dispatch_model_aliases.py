#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
import urllib.request
from typing import Any

DISPATCH_URL = os.environ.get("DISPATCH_URL", "http://192.168.1.178:4001").rstrip("/")
LITELLM_URL = os.environ.get("LITELLM_URL", "http://192.168.1.178:4000").rstrip("/")
OPTIONAL_MISSING = {
    "nim/nvidia/nemotron-3-ultra-550b-a55b",
    "nim/minimaxai/minimax-m3",
}


def get_json(url: str) -> dict[str, Any]:
    with urllib.request.urlopen(url, timeout=20) as response:
        return json.load(response)


def main() -> int:
    registry = get_json(f"{DISPATCH_URL}/registry/status").get("models", [])
    litellm_ids = {
        row.get("id")
        for row in get_json(f"{LITELLM_URL}/v1/models").get("data", [])
        if row.get("id")
    }
    api_rows = [
        row for row in registry
        if row.get("provider") in {"ollama", "nvidia-nim", "openrouter", "zenmux"}
    ]
    missing_aliases = []
    optional_missing = []
    ready = []
    degraded = []
    for row in api_rows:
        runtime = row.get("runtime") or {}
        proxy = runtime.get("detail")
        alias_present = bool(proxy and proxy in litellm_ids)
        runtime_available = runtime.get("available") is True
        item = {
            "registryId": row.get("id"),
            "provider": row.get("provider"),
            "surface": row.get("surface"),
            "model": row.get("model"),
            "proxy": proxy,
            "aliasPresent": alias_present,
            "runtimeHealth": runtime.get("health"),
            "runtimeAvailable": runtime.get("available"),
            "lastError": runtime.get("last_error"),
        }
        if alias_present and runtime_available:
            ready.append(item)
        elif item["registryId"] in OPTIONAL_MISSING:
            optional_missing.append(item)
        elif alias_present:
            degraded.append(item)
        else:
            missing_aliases.append(item)
    ok_aliases = not missing_aliases
    ok_runtime = ok_aliases and not degraded
    payload = {
        "ok": ok_aliases,
        "runtimeUsable": ok_runtime,
        "litellmModels": sorted(litellm_ids),
        "ready": ready,
        "degradedRuntime": degraded,
        "missingRequiredAliases": missing_aliases,
        "missingOptional": optional_missing,
        "missing": missing_aliases + optional_missing,
    }
    print(json.dumps(payload, indent=2))
    return 0 if ok_aliases else 1


if __name__ == "__main__":
    sys.exit(main())
