# DISPATCH — Agent Handoff Log

Purpose: let any agent (Codex, a fresh Claude session, a Hermes agent) continue the DISPATCH build without the originating conversation. Pairs with **`docs/FORGE_NATIVE_EXECUTION_PLAN.md`** (the lean FORGE-native roadmap — start here for overall architecture), `docs/DISPATCH_BUILD_PLAN.md` (DISPATCH routing phases), and `dispatch/dispatch.config.yaml` (the routing policy). Last updated 2026-07-05.

**Architecture (critical path):** Telegram + Command Center → Hermes FORGE agents → DISPATCH → Ollama/NIM/OpenRouter/Codex/Claude Code/Cursor → Convex log → Command Center visibility. See `docs/FORGE_NATIVE_EXECUTION_PLAN.md` for phases A–F and the immediate checklist.

**Not critical path:** **Antfarm** and **Paperclip** are optional/reference layers only — keep Antfarm workflow patterns (gates, retries, step schemas) and Paperclip concepts (org, tickets, budget, heartbeat, audit), but do not block shipping on either. Build the lean Convex FORGE Work Registry first (`docs/FORGE_NATIVE_EXECUTION_PLAN.md` Phase B).

## TL;DR state

DISPATCH's routing brain is built and running. Phases 0, 1, 3, 4 done, plus an OpenAI-compatible service. It classifies a task, walks a ranked tier chain, checks live availability, routes to the best surface (free-local Ollama, subscription CLIs, or free API tiers), and logs every decision. It is reachable as a drop-in OpenAI endpoint. Not yet done: the visible panel (Phase 2/6), phone intake (5), overnight loop (7), and the fleet-delegation integration.

## Infrastructure map (all on the Abuja LAN; Tailscale for remote)

- **Mac mini (`mac-mini`, 192.168.1.170, static lease)** — inference + CLIs + the live Hermes fleet.
  - Ollama on `:11434` (bound 0.0.0.0). Models on external APFS SSD at `Forge Core/.ollama/models`. `qwen2.5-coder:14b` present. `gemma4:12b` NOT installed (vision tier shows no_available_surface).
  - Mac executor on `:4100` — token-authed HTTP, runs `claude -p` / `codex exec` / `cursor-agent -p`. Code: `~/.dispatch-executor/executor.py` (internal disk). Started via nohup. Token: `~/.dispatch-executor/token` (600).
  - CLIs: `claude` (~/.local/bin), `codex` (~/.npm-global/bin), `cursor-agent` (~/.local/bin). All confirmed headless.
  - Hermes fleet (sage/edge/ink/kern/vael live; scout/bridge idle) runs via nohup (launchd broken post-reformat — needs Full Disk Access on the APFS volume). Do NOT rely on the launchd services until that's fixed.
- **Homelab Dell (`forge-node-01`, 192.168.1.100, root via SSH/Tailscale)** — Proxmox.
  - **LXC 101 `dispatch-litellm` (192.168.1.178, static lease)** — the DISPATCH host.
    - `litellm` systemd service on `:4000` — OpenAI API gateway, fallback across Ollama/NIM/OpenRouter. Config `/opt/litellm/config.yaml`, keys `/opt/litellm/litellm.env` (600).
    - `dispatch-service` systemd service on `:4001` — the router as an OpenAI-compatible endpoint (see below). Code `/opt/dispatch/router/`, env `/opt/dispatch/executor.env` (600, holds EXECUTOR_TOKEN).
  - **LXC 103 `adguard`** — DHCP + DNS for the LAN. Static leases live here (`/opt/AdGuardHome/data/leases.json`). Config backups `.bak-*` alongside.
  - ZFS pool `tank` (~900GB, mirror) with `/tank/nas` (media offloaded from the SSD lives here), plus the `dev-archive`, and the SSD reformat backups.

## Endpoints (health-check these first)

- LiteLLM: `curl http://192.168.1.178:4000/health/liveliness` -> "I'm alive!"
- DISPATCH service: `curl http://192.168.1.178:4001/health` ; models `GET /v1/models`; **decisions log `GET /decisions`** (JSON, for the panel); chat `POST /v1/chat/completions` (model `dispatch-auto`, returns an `x_dispatch` field with tier/chosen_surface/via/latency/status).
- Mac executor: `curl http://192.168.1.170:4100/health` ; run `POST /run` with header `Authorization: Bearer <token>` and body `{"surface":"claude-code|codex|cursor","prompt":"...","model":"sonnet"}`.

## Code (source of truth = this repo, under `dispatch/`)

- `dispatch/dispatch.config.yaml` — the routing policy (tiers, surfaces, billing). EDIT THIS to change rankings; no code change needed.
- `dispatch/router/dispatch_router.py` — classify + select + route + log (CLI: `python3 dispatch_router.py "task"`). Logs to SQLite `dispatch-log.db`.
- `dispatch/router/dispatch_service.py` — the OpenAI-compatible HTTP service (imports the router). Serves `/v1/chat/completions`, `/decisions`, `/health`.
- `dispatch/executor/executor.py` — the Mac executor (runs on the Mac at `~/.dispatch-executor/`).
- Deployed copies: LXC `/opt/dispatch/`, Mac `~/.dispatch-executor/`. When you change repo code, re-push to those and restart the systemd unit / nohup process.

