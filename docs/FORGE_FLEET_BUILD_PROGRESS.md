# FORGE Fleet Build Progress

Last updated: 2026-07-08 00:10 WAT

Public dashboard: https://command-center.nuvuestudio.net/

## Current Status

| Phase | Status | Notes |
| --- | --- | --- |
| Safety snapshot | Done | Pre-control-plane patch archived on SSD before edits. |
| BRIDGE removal | Done | Active UI/docs/team metadata now use SAGE, KERN, VAEL, EDGE, support agents. |
| DISPATCH registry | Done | 23 model entries live at `/registry/status`, including ZenMux Claude Sonnet/Fable free entries and the current Gemini/Gemma CLI model set. |
| Registry-aware selection | Done | Capability/domain/trust/quota/circuit policy now rejects bad candidates deterministically. |
| Classifier layer | Done | Typed intents bypass classifier; untyped requests use bounded local/NIM/OpenRouter classifier attempts, strict JSON parsing, normalized capability buckets, and deterministic fallback. |
| Runtime quota/circuit tracking | Done | SQLite runtime state records failures, rate-limit blocks, circuit state, last success/failure. |
| Async verification | Done | Pending routine outputs enqueue background verifier jobs; queue visible at `/verification/jobs`. |
| Stale verifier recovery | Done | Verifier jobs left `running` past `DISPATCH_VERIFICATION_JOB_TIMEOUT_SECONDS` are marked `timeout` and reflected in routing decision verification JSON. |
| Command Center control plane | Done | `/dispatch` shows registry, runtime, why logs, rejection reasons, verifier queue. Deployed to LXC 104. |
| Convex control-plane schema | Done | Schema/mutations deployed to self-hosted Convex; DISPATCH registry, runtime, decisions, and verification jobs sync into Convex. |
| Convex sync daemon | Done | `dispatch-convex-sync.service` runs in LXC 101 and restarts automatically. |
| Runtime health heartbeat | Done | The Convex sync daemon now writes service health transitions and periodic heartbeats to `/audit` under `system-forge-runtime`. |
| Runtime refresh loop | Done | The Convex sync worker calls `POST /registry/refresh` before each model sync, then falls back to `/registry/status` if refresh is unavailable. |
| Verification run audit query | Done | Convex exposes `work:listVerificationRuns` for recent verifier state, including timeout and actual passing verifier attribution. |
| SAGE orchestration loop | Done | `forge-sage-orchestrator.service` polls ready work items and dispatches one per cycle through DISPATCH with typed intent. |
| SAGE orchestration recovery | Done | Worker requeues stale SAGE/DISPATCH in-flight work once, blocks repeated stale work, and reconciles background verifier results into work item state. |
| Exact provider aliases | Done | Exact aliases are wired for Ollama Qwen, NIM DeepSeek/Kimi/Nemotron/Minimax, OpenRouter Nemotron/Qwen, and ZenMux Sonnet/Fable. |
| OpenAI-compatible dry-run | Done | `POST /v1/chat/completions` supports `dry_run: true` and does not execute or enqueue verification. |
| ZenMux provider | Degraded | Key installed securely and aliases are exposed, but real smoke calls return HTTP 402 Payment Required. DISPATCH marks both ZenMux models `quota_exhausted` and skips them until the ZenMux account/quota is fixed. |
| Bounded delegation CLI | Done | `dispatch/dispatch_delegate.py` supports `--dry-run`, typed routing intent flags, and `--timeout` so agents can use DISPATCH without hanging indefinitely. |
| Gemini CLI routing | Done | Registry and UI-design routing now use the current Gemini model names. `gemini-3.5-flash` is the active UI primary; `gemini-3.1-flash-lite` remains first fallback. |
| Dry-run safety | Done | OpenAI-compatible dry-run now classifies/selects/logs only; it no longer invokes VAEL/Hermes preflight or enqueues verification. |
| Gate timeouts | Done | Classifier total budget is bounded by config; VAEL before/after gates use `DISPATCH_VAEL_GATE_TIMEOUT_SECONDS` with a 45s default. |
| Gemini fallback bounds | Done | UI Gemini primary calls are bounded to 75s; preview/pro/verifier/fallback Gemini calls are bounded to 45s so DISPATCH can continue down the chain instead of stalling. |
| Mac executor deploy script | Done | `scripts/deploy_mac_executor_local.sh` copies repo executor source to `~/.dispatch-executor/executor.py`, restarts `ai.forge.dispatch-executor`, and verifies `/health`. |
| Synthetic route self-test | Done | Work items now support `dryRun`; `/tasks` can create a route self-test item, and SAGE passes `dry_run: true` through DISPATCH while still recording events, executorRuns, and routingDecisions. |
| Source hygiene gate | Done | `scripts/check_forge_source_hygiene.py` verifies required deployable source exists, local artifacts are ignored, and raw API/bot token patterns are absent. |
| Mac executor self-healing deploy | Done | `scripts/deploy_mac_executor_local.sh` installs the LaunchAgent plist, bootstraps/kickstarts launchd, validates health, and keeps `:4100` alive with `KeepAlive`. |
| SAGE/KERN DISPATCH delegation skill | Done | Repo-owned `hermes/skills/devops/dispatch-delegate` is installed into live SAGE and KERN Hermes profiles via `scripts/install_hermes_dispatch_delegate_skill.sh`. |
| Hermes gateway watchdog | Done | Repo-owned wrapper/watchdog source and LaunchAgent installer keep the active SAGE/KERN gateways launchd-managed and recover dead/bad gateway states. |
| Gateway health in audit | Done | Mac executor `/health` reports SAGE/KERN gateway/watchdog state; `dispatch-convex-sync` writes the compact summary into `/audit`. |

