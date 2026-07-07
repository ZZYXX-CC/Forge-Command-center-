---
name: dispatch-delegate
description: Delegate self-contained tasks to the FORGE DISPATCH routing layer without changing Hermes model backends.
version: 1.0.0
author: KERN
platforms: [macos]
metadata:
  hermes:
    tags: [dispatch, delegation, forge, routing]
---

# DISPATCH Delegate

Use this skill when Samuel asks KERN/SAGE to delegate a self-contained task to the FORGE DISPATCH layer.

## Critical rule

Do **not** point any Hermes agent's model backend at DISPATCH. Hermes keeps its normal tool-calling backend. DISPATCH is used only as an explicit delegation surface for discrete tasks.

## Command

From the Forge Command Center repo:

```bash
python3 dispatch/dispatch_delegate.py "TASK TEXT"
```

Default service URL:

```text
http://192.168.1.178:4001/v1/chat/completions
```

Override if needed:

```bash
DISPATCH_URL=http://host:4001/v1/chat/completions python3 dispatch/dispatch_delegate.py "TASK TEXT"
```

For repo-scoped executor surfaces after the cwd unlock:

```bash
python3 dispatch/dispatch_delegate.py --cwd "/absolute/repo/path" "TASK TEXT"
# or
python3 dispatch/dispatch_delegate.py --repo "/absolute/repo/path" "TASK TEXT"
```

## Workflow

1. **Respect FORGE roles.** SAGE is the orchestrator/priority owner. KERN is a technical executor surface like Codex CLI, Claude Code, and Cursor: KERN may plan locally inside an assigned technical task, but should not own global priority/routing decisions.
2. For coding/client-work, delegate implementation to DISPATCH executor surfaces (KERN/Hermes-GPT5.5, Cursor, Codex, Claude Code) with `--cwd`/`--repo`; only make direct edits for small targeted fixes, verification adjustments, or executor plumbing that blocks delegation.
3. Keep tasks self-contained: include objective, relevant paths, constraints, expected output, and whether file edits are expected.
4. Prefer planning/code-generation/review requests over open-ended multi-turn work. For large builds, split into bounded phases and delegate each phase separately.
5. Capture both stdout and stderr; stderr includes routing summary (`tier`, `chosen_surface`, `via`, `latency_ms`, `status`).
6. Verify the returned code or recommendation before applying it: inspect diffs, run compile/lint/build/smoke checks, then commit/push.
7. If a DISPATCH executor returns login/auth/rate-limit/read-only/workspace-trust text, do not assume the task was completed; treat it as a routing/executor blocker, fix the executor/auth issue if appropriate, then retry or route to a different surface.
8. Keep the live plan visible: update `docs/DISPATCH_HANDOFF.md` after infra changes and `docs/FORGE_NATIVE_EXECUTION_PLAN.md` after strategy/roadmap changes.
9. For private FORGE work visibility, prefer GitHub + Convex + Command Center `/work` over Linear by default; Linear/Plane can be adapter-backed later.

See `references/forge-executor-surfaces.md` for the FORGE executor role model, Codex writable invocation, Hermes-KERN-GPT5.5 surface pattern, and GitHub/Convex work-visibility contract.

## Verification

- Run `python3 dispatch/dispatch_status.py` before/after important changes.
- For service health: `curl http://192.168.1.178:4001/health`.
- For recent routing log: `curl http://192.168.1.178:4001/decisions`.
- For live surface availability: `curl http://192.168.1.178:4001/surfaces`.

## Support references

- `references/cwd-unlock.md` — implementation/deployment checklist for forwarding `cwd`/`repo` through `dispatch_delegate.py`, `dispatch_service.py`, `dispatch_router.py`, and the Mac executor.
- `references/forge-native-execution.md` — FORGE-native roadmap and operating contract: Antfarm/Paperclip are optional reference layers; Hermes + DISPATCH + Convex + Command Center + GitHub are the critical path.
- `references/codebase-memory-mcp.md` — using the Mac mini `codebase-memory-mcp` CLI for Command Center architecture lookup and indexing.
- `references/mac-executor-gpt55-surfaces.md` — Mac executor patterns for `hermes-kern-gpt55`, writable Codex GPT-5.5, LaunchAgent env, login-shell subprocesses, and LXC deploy verification.

## Known repo path

```text
/Volumes/Patriot 2TB/Dev Test/.openclaw/workspace/Forge-Command-center
```

## Mac executor auth pitfall

Hermes profile shells may run with `HOME` set to the profile sandbox, for example:

```text
/Users/ichris/.hermes/profiles/kern/home
```

Claude Code, Codex, Cursor, and GitHub credentials that Samuel configured in the normal Mac terminal live under the real Mac home:

```text
/Users/ichris
```

When checking or starting DISPATCH executor tools, force the real HOME if auth looks missing:

```bash
HOME=/Users/ichris gh auth status
HOME=/Users/ichris git push ...
# Start with the real Mac HOME and load EXECUTOR_TOKEN from /Users/ichris/.dispatch-executor/token.
# Avoid starting it from the Hermes profile HOME, or CLI/keychain auth may be invisible.
HOME=/Users/ichris EXECUTOR_TOKEN=<token-from-/Users/ichris/.dispatch-executor/token> \
  /opt/homebrew/bin/python3 /Users/ichris/.dispatch-executor/executor.py
```

Symptom this fixes: executor-launched `claude`, `codex`, `cursor-agent`, or `gh` report unauthenticated even though they work in Samuel's Mac terminal.
