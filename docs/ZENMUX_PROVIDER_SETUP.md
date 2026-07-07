# ZenMux Provider Setup

ZenMux is wired as a DISPATCH/LiteLLM provider, but the API key must stay out of git and chat logs.

## What Is Configured

- OpenAI-compatible base URL: `https://zenmux.ai/api/v1`
- Secret env var in LXC 101: `ZENMUX_API_KEY`
- Secret file: `/opt/litellm/litellm.env` with `600` permissions
- LiteLLM aliases:
  - `zenmux-claude-sonnet-5-free`
  - `zenmux-claude-fable-5-free`
- DISPATCH registry IDs:
  - `zenmux/anthropic/claude-sonnet-5-free`
  - `zenmux/anthropic/claude-fable-5-free`

ZenMux also supports Anthropic-compatible Claude tooling at `https://zenmux.ai/api/anthropic`, but DISPATCH uses the OpenAI-compatible endpoint because LiteLLM already sits behind DISPATCH as an OpenAI-compatible gateway.

## Secure Key Install

Preferred: put the key in a temporary local file outside the repo, then deploy it:

```bash
printf '%s' 'PASTE_ZENMUX_KEY_HERE' > /tmp/zenmux.key
chmod 600 /tmp/zenmux.key
INSTALL_ZENMUX_KEY=1 ZENMUX_API_KEY_FILE=/tmp/zenmux.key ~/bin/deploy_litellm_config_via_proxmox
rm -f /tmp/zenmux.key
```

Alternative from an interactive terminal:

```bash
INSTALL_ZENMUX_KEY=1 ~/bin/deploy_litellm_config_via_proxmox
```

The script prompts silently, writes only to `/opt/litellm/litellm.env`, restarts LiteLLM, and prints model aliases without printing the key.
It refuses obvious placeholder strings such as `PASTE_ZENMUX_KEY_HERE` or `YOUR_REAL_ZENMUX_KEY`.
It also refuses to deploy ZenMux LiteLLM aliases if no ZenMux key is installed, so DISPATCH cannot falsely mark ZenMux as available.

## Verification

```bash
python3 scripts/check_dispatch_model_aliases.py
python3 dispatch/dispatch_status.py
python3 scripts/dispatch_convex_sync.py --once
```

Expected after key install:

- `zenmux-claude-sonnet-5-free` appears in LiteLLM models.
- `zenmux-claude-fable-5-free` appears in LiteLLM models.
- The ZenMux registry rows are marked ready by `scripts/check_dispatch_model_aliases.py`.
- `/registry/status` shows the ZenMux entries as available.

## Current Provider State

As of 2026-07-07, the key is installed and both aliases appear in LiteLLM, but real tiny completion probes return `HTTP 402 Payment Required`.
DISPATCH marks both ZenMux models `quota_exhausted` in runtime state so they are skipped until the ZenMux account/quota issue is fixed.

After fixing the ZenMux account, clear or let expire the runtime quota block and rerun:

```bash
python3 scripts/check_dispatch_model_aliases.py
python3 scripts/check_dispatch_recovery_route.py
```
