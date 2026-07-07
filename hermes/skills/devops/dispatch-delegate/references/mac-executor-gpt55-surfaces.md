# Mac Executor GPT-5.5 Surfaces — 2026-07-05

Use this when extending or debugging FORGE DISPATCH executor surfaces on Samuel's Mac mini.

## Durable lesson

Subscription CLI executors launched by `launchd` may not behave like the same command in Samuel's Terminal unless they run with the real Mac home, full user env, and login shell. For Codex/Hermes executor surfaces, the working pattern is:

- Launch the executor with `HOME=/Users/ichris`, real PATH, USER/LOGNAME/SHELL/LANG/TERM set.
- Run subscription CLIs through `/bin/zsh -lc` with shell-quoted args, not as bare subprocess argv from launchd.
- Set `stdin=subprocess.DEVNULL` for one-shot CLI subprocesses so they do not wait on inherited stdin.
- Keep cwd forwarding explicit: validate `cwd`/`repo`, then pass `cwd=resolved_cwd` to `subprocess.run`.

## Codex writable executor pattern

Codex must be run with explicit writable workspace mode and model:

```bash
codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-5.5 "TASK"
```

DISPATCH policy can expose both `codex` and `codex-cli-gpt55`; aliases may fold `codex-cli-gpt55` onto executor surface `codex`.

Verification expected in stderr:

```text
model: gpt-5.5
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
```

## KERN/Hermes GPT-5.5 executor surface

Add a Mac executor surface such as:

```text
hermes-kern-gpt55
kern-hermes-gpt55
```

Command shape:

```bash
hermes chat --profile kern --provider openai-codex --model gpt-5.5 --toolsets terminal,file,web -q "TASK"
```

Purpose: use Hermes' OpenAI-Codex GPT-5.5 credential pool as an executor fallback when Codex CLI is rate-limited, read-only, or otherwise unavailable.

## LaunchAgent pattern

Install the Mac executor as a LaunchAgent, not a manual background process:

```text
~/Library/LaunchAgents/ai.forge.dispatch-executor.plist
```

Minimum env keys:

```text
HOME=/Users/ichris
PATH=/Users/ichris/.local/bin:/Users/ichris/.npm-global/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
EXECUTOR_PORT=4100
USER=ichris
LOGNAME=ichris
SHELL=/bin/zsh
LANG=en_US.UTF-8
LC_ALL=en_US.UTF-8
TERM=xterm-256color
```

Verification:

```bash
launchctl print gui/$(id -u)/ai.forge.dispatch-executor
curl http://127.0.0.1:4100/health
```

## LXC deploy pitfall

Source repo changes to `dispatch/router/dispatch_router.py` and `dispatch/dispatch.config.yaml` do not update the live DISPATCH service automatically. After source changes, deploy to the LXC and restart `dispatch-service`:

```bash
scp dispatch/dispatch.config.yaml dispatch/router/dispatch_router.py dispatch/router/dispatch_service.py root@192.168.1.178:/opt/dispatch/router/
ssh root@192.168.1.178 'systemctl restart dispatch-service && systemctl status dispatch-service --no-pager'
```

If SSH from Hermes lacks auth, report that blocker directly and leave Mac-local surfaces verified; do not claim LXC deployment completed.

## Smoke tests

Direct executor POSTs should return exact sentinel strings:

- Codex: `CODEX_EXECUTOR_OK`, exit 0, model `gpt-5.5`, sandbox `workspace-write`.
- Hermes-KERN: `HERMES_KERN_EXECUTOR_OK`, exit 0.

Then run full repo checks before committing:

```bash
python3 -m py_compile dispatch/executor/executor.py dispatch/router/dispatch_router.py dispatch/router/dispatch_service.py
npm run lint -- --pretty false
npm run build
```