## Secrets (locations only — never echo values)

- OpenRouter + NVIDIA NIM API keys: LXC `/opt/litellm/litellm.env`; staging copy in the originating session scratchpad `dispatch-secrets.env`. **Both keys were pasted in chat — rotate them if that transcript is retained.**
- Executor bearer token: Mac `~/.dispatch-executor/token` and LXC `/opt/dispatch/executor.env`.
- Hermes fleet credentials: `Forge Core/.hermes/auth.json` (OAuth) — untouched, do not copy.

## Critical decisions & gotchas (read before acting)

1. **Do NOT point Hermes agents' model backend at DISPATCH.** The agents are tool-calling agents; DISPATCH's executor path is one-shot (`claude -p`) with no tools, and the service doesn't forward `tools`. Flipping backends turns the fleet into chatbots (breaks `edge` trading). The correct integration is DELEGATION: build a small Hermes tool/skill that calls `http://192.168.1.178:4001/v1/chat/completions` to route discrete tasks, while agents keep their own backend. If per-turn routing is ever wanted, DISPATCH must first forward `tools` and route only to tool-capable API models, and it must be validated on the idle `scout` profile, never on live `edge`.
2. **Codex is NOT broken.** `hermes auth` showing `openai-codex` "device_code exhausted" is just the primary token hitting a rate limit; the credential pool auto-rotates to fallback tokens. Agents respond fine.
3. **Subscription-first billing.** Route Claude/GPT work through the CLIs (claude-code/codex/cursor) before any metered API. `dispatch.config.yaml` encodes this with `billing:` classes: free_local < subscription < free_api < metered.
4. **Ollama availability quirk.** The router's `ollama_has()` checks the manifest (`/api/tags`), which can report "up" while a blob is incomplete; LiteLLM's provider fallback covers the gap. If Ollama is chosen but `served_by` shows NIM, that's the two-layer fallback working, not a bug.
5. **Storage:** SSD is APFS now (was exFAT; that round-trip corrupted the qwen blob once — re-pulled). Media lives on the homelab `tank`. Mac internal disk is tight; keep new data on the SSD or homelab.
6. **`convex/` and `api/` are LOCAL-ONLY** — not on GitHub `origin/main` (0 files tracked there), not gitignored. The Convex backend (`convex/agents.ts`, `convex/schema.ts`) and `api/` exist only on this disk. **Commit them to GitHub** so the backend isn't a single point of failure. Our `dispatch/` and `docs/` are also untracked.

## Frontend state (just synced 2026-07-05)

Local was stale; reset `--hard` to GitHub `origin/main` (`578a1f6`). Frontend now matches GitHub (18+ pages). Old local changes backed up to `~/forge-local-frontend-backup-20260705-123450.patch`. Stack: Vite + React 19 + react-router + @tanstack/react-query + Convex + Tailwind. Icons: **Solar via `ForgeIcon` component (NOT lucide)**. Agents page is `src/pages/BotTeam.tsx` (renders `NeuralCommandMap`). Add DISPATCH next to it.

## Panel clarity (updated 2026-07-05)

`/dispatch` now self-describes: explainer banner (tiers, `executor`=subscription CLIs, `litellm`=free local/API), a Task column, and **click-to-expand rows** showing the full task text + the considered chain (each surface with available/down/skipped/chosen). Backend `/decisions` returns `task` + `considered` (JSON string of the chain). `src/pages/Dispatch.tsx` + `dispatch_service.recent_decisions()`.

## Orchestration continuation (how to finish the plan on few tokens)

