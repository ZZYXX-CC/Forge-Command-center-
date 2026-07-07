#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/dispatch/executor/executor.py"
PLIST_SRC="$ROOT/dispatch/executor/ai.forge.dispatch-executor.plist"
LIVE_DIR="${DISPATCH_EXECUTOR_DIR:-$HOME/.dispatch-executor}"
LIVE="$LIVE_DIR/executor.py"
LABEL="${DISPATCH_EXECUTOR_LABEL:-ai.forge.dispatch-executor}"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_DEST="$LAUNCH_AGENTS_DIR/$LABEL.plist"
PORT="${EXECUTOR_PORT:-4100}"
DOMAIN="gui/$(id -u)"

if [[ ! -f "$SRC" ]]; then
  echo "missing executor source: $SRC" >&2
  exit 1
fi

if [[ ! -f "$PLIST_SRC" ]]; then
  echo "missing LaunchAgent plist: $PLIST_SRC" >&2
  exit 1
fi

mkdir -p "$LIVE_DIR"
mkdir -p "$LAUNCH_AGENTS_DIR"
install -m 700 "$SRC" "$LIVE"
install -m 600 "$PLIST_SRC" "$PLIST_DEST"

if command -v plutil >/dev/null 2>&1; then
  plutil -lint "$PLIST_DEST"
fi

if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
  launchctl kickstart -k "$DOMAIN/$LABEL"
else
  launchctl bootstrap "$DOMAIN" "$PLIST_DEST"
  launchctl enable "$DOMAIN/$LABEL"
  launchctl kickstart -k "$DOMAIN/$LABEL"
fi

sleep 2
launchctl print "$DOMAIN/$LABEL" >/dev/null
curl -fsS "http://127.0.0.1:$PORT/health"
echo
