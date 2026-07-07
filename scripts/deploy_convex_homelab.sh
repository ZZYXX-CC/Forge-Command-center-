#!/usr/bin/env bash
set -euo pipefail

# Deploy self-hosted Convex to the FORGE homelab through the Proxmox host.
# Creates/updates /opt/forge-convex inside the Convex LXC and starts the
# official Convex backend + dashboard Docker Compose stack.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXMOX_HOST="${PROXMOX_HOST:-forge-node-01}"
LXC_ID="${LXC_ID:-102}"
CONVEX_HOST="${CONVEX_HOST:-192.168.1.179}"
CONVEX_BACKEND_URL="${CONVEX_BACKEND_URL:-http://${CONVEX_HOST}:3210}"
CONVEX_SITE_URL="${CONVEX_SITE_URL:-http://${CONVEX_HOST}:3211}"
CONVEX_DASHBOARD_URL="${CONVEX_DASHBOARD_URL:-http://${CONVEX_HOST}:6791}"
REMOTE_DIR="/opt/forge-convex"
REMOTE_TMP="/tmp/forge-convex-deploy-$(date +%Y%m%d%H%M%S)"
LOCAL_ENV="$(mktemp)"
trap 'rm -f "$LOCAL_ENV"' EXIT

cd "$REPO_ROOT"

echo "Deploying self-hosted Convex via ${PROXMOX_HOST} -> LXC ${LXC_ID}"
echo "Backend:   ${CONVEX_BACKEND_URL}"
echo "Site:      ${CONVEX_SITE_URL}"
echo "Dashboard: ${CONVEX_DASHBOARD_URL}"

if ! ssh "$PROXMOX_HOST" "pct exec '$LXC_ID' -- test -f '$REMOTE_DIR/.env'"; then
  umask 077
  cat > "$LOCAL_ENV" <<EOF
PORT=3210
SITE_PROXY_PORT=3211
DASHBOARD_PORT=6791
CONVEX_CLOUD_ORIGIN=${CONVEX_BACKEND_URL}
CONVEX_SITE_ORIGIN=${CONVEX_SITE_URL}
NEXT_PUBLIC_DEPLOYMENT_URL=${CONVEX_BACKEND_URL}
INSTANCE_NAME=forge-command-center
INSTANCE_SECRET=$(openssl rand -hex 32)
DISABLE_BEACON=true
EOF
else
  : > "$LOCAL_ENV"
fi

ssh "$PROXMOX_HOST" "mkdir -p '$REMOTE_TMP'"
scp infra/convex/docker-compose.yml "$PROXMOX_HOST:$REMOTE_TMP/docker-compose.yml"
if [ -s "$LOCAL_ENV" ]; then
  scp "$LOCAL_ENV" "$PROXMOX_HOST:$REMOTE_TMP/.env"
fi

ssh "$PROXMOX_HOST" "
  set -euo pipefail
  pct exec '$LXC_ID' -- mkdir -p '$REMOTE_DIR'
  pct push '$LXC_ID' '$REMOTE_TMP/docker-compose.yml' '$REMOTE_DIR/docker-compose.yml'
  if [ -f '$REMOTE_TMP/.env' ]; then
    pct push '$LXC_ID' '$REMOTE_TMP/.env' '$REMOTE_DIR/.env'
    pct exec '$LXC_ID' -- chmod 600 '$REMOTE_DIR/.env'
  fi
  pct exec '$LXC_ID' -- bash -lc 'cd $REMOTE_DIR && docker compose up -d'
"

echo
echo "Health check:"
python3 - <<PY
import time
import urllib.request

backend = "${CONVEX_BACKEND_URL}"
for attempt in range(1, 31):
    try:
        with urllib.request.urlopen(f"{backend}/version", timeout=5) as r:
            print(r.read().decode().strip())
            break
    except Exception:
        if attempt == 30:
            raise
        time.sleep(2)
PY

echo
echo "Convex containers:"
ssh "$PROXMOX_HOST" "pct exec '$LXC_ID' -- bash -lc 'cd $REMOTE_DIR && docker compose ps'"

echo
echo "Generate/admin key command if needed:"
echo "ssh ${PROXMOX_HOST} \"pct exec ${LXC_ID} -- bash -lc 'cd ${REMOTE_DIR} && docker compose exec backend ./generate_admin_key.sh'\""

echo
echo "Self-hosted Convex deploy complete."
