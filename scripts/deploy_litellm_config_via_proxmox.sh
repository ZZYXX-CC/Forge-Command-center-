#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROXMOX_HOST="${PROXMOX_HOST:-forge-node-01}"
LXC_ID="${LXC_ID:-101}"
LITELLM_URL="${LITELLM_URL:-http://192.168.1.178:4000}"
REMOTE_TMP="/tmp/litellm-config-deploy-$(date +%Y%m%d%H%M%S)"

cd "$REPO_ROOT"

KEY_TMP=""
cleanup() {
  if [[ -n "$KEY_TMP" && -f "$KEY_TMP" ]]; then
    rm -f "$KEY_TMP"
  fi
}
trap cleanup EXIT

if [[ "${INSTALL_ZENMUX_KEY:-}" == "1" ]]; then
  KEY_VALUE="${ZENMUX_API_KEY:-}"
  if [[ -z "$KEY_VALUE" && -n "${ZENMUX_API_KEY_FILE:-}" ]]; then
    KEY_VALUE="$(tr -d '\r\n' < "$ZENMUX_API_KEY_FILE")"
  fi
  if [[ -z "$KEY_VALUE" && -t 0 ]]; then
    read -r -s -p "ZenMux API key: " KEY_VALUE
    echo
  fi
  if [[ -z "$KEY_VALUE" ]]; then
    echo "INSTALL_ZENMUX_KEY=1 was set, but no key was provided." >&2
    echo "Use ZENMUX_API_KEY_FILE=/path/to/key or run from a TTY for a hidden prompt." >&2
    exit 2
  fi
  case "$KEY_VALUE" in
    PASTE_ZENMUX_KEY_HERE|YOUR_REAL_ZENMUX_KEY|PASTE_*|YOUR_*_KEY)
      echo "Refusing to install a placeholder ZenMux key." >&2
      exit 2
      ;;
  esac
  KEY_TMP="$(mktemp)"
  chmod 600 "$KEY_TMP"
  printf 'ZENMUX_API_KEY=%s\n' "$KEY_VALUE" > "$KEY_TMP"
fi

if grep -q "ZENMUX_API_KEY\\|zenmux-" dispatch/litellm/config.yaml && [[ -z "$KEY_TMP" ]]; then
  if ! ssh "$PROXMOX_HOST" "pct exec '$LXC_ID' -- grep -q '^ZENMUX_API_KEY=' /opt/litellm/litellm.env 2>/dev/null"; then
    echo "Refusing to deploy ZenMux LiteLLM aliases without an installed ZenMux key." >&2
    echo "Run with INSTALL_ZENMUX_KEY=1 and ZENMUX_API_KEY_FILE=/path/to/key." >&2
    exit 2
  fi
fi

ssh "$PROXMOX_HOST" "mkdir -p '$REMOTE_TMP'"
scp dispatch/litellm/config.yaml "$PROXMOX_HOST:$REMOTE_TMP/config.yaml"
if [[ -n "$KEY_TMP" ]]; then
  scp "$KEY_TMP" "$PROXMOX_HOST:$REMOTE_TMP/zenmux.env"
fi

ssh "$PROXMOX_HOST" "
  set -e
  pct push '$LXC_ID' '$REMOTE_TMP/config.yaml' /opt/litellm/config.yaml
  pct exec '$LXC_ID' -- chmod 644 /opt/litellm/config.yaml
  if [ -f '$REMOTE_TMP/zenmux.env' ]; then
    pct push '$LXC_ID' '$REMOTE_TMP/zenmux.env' /tmp/zenmux.env
    pct exec '$LXC_ID' -- sh -lc 'set -e
      touch /opt/litellm/litellm.env
      chmod 600 /opt/litellm/litellm.env
      grep -v \"^ZENMUX_API_KEY=\" /opt/litellm/litellm.env > /tmp/litellm.env.next || true
      cat /tmp/zenmux.env >> /tmp/litellm.env.next
      install -m 600 /tmp/litellm.env.next /opt/litellm/litellm.env
      rm -f /tmp/zenmux.env /tmp/litellm.env.next
    '
  fi
  pct exec '$LXC_ID' -- systemctl restart litellm
  pct exec '$LXC_ID' -- systemctl is-active litellm
  rm -rf '$REMOTE_TMP'
"

python3 - <<'PY'
import json
import os
import time
import urllib.request

url = os.environ.get("LITELLM_URL", "http://192.168.1.178:4000").rstrip("/") + "/v1/models"
last_error = None
for _ in range(12):
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            models = [row.get("id") for row in json.load(response).get("data", [])]
        print(json.dumps({"litellmModels": sorted(models)}, indent=2))
        break
    except Exception as exc:
        last_error = exc
        time.sleep(2)
else:
    raise SystemExit(f"LiteLLM restarted but /v1/models was not reachable: {last_error}")
PY

echo "LiteLLM config deploy complete."
