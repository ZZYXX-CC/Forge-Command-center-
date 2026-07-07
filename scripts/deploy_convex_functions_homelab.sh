#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXMOX_HOST="${PROXMOX_HOST:-forge-node-01}"
LXC_ID="${LXC_ID:-102}"
CONVEX_SELF_HOSTED_URL="${CONVEX_SELF_HOSTED_URL:-http://192.168.1.179:3210}"
REMOTE_ADMIN_KEY_PATH="${REMOTE_ADMIN_KEY_PATH:-/opt/forge-convex/admin.key}"
LOCAL_ENV="$(mktemp)"
trap 'rm -f "$LOCAL_ENV"' EXIT

cd "$REPO_ROOT"

echo "Preparing self-hosted Convex deploy env..."
ADMIN_KEY="$(ssh "$PROXMOX_HOST" "pct exec '$LXC_ID' -- cat '$REMOTE_ADMIN_KEY_PATH'")"
umask 077
cat > "$LOCAL_ENV" <<EOF
CONVEX_SELF_HOSTED_URL=$CONVEX_SELF_HOSTED_URL
CONVEX_SELF_HOSTED_ADMIN_KEY=$ADMIN_KEY
EOF

echo "Deploying Convex functions/schema to $CONVEX_SELF_HOSTED_URL"
npx convex deploy --env-file "$LOCAL_ENV" --typecheck try --message "FORGE control-plane schema and sync support"

echo "Convex function deploy complete."

