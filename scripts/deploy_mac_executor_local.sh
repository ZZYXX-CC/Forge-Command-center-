#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/dispatch/executor/executor.py"
LIVE_DIR="${DISPATCH_EXECUTOR_DIR:-$HOME/.dispatch-executor}"
LIVE="$LIVE_DIR/executor.py"
LABEL="${DISPATCH_EXECUTOR_LABEL:-ai.forge.dispatch-executor}"
PORT="${EXECUTOR_PORT:-4100}"

if [[ ! -f "$SRC" ]]; then
  echo "missing executor source: $SRC" >&2
  exit 1
fi

mkdir -p "$LIVE_DIR"
install -m 700 "$SRC" "$LIVE"

if launchctl print "gui/$(id -u)/$LABEL" >/dev/null 2>&1; then
  launchctl kickstart -k "gui/$(id -u)/$LABEL"
else
  echo "LaunchAgent $LABEL is not loaded; copied executor but did not restart it." >&2
fi

sleep 2
curl -fsS "http://127.0.0.1:$PORT/health"
echo
