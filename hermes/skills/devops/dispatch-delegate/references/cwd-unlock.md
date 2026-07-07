# DISPATCH cwd Unlock and Deployment Notes

Use this when DISPATCH delegation needs executor-backed CLI surfaces (Claude Code, Codex, Cursor) to operate inside a specific repository.

## Required propagation path

A repo-scoped DISPATCH request must carry `cwd` or `repo` through every layer:

1. `dispatch/dispatch_delegate.py`
   - Accept `--cwd` / `--repo`.
   - Include `cwd` in the POST body to `/v1/chat/completions`.
2. `dispatch/router/dispatch_service.py`
   - Read `cwd = body.get("cwd") or body.get("repo")`.
   - Forward it to `execute_executor(...)`.
3. `dispatch/router/dispatch_router.py`
   - `execute_executor(surface, text, model, cwd=None, repo=None)` includes `cwd` in the executor payload.
   - CLI can expose `--cwd` / `--repo` for direct router tests.
4. Mac executor `~/.dispatch-executor/executor.py`
   - Accept `cwd` / `repo` from `/run` body.
   - Validate path exists and is a directory.
   - Pass `cwd=resolved_cwd` to `subprocess.run(...)`.

## Redeploy checklist

- Copy repo executor to live Mac path:
  - `dispatch/executor/executor.py` → `~/.dispatch-executor/executor.py`
- Restart Mac executor process with `EXECUTOR_TOKEN` loaded from `~/.dispatch-executor/token`.
- Copy router/service files to LXC 101:
  - `dispatch/router/dispatch_router.py` → `/opt/dispatch/router/dispatch_router.py`
  - `dispatch/router/dispatch_service.py` → `/opt/dispatch/router/dispatch_service.py`
- Restart LXC service:
  - `ssh forge-node-01 'pct exec 101 -- systemctl restart dispatch-service'`

## Verification

- Direct executor POST with a valid repo cwd should return the resolved `cwd` field in JSON.
- If using Codex, stderr should show `workdir: <repo path>` even if Codex itself later fails auth.
- Service-level invalid-cwd POST should fail with an executor error, proving the `cwd` reached the Mac executor.
- Run `python3 dispatch/dispatch_status.py` and confirm LiteLLM, DISPATCH, and Executor are UP.

## Important caveat

Do not confuse `cwd` propagation with CLI auth. The cwd unlock can be correct while Claude/Codex/Cursor still return login or 401 messages. Treat that as a subscription CLI authentication issue, not a DISPATCH routing/cwd bug.