Run as ORCHESTRATOR: delegate SELF-CONTAINED build tasks to DISPATCH (via `dispatch/dispatch_delegate.py "…"` or POST to `:4001`), let the routed surface generate the code, then only VERIFY + APPLY. Proven working (this file's tools were built that way). Keep THIS handoff updated after each step so the next orchestrator has a live view.

**The unlock (DONE 2026-07-05 by KERN):** Mac executor, router, and service now forward an optional `cwd`/`repo` field. `dispatch/executor/executor.py` and live `~/.dispatch-executor/executor.py` validate the directory and pass `cwd=` to `subprocess.run`; `dispatch_router.execute_executor(...)`, router CLI `--cwd/--repo`, and `dispatch_service.execute_executor(...)` forward it. Redeployed Mac executor on `:4100` and LXC service in `/opt/dispatch/router/` (`dispatch-service` active). Verification: direct executor POST with `cwd=/Volumes/Patriot 2TB/Dev Test/.openclaw/workspace/Forge-Command-center` returned that cwd and Codex stderr showed the same workdir; service POST with an invalid cwd returned `exec_error:RuntimeError`, proving forwarding reached the executor. Caveat: executor cwd works, but current Claude/Codex CLI sessions returned login/auth messages during smoke tests, so repo-scoped delegation may need CLI re-login before those surfaces can edit.

Then delegate, in order (each is a self-contained or repo-scoped task):
- Wrap `dispatch_delegate.py` as a Hermes skill so KERN/SAGE call it as a tool. **DONE 2026-07-05 by KERN:** created profile-local Hermes skill `dispatch-delegate` under KERN (`~/.hermes/profiles/kern/skills/devops/dispatch-delegate/SKILL.md`) and added `--cwd/--repo` forwarding to `dispatch/dispatch_delegate.py`. Note: SAGE profile still needs the same skill installed/copied if SAGE should load it directly.
- Fix `dispatch_status.py` "Logged Decisions: 0" count bug. **DONE 2026-07-05 by KERN:** `dispatch_status.py` now reads the live `/decisions` shape (`{"decisions": [...]}`) with `logged_decisions` fallback. Verification: `python3 dispatch/dispatch_status.py` reports all services UP and `Logged Decisions: 12`.
- Add a live `/surfaces` route to `dispatch_service.py` + a status strip in `Dispatch.tsx`. **DONE 2026-07-05 by KERN:** `/surfaces` returns configured surfaces with live executor/LiteLLM availability; `Dispatch.tsx` polls it every 10s and renders green/red surface chips. Redeployed `dispatch_service.py` to LXC and restarted `dispatch-service`. Verification: `GET /surfaces` returned 10 surfaces (`claude-code`, `codex`, `cursor`, `openrouter`, `nim`, `ollama` available; `antigravity` and unconfigured direct APIs unavailable). `npm run lint -- --pretty false` still fails only on pre-existing Convex/type export issues; no `src/pages/Dispatch.tsx` diagnostics.
- Commit `convex/` + `api/` to GitHub (they're local-only).

## Remaining build phases (prioritized)

> **Roadmap:** FORGE-native phases A–F and the immediate checklist live in **`docs/FORGE_NATIVE_EXECUTION_PLAN.md`**. The numbered items below are DISPATCH-specific; align them with Phase A–C of that doc.

1. **DISPATCH panel (Phase 6, visibility).** Add a page/route in the Command Center that fetches `http://192.168.1.178:4001/decisions` (react-query, `refetchInterval` ~10s) and renders the routing history (ts, category/complexity, chosen_surface, via, served_by, latency, status). Optionally a live surface-status strip. Wire into `App.tsx` routes + `DomainNav` (add a `g d` shortcut). Use `ForgeIcon`/Tailwind to match. **DONE 2026-07-05:** built as `src/pages/Dispatch.tsx`, wired into `App.tsx` (route `/dispatch`, `g d` shortcut, activeNavId) + `DomainNav` (Solar `routing-2` icon), react-query 10s refetch, endpoint overridable via `VITE_DISPATCH_URL`, TypeScript-clean (0 errors in new files). View: `npm run dev` then `/dispatch` (browser must reach 192.168.1.178:4001 over LAN/Tailscale; CORS open). NOTE: the synced frontend has ~66 pre-existing TS errors of its own (WIP, e.g. Deployments/Messaging prop mismatches) — unrelated to DISPATCH, but `npm run build` will fail until they're fixed; `npm run dev` renders fine.
2. **Commit `convex/` + `api/` to GitHub** (they're local-only). Also consider committing `dispatch/` + `docs/`.
3. **Fleet delegation tool (Phase-4.5). DONE 2026-07-05** — `dispatch/dispatch_delegate.py` (a stdlib CLI: `dispatch_delegate.py "task"` POSTs to the service and prints the answer + routing summary; `DISPATCH_URL` overridable). This is how KERN/SAGE delegate to DISPATCH (see gotcha #1). Also `dispatch/dispatch_status.py` (health-checks all 3 services + executor surfaces; minor bug: its "Logged Decisions" count reads 0). NOTE: both tools were themselves GENERATED BY DISPATCH (routed to Ollama/qwen2.5-coder, logged) — the dogfood loop is confirmed working. Remaining thin step: wrap `dispatch_delegate.py` as a proper Hermes skill so agents call it as a tool. Delegation via the DISPATCH executor works for SELF-CONTAINED scripts; repo-integrated edits need repo context (the executor runs without a repo cwd), so do those directly or give the executor a working directory.
4. **Phase 2 (Convex).** Self-host Convex on the homelab (needs Docker in an LXC/VM; Dell host has none) and move the decision log into it for reactive panel updates, replacing the REST `/decisions` MVP.
5. **Phase 5 (intake)** via Hermes Telegram; **Phase 7 (overnight loop)** via Hermes cron. Rotate the shared Telegram bot tokens first (hazard in `/Volumes/Patriot 2TB/Dev Test/.openclaw/CLAUDE.md`).

## Verify-it-works snippet

```
curl -s http://192.168.1.178:4001/v1/chat/completions -H 'Content-Type: application/json' \
  -d '{"model":"dispatch-auto","messages":[{"role":"user","content":"Should we cache this or recompute? One sentence."}]}' | python3 -m json.tool
# expect: a chat.completion whose model is a routed surface, plus an x_dispatch field.
```