## How To Track

- Live UI: `https://command-center.nuvuestudio.net/dispatch`
- DISPATCH status: `python3 dispatch/dispatch_status.py`
- Registry API: `http://192.168.1.178:4001/registry/status`
- Verifier API: `http://192.168.1.178:4001/verification/jobs`
- Public verifier proxy: `https://command-center.nuvuestudio.net/api/dispatch/verification/jobs`
- Convex sync service: `ssh forge-node-01 "pct exec 101 -- systemctl status dispatch-convex-sync --no-pager"`
- SAGE orchestrator service: `ssh forge-node-01 "pct exec 101 -- systemctl status forge-sage-orchestrator --no-pager"`
- Exact model alias check: `python3 scripts/check_dispatch_model_aliases.py`
- Quota recovery route check: `python3 scripts/check_dispatch_recovery_route.py`
- Bounded delegation dry-run: `python3 dispatch/dispatch_delegate.py --dry-run --task-type implementation --domain code --verification-policy time_bounded --timeout 20 "Dry-run a routine implementation route."`
- Source hygiene: `python3 scripts/check_forge_source_hygiene.py`
- Hermes dispatch skill install: `bash scripts/install_hermes_dispatch_delegate_skill.sh sage kern`
- Hermes gateway watchdog install: `bash scripts/install_hermes_gateway_watchdog_local.sh`
- ZenMux setup: `docs/ZENMUX_PROVIDER_SETUP.md`
- This file: update after each build phase.

## Latest Verified Smoke Tests

