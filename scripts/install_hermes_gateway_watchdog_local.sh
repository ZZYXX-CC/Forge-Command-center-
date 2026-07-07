#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="${SCRIPT_DIR:-/Users/ichris/Library/Scripts/Hermes}"
LAUNCH_AGENTS="${LAUNCH_AGENTS:-/Users/ichris/Library/LaunchAgents}"
LABEL="ai.hermes.gateway-watchdog"
UID_NUM="$(id -u)"

mkdir -p "$SCRIPT_DIR" "$LAUNCH_AGENTS" /tmp/openclaw

install -m 700 "$ROOT/hermes/bin/hermes-profile-gateway" "$SCRIPT_DIR/hermes-profile-gateway"
install -m 700 "$ROOT/hermes/bin/hermes-gateway-watchdog" "$SCRIPT_DIR/hermes-gateway-watchdog"
install -m 644 "$ROOT/hermes/LaunchAgents/$LABEL.plist" "$LAUNCH_AGENTS/$LABEL.plist"

plutil -lint "$LAUNCH_AGENTS/$LABEL.plist"

launchctl bootout "gui/$UID_NUM/$LABEL" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$UID_NUM" "$LAUNCH_AGENTS/$LABEL.plist"
launchctl enable "gui/$UID_NUM/$LABEL" >/dev/null 2>&1 || true
launchctl kickstart -k "gui/$UID_NUM/$LABEL" >/dev/null 2>&1 || true
launchctl print "gui/$UID_NUM/$LABEL" >/dev/null

echo "Hermes gateway watchdog installed and running: $LABEL"
