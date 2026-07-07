# FORGE-native execution roadmap

Session learning: do not treat the Command Center build as a frontend-only cleanup task. The system being built is a routed FORGE execution layer:

```text
Telegram + Command Center
→ Hermes FORGE agents
→ DISPATCH router
→ Ollama / NIM / OpenRouter / Codex / Claude Code / Cursor
→ Convex log
→ Command Center visibility
```

## Critical path

Use this stack first:

- Hermes: agent runtime, Telegram, cron, skills, memory/session history.
- DISPATCH: deterministic task classification, tier selection, fallback, routing log.
- Mac executor: repo-cwd execution for Claude Code, Codex, and Cursor CLI surfaces.
- LiteLLM: gateway for Ollama, NVIDIA NIM, OpenRouter, and optional metered APIs.
- Convex: live work registry, routing decisions, surface status, agent heartbeats.
- Command Center: cockpit for task intake, active workflows, decisions, approvals, and domain dashboards.
- GitHub: code truth, branches, PRs, external audit artifact.

## Antfarm / Paperclip decision

Antfarm and Paperclip are not critical-path dependencies for the next build.

- Antfarm: keep workflow patterns only — `plan → implement → verify → test → PR → review`, fresh contexts, separate verifier/tester, retry/escalation gates. Do not require the Antfarm runtime before shipping the FORGE loop.
- Paperclip: keep concepts only — org chart, tickets, budgets, heartbeats, audit. Implement a lean Convex FORGE Work Registry first; optionally bridge Paperclip later if it adds value.

## Revised phases

1. **Phase A — First-class delegation**: SAGE/KERN can call DISPATCH explicitly from Hermes/Telegram with repo cwd and receive routed results.
2. **Phase B — Convex Work Registry**: `workItems`, `workEvents`, `workflowRuns`, `workflowSteps`, `routingDecisions`, `surfaceStatus`, `approvals`.
3. **Phase C — Execution cockpit**: Command Center shows task submit, queue, route/fallback log, surface health, quota/cap, approvals, and PR links.
4. **Phase D — Lightweight workflow runner**: FORGE-native Antfarm replacement using Convex state + Hermes cron + DISPATCH per step.
5. **Phase E — Agent governance**: ownership, budgets/caps, approval gates, immutable audit trail.
6. **Phase F — Domain dashboards**: trading, P2P, sites, money, clients, tasks, content once the core execution loop works.

## Operating contract

For coding/client work:

1. KERN/SAGE decomposes the work.
2. Implementation goes through DISPATCH executor surfaces with `cwd`/`repo`.
3. KERN verifies diffs and runtime outputs.
4. KERN only makes small direct fixes when delegation is blocked or verification exposes a precise issue.
5. Update `docs/DISPATCH_HANDOFF.md` after infrastructure changes and `docs/FORGE_NATIVE_EXECUTION_PLAN.md` after roadmap/strategy changes.

## Common pitfall

If the user asks to "complete Command Center," do not jump directly to frontend type/build cleanup. First anchor to the FORGE-native plan and confirm which phase is being implemented. The Command Center is the cockpit for routed FORGE execution, not just a dashboard.