- DISPATCH/LiteLLM/Executor: UP.
- Core services: `litellm`, `dispatch-service`, `dispatch-convex-sync`, `forge-sage-orchestrator`, and Command Center `nginx` are active.
- Registry: 23 models. Exact-ready API aliases: Ollama Qwen, NIM DeepSeek, NIM Kimi, NIM Nemotron, NIM Minimax, OpenRouter Nemotron, OpenRouter Qwen. Gemini CLI entries: `gemini-3-flash-preview`, `gemini-3.1-pro-preview`, `gemini-2.5-pro`, `gemini-3.1-flash-lite`, `gemini-3.5-flash`, `gemma-4-31b-it`, `gemma-4-26b-a4b-it`.
- ZenMux aliases are present but currently blocked by provider response `HTTP 402 Payment Required`; DISPATCH and Convex show them as `quota_exhausted`.
- Routine typed intent: local Ollama timed out, DISPATCH fell back to NIM, async verifier passed with `codex-cli-gpt55`.
- UI dry-run: `execution_ui_design` selected `gemini-cli / gemini-3.1-flash-lite`.
- Gemini executor smoke: `gemini-cli / gemini-3.1-flash-lite` returned `GEMINI_OK` through the Mac executor in about 3 seconds.
- Gemini availability note: direct `gemini-3.5-flash` and `gemini-3.1-flash-lite` smokes passed. `gemini-3-flash-preview` timed out during smoke, and Pro models returned Google quota errors, so they remain registered but sit behind the working Flash/Cursor paths.
- Gemini default executor smoke: direct `/run` with no explicit model returned `GEMINI_DEFAULT_MODEL_OK` through `gemini-3.5-flash`; the executor now reports the resolved default model in its JSON response.
- UI route dry-run after Gemini reorder: selected `gemini-cli / gemini-3.5-flash` as primary and kept Flash Lite, Gemini/Gemma fallbacks, Cursor verification, and free recovery behind it.
- Mac executor local deploy: added `scripts/deploy_mac_executor_local.sh` to prevent repo/live executor drift.
- Public dashboard health: `https://command-center.nuvuestudio.net/healthz` returned `ok`; public registry proxy returned HTTP 200.
- OpenAI-compatible dry-run: `execution_routine` returned `would_execute(dry_run)` in about 1.3s and selected `ollama / qwen2.5-coder:14b` without executing.
- Convex sync one-shot: `{"models": 23, "decisions": 50, "jobs": 2}` after refresh-before-sync patch.
- Convex sync model refresh: sync worker now reloads DISPATCH registry/runtime status before pushing model rows to Convex.
- Command Center public deploy: `https://command-center.nuvuestudio.net/healthz` returned `ok`.
- Public DISPATCH proxy: `https://command-center.nuvuestudio.net/api/dispatch/registry/status` returned `200`.
- Convex query check: 16 model rows, 16 runtime rows, 0 ready work items.
- Active services: `dispatch-service`, `dispatch-convex-sync`, `forge-sage-orchestrator`, and Command Center `nginx`.
- Provider smoke: `nim-nemotron` and `nim-minimax` both answered tiny real completion checks; ZenMux Sonnet/Fable both returned `HTTP 402 Payment Required`.
- Convex runtime query: both ZenMux registry rows are `health=quota_exhausted`, `available=false`, with last error `HTTP 402 Payment Required from provider smoke test`.
- Validation: `npm run lint` passed after ZenMux registry/router changes.
- Alias check: `python3 scripts/check_dispatch_model_aliases.py` reports `ok=true`, `runtimeUsable=false`, 7 ready API/local entries, 2 degraded ZenMux runtime entries, and no missing required aliases.
- Quota recovery simulation: `python3 scripts/check_dispatch_recovery_route.py` returned `ok=true`; with Claude Code/Codex/Hermes/Gemini planning surfaces simulated as quota-exhausted and live ZenMux state copied as quota-blocked, DISPATCH selected `nim / nvidia/nemotron-3-ultra-550b-a55b`.
- Bounded delegation: `dispatch_delegate.py --dry-run ...` returned `would_execute(dry_run)` immediately; `--timeout 1` exits cleanly with `Timeout after 1s` instead of hanging.
- Untyped UI dry-run: natural-language dashboard request returned in 17.42s, classified as `execution_ui_design`, enforced `authority_agent=vael`, normalized capabilities to `frontend/design_system`, selected `gemini-cli / gemini-3.1-flash-lite`, and did not execute VAEL.
- Classifier direct LXC smoke: `_model_classify(...)` returned in 9.91s via `moonshotai/kimi-k2.6` with normalized `design_system/accessibility/frontend` capabilities and VAEL authority.
- Validation: `npm run lint` and `npm run build` passed after classifier/dry-run/gate-timeout changes; Vite still warns about one large bundle.
- Convex schema/functions deploy: successful after adding `workItems.dryRun`.
- SAGE orchestrator deploy: successful after adding dry-run dispatch and KERN authority enforcement for infrastructure/code work.
- Command Center deploy: successful; public health returned `ok`, and the deployed bundle contains `Route self-test` / `Dry-run only` controls.
- Synthetic end-to-end smoke: created `work-1783421750847`, ran one SAGE tick, and verified Convex recorded `status=done`, `dryRun=true`, `owner=kern`, `surface=nim`, `model=deepseek-ai/deepseek-v4-pro`, `verificationStatus=waived`, executor run status `ok`, and routing why log with `KERN authority applies for infrastructure.`
- SAGE dry-run recovery-loop smoke: created `work-1783422673327`, ran one SAGE tick, and verified Convex recorded `status=done`, `dryRun=true`, `owner=kern`, `surface=nim`, `model=deepseek-ai/deepseek-v4-pro`, `verificationStatus=waived`, executor run status `ok`, and why log with `KERN authority applies for infrastructure.` No live model execution or verifier job was started.
- Runtime refresh service deploy: `dispatch-convex-sync.service` redeployed and active; its model sync now calls `POST /registry/refresh` before pushing model/runtime rows to Convex.
- Validation after refresh-loop patch: Python compile passed for DISPATCH router/service/executor and worker scripts; `npm run lint` and `npm run build` passed.
- Public status after refresh-loop patch: `https://command-center.nuvuestudio.net/healthz` returned `ok`; public registry proxy returned HTTP 200; `litellm`, `dispatch-service`, `dispatch-convex-sync`, `forge-sage-orchestrator`, and Command Center `nginx` are active.
- Runtime health heartbeat: deployed `dispatch-convex-sync.service` writes `runtime_health_changed` / `runtime_health_heartbeat` events to Convex. Latest deployed loop reported `healthy`, 11 monitored services, 23 registry models, 3 unavailable models, 2 quota-blocked models, and verifier states `{passed: 2, timeout: 1}`.
- Gateway health audit: latest `system-forge-runtime` Convex event includes `hermes_gateways` with 2 watched agents, no down agents, SAGE up, KERN warning-only for stale connected state, and watchdog loaded with 300s interval / last exit code 0.
- Stale verifier recovery: live `/verification/jobs` converted old job `2` from `running` to `timeout` with error `stale running verifier exceeded 1800s`; routing decision verification JSON was updated.
- Convex verification audit: `work:listVerificationRuns` returns `dispatch-verification:2` as `timeout` and `dispatch-verification:1` as `passed` by `codex-cli-gpt55 / gpt-5.5`.
- Sync attribution fix: `dispatch_convex_sync.py` now credits the passed verifier attempt instead of the first attempted verifier when syncing verification runs.
- Validation after verifier recovery: DISPATCH redeployed successfully; `npm run lint` passed; DISPATCH/LiteLLM/Executor stayed UP; all core services remained active.
- SAGE stale in-flight recovery smoke: fixture `work-1783439070751` was moved from stale `in_progress` to `ready` with `sage_dispatch_requeued`, then intentionally cancelled so live SAGE would not execute it.
- SAGE verifier reconciliation smoke: fixture `work-1783439071948` had a synced `passed` verifier run and was reconciled from `review/running` to `done/passed` with `sage_verification_reconciled`.
- SAGE orchestrator recovery deploy: `forge-sage-orchestrator.service` redeployed with `STALE_IN_PROGRESS_MS=2700000`, `MAX_STALE_REQUEUES=1`, `RECOVERY_SCAN_LIMIT=25`; service is active.
- Post-recovery status: `python3 dispatch/dispatch_status.py` reports LiteLLM, DISPATCH, and Executor UP; executor surfaces include Claude, Codex, Codex GPT-5.5, Cursor, Gemini, Hermes-KERN, KERN-Hermes, and Hermes-VAEL.

