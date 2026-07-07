#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXMOX_HOST="${PROXMOX_HOST:-forge-node-01}"
LXC_ID="${LXC_ID:-101}"
SERVICE_DIR="${SERVICE_DIR:-/opt/dispatch/sync}"
REMOTE_TMP="/tmp/dispatch-sync-deploy-$(date +%Y%m%d%H%M%S)"

cd "$REPO_ROOT"

ssh "$PROXMOX_HOST" "mkdir -p '$REMOTE_TMP'"
scp scripts/dispatch_convex_sync.py "$PROXMOX_HOST:$REMOTE_TMP/dispatch_convex_sync.py"

ssh "$PROXMOX_HOST" "
  set -e
  pct exec '$LXC_ID' -- mkdir -p '$SERVICE_DIR'
  pct push '$LXC_ID' '$REMOTE_TMP/dispatch_convex_sync.py' '$SERVICE_DIR/dispatch_convex_sync.py'
  pct exec '$LXC_ID' -- chmod +x '$SERVICE_DIR/dispatch_convex_sync.py'
  pct exec '$LXC_ID' -- sh -lc 'set -e
    cat > /etc/systemd/system/dispatch-convex-sync.service <<UNIT
[Unit]
Description=FORGE DISPATCH to Convex sync worker
After=network-online.target dispatch-service.service
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$SERVICE_DIR
Environment=DISPATCH_URL=http://192.168.1.178:4001
Environment=CONVEX_URL=http://192.168.1.179:3210
Environment=LITELLM_URL=http://192.168.1.178:4000
Environment=EXECUTOR_URL=http://192.168.1.170:4100
Environment=COMMAND_CENTER_URL=http://command-center.nuvuestudio.net
Environment=SYNC_INTERVAL_MS=60000
Environment=RUNTIME_WORK_ID=system-forge-runtime
Environment=RUNTIME_STATE_FILE=$SERVICE_DIR/runtime_health_state.json
Environment=RUNTIME_HEARTBEAT_EVENT_MS=900000
Environment=RUNTIME_SYSTEMD_UNITS=litellm,dispatch-service,dispatch-convex-sync,forge-sage-orchestrator
ExecStart=/usr/bin/python3 $SERVICE_DIR/dispatch_convex_sync.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
UNIT
    systemctl daemon-reload
    systemctl enable --now dispatch-convex-sync.service
    systemctl restart dispatch-convex-sync.service
    systemctl is-active dispatch-convex-sync.service
  '
"

echo "Dispatch Convex sync service deployed."
