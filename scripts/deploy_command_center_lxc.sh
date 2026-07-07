#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXMOX_HOST="${PROXMOX_HOST:-forge-node-01}"
LXC_ID="${LXC_ID:-104}"
REMOTE_TMP="/tmp/command-center-deploy-$(date +%Y%m%d%H%M%S)"
REMOTE_TAR="$REMOTE_TMP/dist.tgz"
WEB_ROOT="${WEB_ROOT:-/var/www/forge-command-center}"
PUBLIC_URL="${PUBLIC_URL:-http://command-center.nuvuestudio.net}"
export VITE_CONVEX_URL="${VITE_CONVEX_URL:-${PUBLIC_URL%/}/api/convex}"
export VITE_CONVEX_SITE_URL="${VITE_CONVEX_SITE_URL:-${PUBLIC_URL%/}/api/convex-site}"

cd "$REPO_ROOT"

echo "Building Command Center..."
npm run build -- --mode production

echo "Packaging dist..."
tar -C dist -czf /tmp/command-center-dist.tgz .

echo "Deploying Command Center via ${PROXMOX_HOST} -> LXC ${LXC_ID}"
ssh "$PROXMOX_HOST" "mkdir -p '$REMOTE_TMP'"
scp /tmp/command-center-dist.tgz "$PROXMOX_HOST:$REMOTE_TAR"

ssh "$PROXMOX_HOST" "
  set -e
  pct exec '$LXC_ID' -- mkdir -p /tmp/command-center-deploy '$WEB_ROOT'
  pct push '$LXC_ID' '$REMOTE_TAR' /tmp/command-center-deploy/dist.tgz
  pct exec '$LXC_ID' -- sh -lc 'set -e
    backup=/var/www/forge-command-center-backup-\$(date +%Y%m%d%H%M%S)
    if [ -d \"$WEB_ROOT\" ]; then cp -a \"$WEB_ROOT\" \"\$backup\"; fi
    rm -rf \"$WEB_ROOT\"/*
    tar -xzf /tmp/command-center-deploy/dist.tgz -C \"$WEB_ROOT\"
    chown -R www-data:www-data \"$WEB_ROOT\"
    nginx -t
    systemctl reload nginx
  '
"

echo "Health check: $PUBLIC_URL/healthz"
curl -fsS "$PUBLIC_URL/healthz"
echo
echo "Command Center deploy complete."