## Active Services

| Service | Location | Purpose | Restart policy |
| --- | --- | --- | --- |
| `dispatch-service` | LXC 101 | OpenAI-compatible DISPATCH router on `:4001` | systemd |
| `dispatch-convex-sync` | LXC 101 | Syncs registry/runtime/decisions/verification jobs to Convex | systemd, restart always |
| `forge-sage-orchestrator` | LXC 101 | Polls `ready` work items and dispatches them through DISPATCH | systemd, restart always |
| `nginx` | LXC 104 | Command Center static UI and API proxy | systemd |

## Known Follow-Ups

- Fix ZenMux account/quota: aliases and key are installed, but provider smoke returns HTTP 402 Payment Required.
- Telegram remains intentionally gated behind the main SAGE Hermes gateway. The generic Telegram intake worker exists for future fleet/group behavior, but direct FORGE polling must not compete with Hermes unless explicitly switched over.
- Split the frontend bundle if the Vite chunk warning becomes annoying; it is not blocking the current build.

## 2026-07-07 16:43 WAT - SAGE-only intake simplification

- Web Command Center chat simplified to one visible SAGE intake channel. Messages create `ready` Convex work items with `orchestrator=SAGE`, `executor=DISPATCH`, and owner inferred by task domain for downstream routing.
- Generic Telegram intake worker remains available for a future same-group/fleet behavior build, but the deploy wrapper now defaults to main SAGE Hermes only and refuses to compete with a running SAGE Hermes Telegram gateway unless explicitly overridden.
- SAGE Hermes USER memory updated: BRIDGE is retired and not an active teammate, router owner, UI option, or escalation path.

