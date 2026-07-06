# FORGE Operating Model

Status: active policy.
Owner: Samuel (iCHRIS). Orchestration: SAGE. Routing: DISPATCH.
Last updated: 2026-07-06.

This document is the compact mental model for how Command Center, DISPATCH, Hermes, memory, and model surfaces fit together.

## The four layers

### 1. Intelligence

Claude models plan, reason, review architecture, and make security/design decisions.

Tier 1 is planning only. It must not execute code or mutate infrastructure.

Default planning ladder:

1. Claude Sonnet 5 — default planner.
2. Claude Opus 4.8 — escalate for genuinely hard decisions.
3. Claude Fable 5 / Mythos-tier — highest-stakes only; roughly 2x Opus cost.
4. Codex / GPT-5.5 — peer review for security-tagged work. Run in parallel with Claude when the task is security-sensitive; disagreement is a signal to surface to SAGE.
5. Google Gemini CLI — design/UI planning where Figma, Stitch, or MCP-derived design specs matter. Transitional because Google is folding this layer into Antigravity.

### 2. Execution / Routing

DISPATCH is the deterministic router.

It does not become the brain. It classifies, checks live availability, walks the ranked tier chain, assigns the best available surface, and logs every fallback.

No single tool being down, unauthenticated, over quota, or rate-limited should stop work.

### 3. Research / Work

Hermes Agent is the round-the-clock worker layer.

Hermes owns:

- always-on agent profiles
- Telegram/webhook intake
- cron scheduling
- session continuity
- skills and compounding procedural memory
- tool execution and verification loops

DISPATCH is invoked by Hermes as a delegation/routing layer for bounded tasks. Do not point Hermes agent backends directly at DISPATCH.

### 4. Self / Memory

There are two separate memory scopes:

1. Existing codebase memory MCP — project/code context. Leave this untouched.
2. New markdown vault — business, personal, strategic, and operating context in Obsidian-compatible format.

The markdown vault is for Samuel/FORGE context, not repo embeddings. The codebase memory MCP stays focused on project context and code navigation.

## Billing philosophy

Explicit tiebreaker:

```yaml
billing_order: [subscription, free_local, free_api, metered]
```

Subscription tools cost nothing extra at the margin, so they get preference when multiple tools fit a task equally well.

Order:

1. `subscription` — Claude Code, Codex, Cursor, Hermes GPT-5.5 surfaces.
2. `free_local` — Ollama.
3. `free_api` — NVIDIA NIM, OpenRouter free tiers.
4. `metered` — direct pay-as-you-go APIs. True last resort.

Local/free surfaces are still useful for simple and low-risk tasks. But production-touching work should not waste time on weak attempts just because they are free.

Hard rule:

Refactoring, infrastructure, and production-touching work skips the free-tier attempt entirely and goes straight to a subscription tool.

## Tier 1: Planning, security, design

Never execution.

- Claude Sonnet 5 — default planner.
- Claude Opus 4.8 — hard decisions.
- Claude Fable 5 / Mythos-tier — highest-stakes only.
- Codex / GPT-5.5 — security peer; run alongside Claude for security-tagged work.
- Gemini CLI — UI/design planning with real design specs; transitional toward Antigravity.

## Tier 2: Execution

Subscription-first according to `billing_order`.

1. Hermes on GPT-5.5 / KERN profile — infrastructure, KERN-owned automation, refactors.
2. Codex CLI on GPT-5.5 — repo edits and code execution with writable workspace.
3. Cursor — Composer 2.5 default; pinned frontier model for hard cases. If Claude Code is unavailable, check whether Claude is reachable through Cursor.
4. Claude Code on Sonnet 5.
5. Local Ollama — `qwen2.5-coder:14b`; `gemma4:12b` for vision. Simple/low-risk work or when subscription quota is tight.
6. NVIDIA NIM / OpenRouter — free fallbacks such as Qwen3 Coder 480B and Nemotron 3 Ultra.
7. Antigravity — overflow/future layer.
8. Metered direct billing — true last resort.

## Failover requirement

DISPATCH must:

- walk the ranked chain for the task tier
- check live availability before assigning
- skip down, unauthenticated, over-quota, over-cap, or cooldown surfaces
- log every fallback
- surface recurring fallback patterns as a signal, usually meaning a subscription needs upgrading or a surface needs repair

The goal is not cheapest output. The goal is uninterrupted, high-quality work with cost-aware routing.
