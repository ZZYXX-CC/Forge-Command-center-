#!/usr/bin/env bash
set -euo pipefail

# Deploy DISPATCH router/config through the Proxmox host.
# Direct SSH to the dispatch LXC is not required; the host pushes files with pct.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXMOX_HOST="${PROXMOX_HOST:-forge-node-01}"
LXC_ID="${LXC_ID:-101}"
DISPATCH_URL="${DISPATCH_URL:-http://192.168.1.178:4001}"

REMOTE_TMP="/tmp/dispatch-router-deploy-$(date +%Y%m%d%H%M%S)"

cd "$REPO_ROOT"

echo "Deploying DISPATCH router via ${PROXMOX_HOST} -> LXC ${LXC_ID}"
echo "Remote temp: ${REMOTE_TMP}"

ssh "$PROXMOX_HOST" "mkdir -p '$REMOTE_TMP'"

scp \
  dispatch/dispatch.config.yaml \
  dispatch/router/dispatch_router.py \
  dispatch/router/dispatch_service.py \
  "$PROXMOX_HOST:$REMOTE_TMP/"

ssh "$PROXMOX_HOST" "
  set -e
  pct push '$LXC_ID' '$REMOTE_TMP/dispatch.config.yaml' /opt/dispatch/dispatch.config.yaml
  pct push '$LXC_ID' '$REMOTE_TMP/dispatch_router.py' /opt/dispatch/router/dispatch_router.py
  pct push '$LXC_ID' '$REMOTE_TMP/dispatch_service.py' /opt/dispatch/router/dispatch_service.py
  pct exec '$LXC_ID' -- systemctl restart dispatch-service
  pct exec '$LXC_ID' -- systemctl is-active dispatch-service
"

echo
echo "Live surface check:"
python3 - <<PY
import json
import urllib.request

url = "${DISPATCH_URL}/surfaces"
with urllib.request.urlopen(url, timeout=10) as response:
    payload = json.load(response)

required = {"hermes-kern-gpt55", "codex-cli-gpt55"}
surfaces = {row.get("surface"): row for row in payload.get("surfaces", [])}
for name in sorted(required):
    row = surfaces.get(name)
    if not row:
        raise SystemExit(f"missing required surface: {name}")
    print(f"{name}: available={row.get('available')} via={row.get('via')} detail={row.get('detail')}")

missing = required - set(surfaces)
if missing:
    raise SystemExit(f"missing required surfaces: {', '.join(sorted(missing))}")
PY

echo
echo "Dispatch status:"
python3 dispatch/dispatch_status.py

echo
echo "DISPATCH deploy complete."