## 2026-07-07 16:44 WAT - Final SAGE intake smoke

- Public Command Center redeployed after SAGE-only chat simplification: `https://command-center.nuvuestudio.net/healthz` returned `ok`.
- Lint/build passed after final UI edits.
- Dry-run intake smoke `work-1783438873453` completed end-to-end: Convex ready item -> SAGE orchestrator -> DISPATCH dry-run -> Convex executor run/routing decision/events.
- DISPATCH selected `nim / deepseek-ai/deepseek-v4-pro`; why-log recorded KERN authority for infrastructure and ZenMux skipped as `quota_exhausted`.
- Earlier non-dry-run smoke `work-1783438736624` was intentionally cancelled after a DISPATCH restart interrupted the in-flight request during deployment verification.

## 2026-07-07 17:02 WAT - Realtime audit log

- Added `/audit` as the realtime Command Center event stream backed by Convex `workEvents`.
- Added `work:listWorkEvents` so the UI can subscribe to all recent work events or filter by work item.
- `/audit` now shows live event counts, failures, warnings, completions, recent detail cards, metadata JSON, and the live terminal-style stream.
- Added terminal-style visible clear support: type `clear` in the log prompt or use the clear icon. This clears only the visible stream; durable Convex history remains visible in recent detail/search.
- Added Command Center nav entry `Audit Logs`.
- Added same-origin nginx Convex proxy under `/api/convex/` and `/api/convex-site/` because browsers block public pages from opening websockets directly to private LAN IPs.
- Updated `scripts/deploy_command_center_lxc.sh` to build production with same-origin `VITE_CONVEX_URL` through the Command Center Convex proxy.
- Verification: Convex functions deployed; Command Center redeployed; `npm run lint` and production build passed; public `/audit` loaded with 22 events, including `sage_dispatch_failed`, `sage_dispatch_requeued`, `sage_verification_reconciled`, and `audit_smoke`.
- Browser smoke verified that typing `clear` resets the visible stream to zero while the durable right-side event history remains present.

