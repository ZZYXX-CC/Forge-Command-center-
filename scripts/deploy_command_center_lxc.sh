#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXMOX_HOST="${PROXMOX_HOST:-forge-node-01}"
LXC_ID="${LXC_ID:-104}"
REMOTE_TMP="/tmp/command-center-deploy-$(date +%Y%m%d%H%M%S)"
REMOTE_TAR="$REMOTE_TMP/dist.tgz"
WEB_ROOT="${WEB_ROOT:-/var/www/forge-command-center}"
PUBLIC_URL="${PUBLIC_URL:-https://command-center.nuvuestudio.net}"
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
    python3 - <<PY
from pathlib import Path
path = Path(\"/etc/nginx/sites-enabled/forge-command-center\")
text = path.read_text()
q = chr(39)
csp_value = (
    f\"default-src {q}self{q}; \"
    f\"script-src {q}self{q} {q}unsafe-inline{q} https://static.cloudflareinsights.com; \"
    f\"style-src {q}self{q} {q}unsafe-inline{q} https://fonts.googleapis.com; \"
    f\"img-src {q}self{q} data:; \"
    f\"font-src {q}self{q} https://fonts.gstatic.com; \"
    f\"connect-src {q}self{q} https://command-center.nuvuestudio.net wss://command-center.nuvuestudio.net http://command-center.nuvuestudio.net ws://command-center.nuvuestudio.net https://api.iconify.design https://api.unisvg.com https://api.simplesvg.com; \"
    f\"frame-ancestors {q}self{q};\"
)
csp = f\"add_header Content-Security-Policy \\\"{csp_value}\\\" always;\"
lines = []
replaced = False
for line in text.splitlines():
    if \"add_header Content-Security-Policy\" in line:
        lines.append(\"    \" + csp)
        replaced = True
    else:
        lines.append(line)
if not replaced:
    lines.append(\"    \" + csp)
path.write_text(\"\\n\".join(lines) + \"\\n\")
PY
    nginx -t
    systemctl reload nginx
  '
"

echo "Health check: $PUBLIC_URL/healthz"
curl -fsS "$PUBLIC_URL/healthz"
echo
echo "Command Center deploy complete."
