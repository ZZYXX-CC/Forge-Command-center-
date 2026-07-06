# DISPATCH Build Plan

Status: proposed, ready to start infrastructure prep then Phase 1.
Owner: Samuel (iCHRIS). Routing intelligence for the FORGE fleet.
Last updated: 2026-07-04.

## Core decision

DISPATCH is **not an autonomous agent**. It is a **deterministic routing service** (config plus code) that sits on top of systems that already run. Keep `DISPATCH-SOUL.md` as the written spec for the policy's intent, not as a personality that reasons its way to each routing decision at runtime.

Reason: the whole point of DISPATCH is "no single tool being down stops the system." If the router itself is an LLM agent, an LLM outage or rate-limit takes the failover logic down with it. A router has to be the most boring, most reliable thing in the stack. This is how it is done in practice (LiteLLM, OpenRouter, Portkey, Cloudflare AI Gateway are all deterministic policy engines with ordered fallbacks, cooldowns, and health checks, none put an LLM in charge of the routing decision).

An LLM appears in exactly one place: a small, cheap classifier at the front door for genuinely ambiguous tasks, and per the SOUL it defers to SAGE when unsure rather than guessing.

## Reuse, do not rebuild

Most of what the original brief called "build" already exists on disk:

- **Hermes** (`~/.hermes`, symlink to `Forge Core/.hermes`) is the live fleet. It already provides cron scheduling, webhooks with HMAC, a skill system, model-agnostic execution, multi-channel delivery, the five agents as profiles (plus ink and scout), a kanban DB, sessions, and memories. Its `config.yaml` already defaults to `gpt-5.5` via the `openai-codex` subscription backend (`chatgpt.com/backend-api/codex`), not the metered OpenAI API, so the subscription-first rule below is already the live pattern. DISPATCH decides, Hermes executes.
- **LiteLLM** gives quota-aware fallback, cooldown on 429s, background health checks, and retries with backoff across Anthropic, OpenAI, OpenRouter, NVIDIA NIM, and Ollama, mostly from its own config.
- **Command Center** (this repo) is Vite + React 19 + Convex, not Next.js. It already has the live-panel pattern: `convex/schema.ts` has an `agentStatus` table and `convex/agents.ts` has heartbeat and live-status queries. A DISPATCH panel extends this. Convex's native crons and durable workflows remove any need for BullMQ or Redis.
- **OpenClaw** was already tried and superseded by Hermes. Do not resurrect it as the gateway.

DISPATCH is the thin policy layer that ties these together.

## Billing model: surfaces, not just models

A model and the surface you reach it through are two different things with different billing. The same model can cost nothing at the margin or real per-token money depending on how it is invoked.

Four billing classes, capability/cost tiebreaker order:

1. `subscription`: Claude Code, Codex, Cursor, Hermes GPT-5.5 surfaces. Flat cost, capped by plan usage limits. No marginal cost per call until the cap.
2. `free_local`: Ollama on the Mac mini. No cost; best for simple/low-risk work or when subscription quota is tight.
3. `free_api`: NVIDIA NIM and OpenRouter free tiers. No cost, but rate-limited and less reliable.
4. `metered`: Anthropic API, OpenAI API, direct pay-as-you-go. Real per-token cost. Last resort.

Rule: prefer the subscription surface when multiple tools fit the task equally well, and spill to metered APIs only when subscription surfaces are unavailable/capped and free fallbacks are unsuitable. Track "subscription cap remaining" as a form of quota, exactly like an API rate limit. Frequent spill away from subscription surfaces is the logged signal that a subscription needs upgrading or a surface needs repair.

Hard rule: **refactoring, infrastructure, and production-touching work skips the free-tier attempt entirely and goes straight to a subscription tool.**

## Topology

Two roles, co-located on the same Abuja LAN (Tailscale for remote access), so the hop between them is fast.

