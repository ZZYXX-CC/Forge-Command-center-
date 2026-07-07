#!/usr/bin/env python3
"""
DISPATCH Mac executor (Phase 4).

Runs on the Mac, where the subscription CLIs are authenticated, and lets the
homelab router dispatch a task to Claude Code / Codex / Cursor headlessly. The
router calls POST /run with a bearer token.

Deliberately minimal and safe: prompt in, model text out. It is NOT an open
shell, only explicitly mapped executor surfaces can be invoked, and only with a
valid token.
"""
from __future__ import annotations
import json
import os
import shlex
import subprocess
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

MAC_HOME = Path(os.environ.get("DISPATCH_MAC_HOME", "/Users/ichris"))
HOME = MAC_HOME if MAC_HOME.exists() else Path.home()
CONF = HOME / ".dispatch-executor"
CONF.mkdir(exist_ok=True)
PORT = int(os.environ.get("EXECUTOR_PORT", "4100"))

TOKEN = os.environ.get("EXECUTOR_TOKEN")
if not TOKEN and (CONF / "token").exists():
    TOKEN = (CONF / "token").read_text().strip()

SUPPORTED_SURFACES = [
    "claude-code",
    "codex",
    "codex-cli-gpt55",
    "cursor",
    "gemini-cli",
    "hermes-kern-gpt55",
    "kern-hermes-gpt55",
    "hermes-vael",
]

# Ensure the CLIs are on PATH regardless of the launchd/nohup environment.
for _p in [str(HOME / ".local/bin"), str(HOME / ".npm-global/bin"),
           "/opt/homebrew/bin", "/usr/local/bin"]:
    if _p not in os.environ.get("PATH", ""):
        os.environ["PATH"] = _p + ":" + os.environ.get("PATH", "")


def _codex_model(model: str | None) -> str:
    """Normalize DISPATCH policy names to Codex CLI model names."""
    if not model or model == "gpt-5.5-codex":
        return "gpt-5.5"
    return model


def _resolved_model(surface: str, model: str | None) -> str | None:
    if surface in ("codex", "codex-cli-gpt55"):
        return _codex_model(model)
    if surface == "gemini-cli":
        return model or "gemini-3.5-flash"
    if surface == "claude-code":
        return model or "sonnet"
    if surface in ("hermes-kern-gpt55", "kern-hermes-gpt55"):
        return model or "gpt-5.5"
    if surface == "hermes-vael":
        return model or "vael"
    return model


def _login_shell(cmd: list[str]) -> list[str]:
    """Run subscription CLIs through Samuel's login shell so OAuth/keychain env matches Terminal."""
    return ["/bin/zsh", "-lc", " ".join(shlex.quote(part) for part in cmd)]


def _run_env(surface: str) -> dict:
    env = os.environ.copy()
    if surface in ("hermes-kern-gpt55", "kern-hermes-gpt55", "hermes-vael"):
        env.update({"HOME": str(HOME), "USER": HOME.name, "LOGNAME": HOME.name})
    return env


def build_cmd(surface: str, prompt: str, model: str | None):
    resolved_model = _resolved_model(surface, model)
    if surface == "claude-code":
        return _login_shell(["claude", "-p", prompt, "--model", resolved_model or "sonnet", "--output-format", "text"])
    if surface in ("codex", "codex-cli-gpt55"):
        return _login_shell(["codex", "exec", "--skip-git-repo-check", "--sandbox", "workspace-write",
                             "-m", resolved_model or "gpt-5.5", prompt])
    if surface in ("cursor", "cursor-pinned"):
        return _login_shell(["cursor-agent", "--trust", "-p", prompt, "--output-format", "text"])
    if surface == "gemini-cli":
        return _login_shell(["gemini", "--skip-trust", "--prompt", prompt, "--approval-mode", "plan",
                             "--output-format", "text", "--model", resolved_model or "gemini-3.5-flash"])
    if surface in ("hermes-kern-gpt55", "kern-hermes-gpt55"):
        return _login_shell(["hermes", "chat", "--profile", "kern", "--provider", "openai-codex",
                             "--model", resolved_model or "gpt-5.5", "--toolsets", "terminal,file,web", "-q", prompt])
    if surface == "hermes-vael":
        return _login_shell(["hermes", "chat", "--profile", "vael", "--toolsets", "terminal,file,web", "-q", prompt])
    return None


def _resolve_cwd(cwd: str | None) -> tuple[str | None, str | None]:
    """Validate an optional working directory for repo-scoped CLI runs."""
    if not cwd:
        return None, None
    try:
        p = Path(cwd).expanduser().resolve()
    except Exception as e:
        return None, f"bad cwd: {e}"
    if not p.exists():
        return None, f"cwd does not exist: {p}"
    if not p.is_dir():
        return None, f"cwd is not a directory: {p}"
    return str(p), None


def run_surface(surface: str, prompt: str, model: str | None, timeout: int = 300,
                cwd: str | None = None) -> dict:
    cmd = build_cmd(surface, prompt, model)
    resolved_model = _resolved_model(surface, model)
    if not cmd:
        return {"error": f"unsupported surface: {surface}", "exit_code": -1}
    resolved_cwd, cwd_error = _resolve_cwd(cwd)
    if cwd_error:
        return {"error": cwd_error, "exit_code": -3, "surface": surface, "model": model}
    t0 = time.time()
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout,
                           stdin=subprocess.DEVNULL,
                           cwd=resolved_cwd,
                           env=_run_env(surface))
        return {"output": (r.stdout or "").strip(), "stderr": (r.stderr or "").strip()[:500],
                "exit_code": r.returncode, "latency_ms": int((time.time() - t0) * 1000),
                "surface": surface, "model": resolved_model, "cwd": resolved_cwd}
    except subprocess.TimeoutExpired:
        return {"error": "timeout", "exit_code": -2, "latency_ms": int((time.time() - t0) * 1000)}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"status": "ok", "surfaces": SUPPORTED_SURFACES})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/run":
            return self._send(404, {"error": "not found"})
        if TOKEN and self.headers.get("Authorization") != f"Bearer {TOKEN}":
            return self._send(401, {"error": "unauthorized"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception as e:
            return self._send(400, {"error": f"bad body: {e}"})
        surface, prompt, model = body.get("surface"), body.get("prompt"), body.get("model")
        cwd = body.get("cwd") or body.get("repo")
        if not surface or not prompt:
            return self._send(400, {"error": "surface and prompt required"})
        timeout = int(body.get("timeout") or 300)
        self._send(200, run_surface(surface, prompt, model, timeout=timeout, cwd=cwd))

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit("refusing to start without EXECUTOR_TOKEN (open executor is unsafe)")
    print(f"DISPATCH executor listening on :{PORT}")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
