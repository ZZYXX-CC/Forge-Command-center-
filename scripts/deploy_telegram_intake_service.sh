#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXMOX_HOST="${PROXMOX_HOST:-forge-node-01}"
LXC_ID="${LXC_ID:-101}"
SERVICE_DIR="${SERVICE_DIR:-/opt/dispatch/telegram}"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
SAGE_PROFILE_DIR="${SAGE_PROFILE_DIR:-$HERMES_HOME/profiles/sage}"
SAGE_ENV_FILE="${SAGE_ENV_FILE:-$SAGE_PROFILE_DIR/.env}"
SERVICE_NAME="${SERVICE_NAME:-forge-sage-telegram-intake.service}"
REMOTE_TMP="/tmp/telegram-intake-deploy-$(date +%Y%m%d%H%M%S)"

if [[ "${FORGE_TELEGRAM_OWN_POLLER:-0}" != "1" ]]; then
  if pgrep -fl "hermes_cli.main --profile sage gateway run" >/dev/null 2>&1; then
    cat >&2 <<'EOF'
Refusing to deploy a second Telegram poller while the main SAGE Hermes gateway is running.

SAGE Telegram is an input channel for the main Hermes agent. Running this service
with the same bot token would compete with Hermes getUpdates polling.

Preferred path:
  - Let Hermes own Telegram.
  - Use the Command Center chat and SAGE handoff utility to create Convex work items.

If you deliberately want FORGE's direct intake service to own the SAGE bot token,
stop the SAGE Hermes gateway first and rerun with:
  FORGE_TELEGRAM_OWN_POLLER=1 scripts/deploy_telegram_intake_service.sh
EOF
    exit 1
  fi
fi

if [[ -z "${SAGE_TELEGRAM_BOT_TOKEN:-}" && -z "${SAGE_TELEGRAM_BOT_TOKEN_FILE:-}" && ! -f "$SAGE_ENV_FILE" ]]; then
  echo "Missing SAGE Hermes env file or explicit token source: $SAGE_ENV_FILE" >&2
  exit 1
fi

ENV_FILE="$(mktemp)"
trap 'rm -f "$ENV_FILE"' EXIT

python3 - "$SAGE_ENV_FILE" > "$ENV_FILE" <<'PY'
import json
import os
import pathlib
import re
import shlex
import sys

def parse_env(path):
    values = {}
    if not path.exists():
        return values
    for raw in path.read_text(errors="ignore").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip("'").strip('"')
        values[key.strip()] = value
    return values

sage_env = pathlib.Path(sys.argv[1])
values = parse_env(sage_env)
token = os.environ.get("SAGE_TELEGRAM_BOT_TOKEN", "").strip()
token_file = os.environ.get("SAGE_TELEGRAM_BOT_TOKEN_FILE", "").strip()
if token_file:
    token = pathlib.Path(token_file).read_text().strip()
if not token:
    token = values.get("TELEGRAM_BOT_TOKEN", "").strip()
allowed_users = os.environ.get("TELEGRAM_ALLOWED_USER_IDS", "").strip() or values.get("TELEGRAM_ALLOWED_USERS", "").strip()
allowed_groups = os.environ.get("TELEGRAM_ALLOWED_CHAT_IDS", "").strip() or values.get("TELEGRAM_GROUP_ALLOWED_USERS", "").strip()
allowed_chats = ",".join(x for x in (allowed_users, allowed_groups) if x)
if not token:
    raise SystemExit("SAGE Telegram token missing. Set SAGE_TELEGRAM_BOT_TOKEN(_FILE) or TELEGRAM_BOT_TOKEN in the SAGE Hermes profile .env.")
if not allowed_chats:
    raise SystemExit("SAGE Telegram allowlist missing. Set TELEGRAM_ALLOWED_USERS in the SAGE Hermes profile .env or TELEGRAM_ALLOWED_USER_IDS.")
if not re.match(r"^\d{8,}:[A-Za-z0-9_-]{20,}$", token):
    raise SystemExit("SAGE Telegram token does not look like a Telegram bot token.")
bots = {"sage": {"token": token, "name": "SAGE"}}
print("CONVEX_URL=http://192.168.1.179:3210")
print("TELEGRAM_REQUIRE_MENTION_IN_GROUPS=1")
print("TELEGRAM_PROCESS_BACKLOG=0")
print("TELEGRAM_ALLOWED_USER_IDS=" + allowed_users)
print("TELEGRAM_ALLOWED_CHAT_IDS=" + allowed_chats)
print("TELEGRAM_BOTS_JSON=" + shlex.quote(json.dumps(bots, separators=(",", ":"))))
PY

cd "$REPO_ROOT"
ssh "$PROXMOX_HOST" "mkdir -p '$REMOTE_TMP'"
scp scripts/telegram_intake.py "$ENV_FILE" "$PROXMOX_HOST:$REMOTE_TMP/"

ssh "$PROXMOX_HOST" "
  set -e
  pct exec '$LXC_ID' -- mkdir -p '$SERVICE_DIR'
  pct push '$LXC_ID' '$REMOTE_TMP/telegram_intake.py' '$SERVICE_DIR/telegram_intake.py'
  pct push '$LXC_ID' '$REMOTE_TMP/$(basename "$ENV_FILE")' '$SERVICE_DIR/telegram-intake.env'
  pct exec '$LXC_ID' -- chmod +x '$SERVICE_DIR/telegram_intake.py'
  pct exec '$LXC_ID' -- chmod 600 '$SERVICE_DIR/telegram-intake.env'
  pct exec '$LXC_ID' -- sh -lc 'set -e
    cat > /etc/systemd/system/$SERVICE_NAME <<UNIT
[Unit]
Description=FORGE SAGE Telegram intake to Convex Work Registry
After=network-online.target dispatch-service.service forge-sage-orchestrator.service
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$SERVICE_DIR
EnvironmentFile=$SERVICE_DIR/telegram-intake.env
ExecStart=/usr/bin/python3 $SERVICE_DIR/telegram_intake.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
UNIT
    systemctl daemon-reload
    systemctl enable --now $SERVICE_NAME
    systemctl restart $SERVICE_NAME
    systemctl is-active $SERVICE_NAME
  '
"

echo "SAGE Telegram intake service deployed."