- **Mac mini M4 16GB (.156) = inference appliance.** Runs only what needs the M4: Ollama and the local models (weights on the external SSD, not internal disk). Also holds the Mac-authenticated CLI tools (Claude Code, Codex, Cursor) for tasks that specifically need them, reached by a small local executor the brains call over the LAN or SSH.
- **Homelab (forge-node-01 Dell .100, forge-node-02 iMac Proxmox) = brains and storage.** Runs the Hermes runtime and its state, self-hosted Convex, the DISPATCH Python router, LiteLLM, and the private cloud storage. Always-on, and off the RAM-starved Mac.
- **Command Center SPA** = Vite build (Vercel or served locally). `VITE_CONVEX_URL` points at the self-hosted Convex over Tailscale. No public DB exposure needed.

Why this split: the Mac's 16GB is the hard ceiling. A loaded 9-14GB local model leaves 2-3GB of headroom, so any heavy or bursty co-resident service (a Hermes Docker sandbox at 5GB, Convex, a codebase re-index) collides with it and swaps. At idle everything coexists fine, the problem is peak concurrent load. Moving the brains to the homelab removes the collision and leaves the Mac a dedicated inference node. Ollama is the one thing that cannot move, it needs the M4. The router calls Ollama on the Mac over the LAN for local-model routing, and hands CLI-tool tasks to the Mac executor.

## Storage tiering

Internal disk is nearly full (13GB free), the external SSD has 510GB free, the homelab holds the bulk.

- **Hot, latency-sensitive, on the external SSD** (fast local USB): Ollama model weights (`OLLAMA_MODELS`), active caches, the codebase-memory graph cache, working project checkouts. Hermes state already lives here.
- **Cold, shared, backup, on the homelab private cloud**: the business and personal memory vault canonical copy, archives, Convex backups, media.
- **Keep the Mac internal disk clear.** At 13GB free it is one big download from failing. Point new data dirs at the external SSD or homelab, never internal.

**Physical drive placement.** Bulk and cloud storage attaches to the homelab, not the Mac. The Mac stays inference-only with just the Patriot SSD for hot data.

- New external HDD: plug into the Dell (forge-node-01), USB passthrough to the storage LXC. Spinning disk, so cold data only: Nextcloud bulk, backups, media. Not models or active DB.
- 2x 1TB SATA (next week): internal to the Dell as the primary Nextcloud pool. A ZFS mirror gives 1TB usable that survives one drive failure, plus snapshots and integrity checks. Use the external HDD as this pool's backup target, since a mirror protects against disk failure, not deletion or corruption.
- iMac (forge-node-02): compute or a secondary backup target. Do not split the primary pool across both nodes.
- Power: the lab is solar. Spinning disks plus abrupt power loss risks pool corruption, so add a small UPS or a safe-shutdown hook before trusting the pool with the private cloud.

## Routing policy as data

`dispatch.config.yaml` is the single source of truth. No model names in code. Editing a ranking is a file edit, never a deploy.

