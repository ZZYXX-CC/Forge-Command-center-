# FORGE Executor Surfaces via DISPATCH

Use this reference when wiring DISPATCH into the FORGE Command Center execution system.

## Role model

- SAGE is the orchestrator: priority, assignment, global sequencing, approval.
- KERN is a technical executor: local implementation planning, code/infra work, verification.
- Codex CLI, Claude Code, Cursor Agent, and Hermes-KERN-GPT5.5 are executor surfaces. They may plan inside a bounded assignment, but they should not own global orchestration.

## Recommended surface set

- `codex-cli-gpt55`: Codex CLI for repo-native edits/reviews. Use explicit `gpt-5.5` and writable workspace mode.
- `claude-code`: Claude Code CLI for repo-native coding when available.
- `cursor`: Cursor Agent for repo edits; use trusted workspace mode for known FORGE repos.
- `hermes-kern-gpt55`: Hermes profile `kern` running `openai-codex/gpt-5.5`, useful as a GPT-5.5 executor that can use Hermes credential pooling and KERN skills/tools.
- `ollama-coder`, `nim-coder`, `openrouter`: local/API fallback surfaces.

## Codex CLI writable pattern

Codex CLI should not be invoked for write tasks with the default read-only sandbox. Use workspace-write for trusted repo-scoped work:

```bash
HOME=/Users/ichris codex exec \
  --skip-git-repo-check \
  --sandbox workspace-write \
  -m gpt-5.5 \
  -C /absolute/repo/path \
  "TASK TEXT"
```

Avoid full sandbox bypass unless the repo/path is externally controlled and the user explicitly accepts the risk.

## Hermes-KERN-GPT5.5 executor pattern

Expose a DISPATCH surface that shells into Hermes as KERN for bounded technical execution:

```bash
HOME=/Users/ichris hermes chat \
  --profile kern \
  --provider openai-codex \
  --model gpt-5.5 \
  --toolsets terminal,file,web,github \
  -q "TASK TEXT"
```

If repo context is needed, run from the repo workdir or pass the repo path inside the task. Hermes' openai-codex provider can use its credential pool, making this a fallback when a standalone Codex CLI session hits rate/session limits.

## Work visibility contract

For privacy/self-sufficiency, prefer GitHub + Convex + Command Center over Linear as the default FORGE task layer:

- GitHub: code audit, issues/PRs, branches, reviews, CI.
- Convex: private work registry, assignments, execution ledger, DISPATCH route history, agent heartbeats, approvals.
- Command Center `/work`: human-visible cockpit for who is doing what, current state, blockers, PR links, and verification status.

Linear or Plane can be adapter-backed providers later, but do not block the private Convex/GitHub work page on them.