## 2026-07-07 23:38 WAT - Runtime heartbeat into audit stream

- Extended `scripts/dispatch_convex_sync.py` so the always-on sync worker also monitors runtime health and writes durable audit events under work item `system-forge-runtime`.
- Monitored endpoints now include LiteLLM, DISPATCH, Mac executor, Command Center public health, Convex, DISPATCH registry, DISPATCH verifier queue, and LXC systemd units `litellm`, `dispatch-service`, `dispatch-convex-sync`, and `forge-sage-orchestrator`.
- Events are emitted on health-state changes and every 15 minutes as a heartbeat. If Convex is temporarily unreachable, pending runtime events are spooled in the worker state file for later flush.
- Patched the sync worker to tolerate `classification_json: null` and malformed verifier attempts without crashing the whole daemon.
- Runtime metadata was trimmed to compact summaries so `/audit` remains responsive even when the registry is large.
- `/audit` metadata previews are now capped and show truncation instead of rendering giant JSON blobs.
- Deployed `dispatch-convex-sync.service`; journal shows `runtime.status=healthy`, `service_count=11`, no down/unknown services, `model_count=23`, `quota_blocked=2`, and verifier states `{passed: 2, timeout: 1}`.
- Verified Convex has the latest `system-forge-runtime` event and public Command Center `/audit` returns HTTP 200.

## 2026-07-07 23:42 WAT - Source hygiene gate

- Added `.playwright-cli/` and `.hermes/` to `.gitignore` so local browser verification output and Hermes scratch plans do not pollute deployable source.
- Added `scripts/check_forge_source_hygiene.py`.
- The check verifies 26 required source files for DISPATCH, Convex, Command Center, deploy scripts, runtime sync, SAGE orchestration, Telegram intake, and docs.
- The check scans source for raw NVIDIA/OpenRouter/Telegram-token patterns while allowing documented placeholders only.
- Verification: `python3 scripts/check_forge_source_hygiene.py` returned `FORGE source hygiene ok`.
- Full validation at 2026-07-07 23:42 WAT: Python compile passed for worker/router/executor scripts; `python3 scripts/check_forge_source_hygiene.py` passed; `python3 scripts/check_dispatch_model_aliases.py` passed with required aliases present; `python3 scripts/check_dispatch_recovery_route.py` selected NIM Nemotron when subscription/ZenMux paths were simulated as exhausted; `npm run lint` and `npm run build` passed; `python3 dispatch/dispatch_status.py` showed LiteLLM, DISPATCH, and Executor UP.

## 2026-07-08 00:06 WAT - HTTPS dashboard realtime fix

- Fixed blank `/tasks` and `/audit` pages over HTTPS. The production build was using an `http://` Convex proxy URL, which made the browser derive an insecure `ws://` realtime connection after Cloudflare/HSTS upgraded the page to HTTPS.
- Updated `scripts/deploy_command_center_lxc.sh` to default `PUBLIC_URL` to `https://command-center.nuvuestudio.net`, producing secure Convex `wss://` websocket traffic for public dashboard routes.
- The deploy script now also patches the Command Center nginx CSP to allow both `https://command-center.nuvuestudio.net` and `wss://command-center.nuvuestudio.net` in `connect-src`.
- Updated Command Center metadata/docs to prefer `https://command-center.nuvuestudio.net/`.
- Verification: production build passed, source hygiene passed, Command Center redeployed to LXC 104, public health returned `ok`, and the live HTML references the fresh bundle `assets/index-BcrWazIP.js`.

## 2026-07-07 23:44 WAT - Mac executor LaunchAgent recovery