```yaml
billing_order: [subscription, free_local, free_api, metered]   # preference for a given capability

tiers:
  planning:                        # Tier 1, never executes code
    - {model: claude-sonnet-5, surface: claude-code,   billing: subscription}
    - {model: claude-opus-4-8, surface: claude-code,   billing: subscription, when: hard}
    - {model: claude-fable-5,  surface: claude-code,   billing: subscription, when: highest_stakes}
    - {model: gpt-5.5,         surface: codex,         billing: subscription, role: second_opinion}
    - {model: gemini-2.5-pro,  surface: gemini-cli,    billing: subscription, role: ui_design_planning}
    - {model: claude-sonnet-5, surface: anthropic-api, billing: metered}      # fallback if subscription capped
    - {model: gpt-5.5,         surface: openai-api,    billing: metered}      # fallback

  execution_routine:               # Tier 2
    - {model: gpt-5.5,           surface: hermes-kern-gpt55, billing: subscription}
    - {model: gpt-5.5,           surface: codex-cli-gpt55, billing: subscription}
    - {model: composer-2.5,      surface: cursor,        billing: subscription}
    - {model: gpt-5.5,           surface: codex,         billing: subscription}
    - {model: claude-sonnet-5,   surface: claude-code,   billing: subscription}
    - {model: qwen2.5-coder:14b, surface: ollama,        billing: free_local}
    - {model: qwen3-coder-480b,  surface: nim,           billing: free_api, rpm: 40}
    - {model: nemotron-3-ultra,  surface: openrouter,    billing: free_api}
    - {model: antigravity,       surface: antigravity,   billing: free}
    - {model: opus-or-gpt55,     surface: cursor-pinned, billing: metered}    # hard exec, deliberate

  vision:
    - {model: gemma4:12b, surface: ollama, billing: free_local}

surfaces:
  claude-code:   {kind: cli, host: mac, subscription: claude, headless: true}
  codex:         {kind: cli, host: mac, subscription: openai, headless: true}
  cursor:        {kind: cli, host: mac, subscription: cursor, background_agent: true}
  cursor-pinned: {kind: cli, host: mac, subscription: cursor, billing: metered}
  gemini-cli:    {kind: cli, host: mac, subscription: google, headless: true}
  antigravity:   {kind: cli, host: mac, free: true}
  anthropic-api: {kind: api}
  openai-api:    {kind: api}
  openrouter:    {kind: api, base_url: https://openrouter.ai/api/v1}
  nim:           {kind: api, base_url: https://integrate.api.nvidia.com/v1, rpm: 40}
  ollama:        {kind: local, host: mac, base_url: http://mac.lan:11434}
```

`host: mac` marks surfaces that physically run on the Mac and are reached from the homelab over the LAN. Model names and rankings are accurate as of mid-2026 and will drift. This file is the only thing to edit when they do.

## Convex schema additions

Alongside the existing `agentStatus` table:

- `routingDecisions`: taskId, category, complexity, urgency, chosenModel, chosenSurface, billing, tier, fallbacksTried[], reason, latencyMs, costEstimate, status, createdAt. Indexed by createdAt and by chosenSurface.
- `toolAvailability`: surfaceId, kind (api|cli|local), status (up|down|cooldown|unauth|over_quota|over_cap), cooldownUntil, lastCheckedAt, note. Indexed by surfaceId.
- `toolQuota`: surfaceId, window (minute|day|week), used, limit, resetsAt. Covers both API rate limits and subscription usage caps.
- `dispatchTasks`: source, rawInput, classification, state (queued|routing|running|done|failed), assignedSurface, timestamps.

A Convex cron resets quota counters on their window boundaries and marks stale availability rows as `unknown`.

## Infrastructure prerequisites (do first)

These are KERN-domain setup steps that the phases below assume. None require DISPATCH code.

- **Ollama on the Mac, models on the external SSD.** Install Ollama, set `OLLAMA_MODELS` to a path on the external SSD, pull `qwen2.5-coder:14b` and `gemma4:12b`. Set `OLLAMA_MAX_LOADED_MODELS=1` and override the 4K default context. Never let models land on internal disk.
- **Homelab services node.** A Proxmox VM or LXC on forge-node-01 to host the Hermes runtime, self-hosted Convex, LiteLLM, and the DISPATCH router. KERN confirms the Dell's RAM, CPU, and disk with `docker stats` and `free -h`.
- **Private cloud storage on the homelab.** A service data share (NFS or SMB, or a ZFS dataset) for service-to-service data plus a user-facing private cloud (Nextcloud) if the Dropbox-style experience is wanted. Syncthing keeps the memory vault synced across Mac, homelab, and phone.
- **Relocate the codebase-memory cache off internal disk.** Point `~/.cache/codebase-memory-mcp` to the external SSD (env var if supported, otherwise a symlink). Keep the stdio binary on the Mac (it is tied to editor sessions), run heavy re-indexes off-peak when no model is loaded.

## Phases

Each phase ships something testable on its own. Stop or reprioritize between any two.

### Phase 0: Lock the contract
Write `dispatch.config.yaml` (above). Deliverable: ranked tiers exist as editable data.

