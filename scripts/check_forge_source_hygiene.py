#!/usr/bin/env python3
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_SOURCE = [
    "convex/schema.ts",
    "convex/work.ts",
    "dispatch/dispatch.config.yaml",
    "dispatch/litellm/config.yaml",
    "dispatch/registry/models.yaml",
    "dispatch/registry/registry.py",
    "dispatch/router/dispatch_router.py",
    "dispatch/router/dispatch_service.py",
    "dispatch/executor/executor.py",
    "scripts/dispatch_convex_sync.py",
    "scripts/sage_orchestrator.py",
    "scripts/telegram_intake.py",
    "scripts/deploy_command_center_lxc.sh",
    "scripts/deploy_convex_functions_homelab.sh",
    "scripts/deploy_dispatch_sync_service.sh",
    "scripts/deploy_litellm_config_via_proxmox.sh",
    "scripts/deploy_mac_executor_local.sh",
    "scripts/deploy_sage_orchestrator_service.sh",
    "scripts/deploy_telegram_intake_service.sh",
    "scripts/check_dispatch_model_aliases.py",
    "scripts/check_dispatch_recovery_route.py",
    "src/pages/Audit.tsx",
    "src/pages/Dispatch.tsx",
    "src/pages/Tasks.tsx",
    "docs/FORGE_FLEET_BUILD_PROGRESS.md",
    "docs/ZENMUX_PROVIDER_SETUP.md",
]

ALLOWED_PLACEHOLDERS = {
    "PASTE_ZENMUX_KEY_HERE",
    "YOUR_REAL_ZENMUX_KEY",
}

SECRET_PATTERNS = [
    re.compile(r"nvapi-[A-Za-z0-9_-]{20,}"),
    re.compile(r"sk-or-v1-[A-Za-z0-9]{20,}"),
    re.compile(r"\b\d{8,}:[A-Za-z0-9_-]{25,}\b"),
]

SKIP_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".playwright-cli",
    ".hermes",
}


def git_check_ignore(path: str) -> bool:
    result = subprocess.run(
        ["git", "check-ignore", "-q", path],
        cwd=ROOT,
        check=False,
    )
    return result.returncode == 0


def iter_source_files() -> list[Path]:
    files: list[Path] = []
    for base, dirs, filenames in os.walk(ROOT):
      dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
      for filename in filenames:
          path = Path(base) / filename
          if path.suffix in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".tgz", ".zip"}:
              continue
          files.append(path)
    return files


def check_required_source() -> list[str]:
    missing = [path for path in REQUIRED_SOURCE if not (ROOT / path).exists()]
    return [f"missing required source: {path}" for path in missing]


def check_ignored_artifacts() -> list[str]:
    errors = []
    for path in [".playwright-cli", ".hermes", ".env.local"]:
        if not git_check_ignore(path):
            errors.append(f"expected gitignore coverage for {path}")
    return errors


def check_secrets() -> list[str]:
    errors = []
    for path in iter_source_files():
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        except OSError:
            continue
        for pattern in SECRET_PATTERNS:
            for match in pattern.findall(text):
                if match in ALLOWED_PLACEHOLDERS:
                    continue
                rel = path.relative_to(ROOT)
                errors.append(f"possible committed secret in {rel}: {match[:8]}...")
    return errors


def main() -> int:
    errors = []
    errors.extend(check_required_source())
    errors.extend(check_ignored_artifacts())
    errors.extend(check_secrets())
    if errors:
        print("FORGE source hygiene failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("FORGE source hygiene ok")
    print(f"required_source={len(REQUIRED_SOURCE)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