- Hardened `scripts/deploy_mac_executor_local.sh` so it installs both the live executor source and `dispatch/executor/ai.forge.dispatch-executor.plist`.
- The script now validates the plist with `plutil`, bootstraps the LaunchAgent when missing, enables/kickstarts it, verifies launchd can print the service, and then checks `http://127.0.0.1:4100/health`.
- Added the LaunchAgent plist to `scripts/check_forge_source_hygiene.py` required source so a restored/new Mac setup cannot silently miss executor keepalive.
- Verification: `./scripts/deploy_mac_executor_local.sh` returned plist `OK` and executor health with surfaces `claude-code`, `codex`, `codex-cli-gpt55`, `cursor`, `gemini-cli`, `hermes-kern-gpt55`, `kern-hermes-gpt55`, and `hermes-vael`.
- Verification: `launchctl print gui/$(id -u)/ai.forge.dispatch-executor` showed `state = running`; `python3 dispatch/dispatch_status.py` showed LiteLLM, DISPATCH, and Executor UP.

## 2026-07-07 23:49 WAT - SAGE/KERN DISPATCH delegation skill

- Added repo-owned Hermes skill source at `hermes/skills/devops/dispatch-delegate/`, copied from the proven KERN profile skill and including DISPATCH delegation references.
- Added `scripts/install_hermes_dispatch_delegate_skill.sh` so SAGE/KERN profile-local skills can be restored from Git after backup/restore or SSD migration.
- Installed the skill into live SAGE and KERN profiles under `/Volumes/Patriot 2TB/Dev Test/Forge Core/.hermes/profiles/{sage,kern}/skills/devops/dispatch-delegate/`.
- Extended `scripts/check_forge_source_hygiene.py` so the delegation skill and installer are required source artifacts.
- Verification: `python3 dispatch/dispatch_delegate.py --dry-run --task-type implementation --domain code --verification-policy time_bounded --timeout 20 "Dry-run a SAGE delegation route for a small code maintenance task. Return one sentence."` returned `status=would_execute(dry_run)` and selected `ollama / qwen2.5-coder:14b`.

## 2026-07-07 23:56 WAT - Hermes gateway watchdog recovery

- Added repo-owned Hermes gateway wrapper at `hermes/bin/hermes-profile-gateway`, pointed at the SSD Hermes root.
- Added repo-owned watchdog at `hermes/bin/hermes-gateway-watchdog`.
- Added LaunchAgent source at `hermes/LaunchAgents/ai.hermes.gateway-watchdog.plist` and installer `scripts/install_hermes_gateway_watchdog_local.sh`.
- Watchdog checks active SAGE and KERN profile gateways every 5 minutes by default. Set `ACTIVE_AGENTS` explicitly to include additional future fleet gateways after their LaunchAgents are normalized.
- Stale but still connected gateway state is logged as a warning instead of being restarted repeatedly, so quiet periods do not create restart loops.
- Extended `scripts/check_forge_source_hygiene.py` so gateway watchdog source and installer are required restore artifacts.
- Installed the watchdog LaunchAgent on the Mac. Verification: `launchctl print gui/$(id -u)/ai.hermes.gateway-watchdog` showed `run interval = 300 seconds` and `last exit code = 0`; `launchctl list` showed SAGE and KERN gateways launchd-managed with live PIDs.

## 2026-07-08 00:00 WAT - Gateway health in audit

- Extended Mac executor `/health` with a compact `hermes_gateways` block for SAGE/KERN and the gateway watchdog.
- Gateway health includes launchd state/PID, gateway state age, Telegram connection state, warning/down reasons, watched-agent counts, watchdog interval, and watchdog last exit code.
- Patched `scripts/dispatch_convex_sync.py` so LXC runtime heartbeats trim and persist the gateway summary into Convex `/audit` metadata through the existing executor health probe.
- Redeployed the Mac executor with `scripts/deploy_mac_executor_local.sh`.
- Redeployed `dispatch-convex-sync.service` to LXC 101.
- Verification: executor `/health` reported SAGE `up`, KERN `warn` for stale connected state, no down gateway agents, and watchdog loaded with last exit code `0`.
- Verification: one-shot LXC sync wrote `hermes_gateways` into the `system-forge-runtime` Convex event; public Command Center `/audit` reads the same durable event stream.