### Phase 1: LiteLLM gateway for API-reachable models
Stand up LiteLLM on the homelab node in front of Anthropic, OpenAI, OpenRouter, NIM, and Ollama (Ollama reached at the Mac's LAN address). Generate LiteLLM's `model_list` from `dispatch.config.yaml` so there is one source of truth. Deliverable: one command sends a prompt through a tier's chain, pull a key or hit a rate limit and watch it fall through, with the served model logged.

**DONE 2026-07-05.** LXC `dispatch-litellm` (VMID 101, static 192.168.1.178) on forge-node-01 runs LiteLLM 1.91.0 as systemd service `litellm` on :4000. Backends: Ollama (Mac .170, qwen2.5-coder:14b), NIM (DeepSeek V4 Pro, Kimi K2.6, GLM 5.2, Qwen3.5-397B), OpenRouter (Nemotron 3 Ultra, Qwen3-Coder). Keys in `/opt/litellm/litellm.env` (600, not in git). Deliverable met: `ollama-coder` with the local model down fell through automatically to `nvidia_nim/deepseek-ai/deepseek-v4-pro`, clean response, served-model logged. AdGuard (LXC 103) has static leases for mac-mini (.170) and dispatch-litellm (.178). Gotcha: the qwen weights blob was corrupted by the exFAT→APFS round trip (sha256 mismatch, runaway garbage output); removed and re-pulled.

### Phase 2: Self-hosted Convex on the homelab
Run the Convex Docker compose on forge-node-01. Point the Command Center at it (`CONVEX_SELF_HOSTED_URL`, admin key). Add the schema above. Deliverable: local Convex running, existing agent panel still working, new tables ready.

**DONE 2026-07-05.** LXC `forge-convex` (VMID 102, static `192.168.1.179`) on forge-node-01 runs self-hosted Convex via Docker Compose. Backend: `http://192.168.1.179:3210`; HTTP actions/site proxy: `http://192.168.1.179:3211`; dashboard: `http://192.168.1.179:6791`. Compose lives in repo at `infra/convex/docker-compose.yml` and deploy helper is `scripts/deploy_convex_homelab.sh`; live files live in LXC `/opt/forge-convex`. Admin key is stored only inside the LXC at `/opt/forge-convex/admin.key` (600). Deployed the repo `convex/` schema/functions to the self-hosted backend and seeded a `workItems` row for Phase B. Verification: backend `/version` returns `unknown`, dashboard returns HTTP 200, `npx convex deploy` completed schema validation and added Work Registry indexes, `npx convex run work:listWorkItems` returned the seeded item.

### Phase 3: The Python router (the one custom piece)
`dispatch/` package on the homelab beside Hermes:
- `classify(task)`: rules first (image present, source channel, keyword and metadata heuristics), cheap local LLM only when rules are inconclusive, defer to SAGE when low-confidence.
- `select(classification)`: walk the tier chain, skip any surface that is down, cooldown, unauth, over_quota, or over_cap, return the first healthy candidate.
- `probe()`: periodic loop updating `toolAvailability` and `toolQuota` in Convex. API via LiteLLM health, Ollama via its HTTP API at the Mac's LAN address, CLI surfaces via the Mac executor reporting auth and cap state.
- `log(decision)`: write every decision and fallback to `routingDecisions`.

Deliverable: send a task, correct tier chosen, decision and fallbacks logged and visible.

**DONE 2026-07-05.** `dispatch/router/dispatch_router.py` (rules-first classify, deterministic chain-walk, real Ollama backend probe, routes API/local via LiteLLM, CLI surfaces marked cli_pending for Phase 4, logs to SQLite). Runs in LXC 101. Verified across all three tiers: execution routed and fell through to NIM DeepSeek when the local model was down, planning walked past cli_pending Claude/Codex + unwired metered APIs to the free NIM last-resort planner, vision honestly reported no_available_surface (gemma not installed). Decisions logged with chosen_surface, served_by, latency, status. Next: Phase 2 (Convex) to surface the log in the panel; Phase 4 (Mac executor) to make the CLI surfaces routable.

### Phase 4: Execution through Hermes and the Mac executor
DISPATCH decides, Hermes executes. API-model work goes through LiteLLM on the homelab. CLI surfaces (Claude Code, Codex, Cursor, Antigravity) and local Ollama work are dispatched to a small executor on the Mac, which Hermes or the router calls over the LAN. Deliverable: a routine task lands on local Ollama, a hard task lands on Codex or Cursor on the Mac, each end-to-end and logged.

**DONE 2026-07-05.** Mac executor `dispatch/executor/executor.py` runs on the Mac (copy in `~/.dispatch-executor/`, internal disk to dodge the external-volume launchd issue), token-authed HTTP on :4100, maps a surface to `claude -p` / `codex exec` / `cursor-agent -p`. Only those 3 CLIs, only with the bearer token (stored `~/.dispatch-executor/token`, and in the LXC at `/opt/dispatch/executor.env`, both 600). Router extended with a second execution path: LiteLLM for API/local, executor for CLI surfaces. Verified: a planning task routed to `claude-code (mac executor)` = Claude Sonnet via subscription (not the metered/free fallback), an execution task preferred free_local Ollama then the subscription CLIs. All three CLIs confirmed headless (claude/codex/cursor returned clean output). Subscription-first billing now realised end to end. Executor still runs via nohup (launchd unit is a follow-up).

### Phase 5: Intake from the phone
Use Hermes's existing webhook or Telegram intake so any channel message becomes a `dispatchTasks` row. Rotate the shared bot tokens first (hazard documented in `/Volumes/Patriot 2TB/Dev Test/.openclaw/CLAUDE.md`). Do not resurrect OpenClaw. Deliverable: a task sent from the phone is classified, routed, executed, and delivered back with nothing opened manually.

### Phase 6: The DISPATCH panel
One panel in the Command Center next to SAGE, EDGE, BRIDGE, VAEL, and KERN, reading Convex reactively. Shows the routing table, live surface availability, the decision log, quota and cap burn per surface (color-coded by billing class), and a fallback-pattern alert. Use Solar icons (Iconify), not lucide. Deliverable: DISPATCH visible as one more panel, not a separate product.

### Phase 7: Unattended overnight loop
A Hermes cron kicks a nightly build cycle (pull top task, plan, code, test, ship), DISPATCH routes each step down its tier chain, every fallback logged. Deliverable: at least one full plan/code/test/ship cycle overnight with no keyboard involvement, and Hermes's skill count grows.

## Order of value

Infrastructure prerequisites first (they unblock everything). Then Phases 1 and 3 are the heart (fallback proven, then routing proven). Phases 2 and 6 make it visible. Phases 4, 5, and 7 make it autonomous.

## Open questions and risks

- **Mac-authenticated CLI tools.** Claude Code and Codex have headless CLIs that a small Mac executor can drive. Cursor is a GUI app and is the awkward one to invoke from the homelab, so treat Cursor as Mac-local and reachable only through the executor, or lean on its background-agent mode. Verify at build time.
- **Homelab capacity and uptime.** The lab is solar-powered in Abuja. KERN confirms the Dell can hold Hermes plus Convex plus a share, and that the power and Tailscale uptime meet the round-the-clock requirement, since the brains now live there.
- **Subscription concurrency.** A single subscription seat may limit concurrent headless sessions. Overnight parallel builds may exhaust it and spill to metered API. DISPATCH tracks this as `over_cap` quota.
- **Headless CLI is heavier to invoke than a plain API call.** Worth it for flat-rate billing, but the classifier should avoid sending trivial one-shot text to a CLI surface when a cheap local model will do.
- **Cursor ownership.** The SpaceX acquisition and in-house model mean Cursor's access to Claude and GPT is not guaranteed long-term. It stays a swappable config entry, not a pillar.
- **Convex self-hosted is a service KERN now owns and patches.** That is the cost of leaving the cloud.

## Reference

- LiteLLM routing and fallbacks: https://docs.litellm.ai/docs/routing
- Convex self-hosting: https://docs.convex.dev/self-hosting
- Convex scheduling and crons: https://docs.convex.dev/scheduling
- Hermes (live fleet): `Forge Core/.hermes`, docs at hermes-agent.nousresearch.com
