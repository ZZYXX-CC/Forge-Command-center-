#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXMOX_HOST="${PROXMOX_HOST:-forge-node-01}"
LXC_ID="${LXC_ID:-101}"
SERVICE_DIR="${SERVICE_DIR:-/opt/dispatch/sage}"
REMOTE_TMP="/tmp/sage-orchestrator-deploy-$(date +%Y%m%d%H%M%S)"

cd "$REPO_ROOT"

ssh "$PROXMOX_HOST" "mkdir -p '$REMOTE_TMP'"
scp scripts/sage_orchestrator.py "$PROXMOX_HOST:$REMOTE_TMP/sage_orchestrator.py"

ssh "$PROXMOX_HOST" "
  set -e
  pct exec '$LXC_ID' -- mkdir -p '$SERVICE_DIR'
  pct push '$LXC_ID' '$REMOTE_TMP/sage_orchestrator.py' '$SERVICE_DIR/sage_orchestrator.py'
  pct exec '$LXC_ID' -- chmod +x '$SERVICE_DIR/sage_orchestrator.py'
  pct exec '$LXC_ID' -- sh -lc 'set -e
    cat > /etc/systemd/system/forge-sage-orchestrator.service <<UNIT
[Unit]
Description=FORGE SAGE orchestration worker
After=network-online.target dispatch-service.service dispatch-convex-sync.service
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$SERVICE_DIR
Environment=DISPATCH_URL=http://192.168.1.178:4001
Environment=CONVEX_URL=http://192.168.1.179:3210
Environment=SYNC_INTERVAL_MS=120000
Environment=MAX_PER_TICK=1
Environment=SAGE_DISPATCH_TIMEOUT_SECONDS=180
Environment=STALE_IN_PROGRESS_MS=2700000
Environment=MAX_STALE_REQUEUES=1
Environment=RECOVERY_SCAN_LIMIT=25
Environment=SAGE_HEARTBEAT_INTERVAL_MS=900000
Environment=BLOCKED_RETRY_AFTER_MS=1800000
Environment=MAX_BLOCKED_REQUEUES=1
ExecStart=/usr/bin/python3 $SERVICE_DIR/sage_orchestrator.py
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
UNIT
    systemctl daemon-reload
    systemctl enable --now forge-sage-orchestrator.service
    systemctl restart forge-sage-orchestrator.service
    systemctl is-active forge-sage-orchestrator.service
  '
"

echo "SAGE orchestration service deployed."
