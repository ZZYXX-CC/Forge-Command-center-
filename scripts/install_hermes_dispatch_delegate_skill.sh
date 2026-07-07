#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_SKILL="$ROOT/hermes/skills/devops/dispatch-delegate"
HERMES_ROOT="${HERMES_ROOT:-/Volumes/Patriot 2TB/Dev Test/Forge Core/.hermes}"

if [[ ! -d "$SOURCE_SKILL" ]]; then
  echo "missing source skill: $SOURCE_SKILL" >&2
  exit 1
fi

if [[ ! -d "$HERMES_ROOT/profiles" ]]; then
  echo "missing Hermes profiles root: $HERMES_ROOT/profiles" >&2
  exit 1
fi

if [[ "$#" -gt 0 ]]; then
  PROFILES=("$@")
else
  PROFILES=(sage kern)
fi

for profile in "${PROFILES[@]}"; do
  target="$HERMES_ROOT/profiles/$profile/skills/devops/dispatch-delegate"
  if [[ ! -d "$HERMES_ROOT/profiles/$profile" ]]; then
    echo "missing Hermes profile: $profile" >&2
    exit 1
  fi

  mkdir -p "$(dirname "$target")"
  rm -rf "$target"
  cp -R "$SOURCE_SKILL" "$target"
  echo "installed dispatch-delegate skill for $profile -> $target"
done
