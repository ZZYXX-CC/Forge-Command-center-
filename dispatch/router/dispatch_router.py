#!/usr/bin/env python3
"""
DISPATCH router (Phase 3 + Phase 4).

Classify a task, select a surface from the tier chain in dispatch.config.yaml,
route it, and log every decision. Two execution paths:
  - LiteLLM gateway (homelab)  for API/local surfaces (ollama, nim, openrouter)
  - Mac executor (over LAN)    for CLI/subscription surfaces (KERN/Hermes, claude-code, codex, cursor)

The router NEVER reasons its way to a decision at runtime: classification is
rules-first (with a low-confidence flag that, per DISPATCH's SOUL, means "ask
SAGE"), and selection is a deterministic walk down the ranked chain checking
live availability. It must stay up and correct even when models are down.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import os
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import yaml

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from registry.registry import get_registry

CONFIG_PATH = os.environ.get("DISPATCH_CONFIG", str(HERE.parent / "dispatch.config.yaml"))
LITELLM_URL = os.environ.get("LITELLM_URL", "http://localhost:4000")
EXECUTOR_URL = os.environ.get("EXECUTOR_URL", "http://192.168.1.170:4100")
EXECUTOR_TOKEN = os.environ.get("EXECUTOR_TOKEN", "")
DB_PATH = os.environ.get("DISPATCH_DB", str(HERE / "dispatch-log.db"))

# API/local surfaces reachable through the LiteLLM gateway -> proxy model_name.
LITELLM_SURFACE_MODELS = {
    "ollama": "ollama-coder",
    "nim": "nim-deepseek",
    "openrouter": "openrouter-nemotron",
    "zenmux": "zenmux-claude-sonnet-5-free",
}
LITELLM_MODEL_PROXY_ALIASES = {
    ("ollama", "qwen2.5-coder:14b"): "ollama-coder",
    ("nim", "deepseek-ai/deepseek-v4-pro"): "nim-deepseek",
    ("nim", "moonshotai/kimi-k2.6"): "nim-kimi",
    ("nim", "nvidia/nemotron-3-ultra-550b-a55b"): "nim-nemotron",
    ("nim", "minimaxai/minimax-m3"): "nim-minimax",
    ("openrouter", "nvidia/nemotron-3-ultra-550b-a55b:free"): "openrouter-nemotron",
    ("openrouter", "qwen/qwen3-coder:free"): "openrouter-qwen",
    ("zenmux", "anthropic/claude-sonnet-5-free"): "zenmux-claude-sonnet-5-free",
    ("zenmux", "anthropic/claude-fable-5-free"): "zenmux-claude-fable-5-free",
}
# CLI surfaces reachable through the Mac executor. Aliases only fold legacy names.
CLI_SURFACES = {
    "claude-code", "codex", "codex-cli-gpt55", "cursor", "cursor-pinned", "antigravity",
    "hermes-kern-gpt55", "kern-hermes-gpt55", "hermes-vael", "gemini-cli",
}
EXEC_ALIAS = {"cursor-pinned": "cursor", "kern-hermes-gpt55": "hermes-kern-gpt55"}
AGENT_SURFACES = {"vael": "hermes-vael"}
VAEL_SURFACE = "hermes-vael"
FREE_BILLINGS = frozenset({"free", "free_local", "free_api"})
VERIFIER_ROLES = frozenset({"verification", "recovery_or_verification", "design_compliance_verification"})
CIRCUIT_FAILURE_THRESHOLD = int(os.environ.get("DISPATCH_CIRCUIT_FAILURE_THRESHOLD", "3"))
CIRCUIT_OPEN_SECONDS = int(os.environ.get("DISPATCH_CIRCUIT_OPEN_SECONDS", "300"))
DEFAULT_RATE_LIMIT_RESET_SECONDS = int(os.environ.get("DISPATCH_RATE_LIMIT_RESET_SECONDS", "60"))
VAEL_GATE_TIMEOUT_SECONDS = int(os.environ.get("DISPATCH_VAEL_GATE_TIMEOUT_SECONDS", "45"))
VERIFICATION_JOB_TIMEOUT_SECONDS = int(os.environ.get("DISPATCH_VERIFICATION_JOB_TIMEOUT_SECONDS", "1800"))
_LIMIT_RESET_RE = re.compile(
    r"resets?\s+([A-Za-z]{3,9})\s+(\d{1,2})\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s*\(([^)]+)\))?",
    re.I,
)
_MONTHS = {name.lower(): idx for idx, name in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 1
)}
_MONTHS.update({
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
})


# ---------------------------------------------------------------- config
def load_config(path: str = CONFIG_PATH) -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


# ---------------------------------------------------------------- classify
_PLAN = re.compile(r"\b(plan|architect(ure)?|design|decide|decision|trade[- ]?off|"
                   r"strategy|approach|should we|evaluate|threat model|security)\b", re.I)
_RESEARCH = re.compile(r"\b(research|investigate|compare|survey|explore|look up|find out|"
                       r"analy[sz]e|review options|due diligence)\b", re.I)
_REFACTOR = re.compile(r"\b(refactor|redesign|restructure|simplify|cleanup|clean up|"
                       r"technical debt|architecture change|large change)\b", re.I)
_INFRA = re.compile(r"\b(infra(structure)?|deploy|deployment|production|prod|server|lxc|vm|"
                    r"proxmox|cloudflare|dns|tunnel|caddy|nginx|docker|convex|database|db|"
                    r"migration|firewall|systemd|service|ingress|routing)\b", re.I)
_UI = re.compile(r"\b(ui|ux|frontend|front[- ]?end|design|visual|layout|component|"
                 r"tailwind|css|responsive|figma|stitch|mockup|wireframe|"
                 r"accessibility|a11y|design compliance)\b", re.I)
_EXEC = re.compile(r"\b(write|implement|fix|refactor|add|build|code|function|bug|"
                   r"patch|script|endpoint|test|deploy|migrat)\w*\b", re.I)
_PLANNING_ONLY = re.compile(
    r"\b(create|draft|write|update|revise|edit|reorder|rework|adjust|document)\w*\b"
    r".{0,80}\b(plan|doc(?:s|umentation)?|architecture|architectural decision|adr|"
    r"decision record|roadmap|spec|handoff)\b"
    r"|\b(plan|doc(?:s|umentation)?|architecture|architectural decision|adr|"
    r"decision record|roadmap|spec|handoff)\b"
    r".{0,80}\b(create|draft|write|update|revise|edit|reorder|rework|adjust|document)\w*\b",
    re.I,
)
_HARD = re.compile(r"\b(hard|complex|novel|architecture|security|distributed|"
                   r"concurren\w*|race condition|migration|redesign)\b", re.I)
_URGENT = re.compile(r"\b(now|urgent|asap|immediately|right away|critical)\b", re.I)


def _is_planning_only_request(text: str) -> bool:
    """Doc/plan/architecture maintenance wins over UI keywords."""
    return bool(_PLANNING_ONLY.search(text))


# Classifier self-check (no PyYAML needed for classify()):
#   python3 - <<'PY'
#   import sys, types
#   sys.modules.setdefault('yaml', types.SimpleNamespace(safe_load=lambda *_a, **_k: None))
#   from dispatch.router.dispatch_router import classify
#   assert classify('Update the implementation plan for VAEL UI gate')['category'] == 'planning'
#   assert classify('Implement a responsive Tailwind status card')['category'] == 'execution_ui_design'
#   assert classify('Fix API endpoint bug')['category'] == 'execution_routine'
#   print('classifier self-checks passed')
#   PY


def _classify_from_intent(intent: dict | None) -> dict | None:
    """Explicit routing intent wins over keyword guessing when present."""
    if not intent:
        return None
    target = intent.get("target_tier") or intent.get("category")
    task_type = (intent.get("task_type") or "").lower()
    domain = (intent.get("domain") or "").lower()
    if not target:
        if task_type == "planning":
            target = "planning"
        elif domain in ("ui", "ui_design", "frontend", "front_end", "design"):
            target = "execution_ui_design"
        elif domain in ("infra", "infrastructure", "ops", "devops"):
            target = "execution_infrastructure"
        elif task_type in ("implementation", "execute", "execution", "fix", "build") or domain in ("code", "general"):
            target = "execution_routine"
        elif task_type in ("research", "discovery"):
            target = "research"
    if not target:
        return None
    sensitivity = (intent.get("sensitivity") or "").lower()
    complexity = "hard" if sensitivity in ("high", "sensitive", "critical", "high_stakes") else "routine"
    urgency = "now" if (intent.get("urgency") or "").lower() in ("now", "urgent", "asap") else "queue"
    return {"category": target, "target_tier": target, "task_type": intent.get("task_type"),
            "complexity": complexity, "urgency": urgency, "confidence": "explicit",
            "domain": domain or None, "capabilities_required": intent.get("capabilities_required") or [],
            "sensitivity": sensitivity or "medium", "authority_agent": intent.get("authority_agent"),
            "verification_policy": intent.get("verification_policy"),
            "verification_required": intent.get("verification_policy") == "required" or bool(intent.get("verification_required")),
            "classifier_model": "typed_intent",
            "why": f"typed_intent={json.dumps(intent, sort_keys=True)}"}


def classify(text: str, has_image: bool = False, routing_intent: dict | None = None) -> dict:
    """Rules-first classification. Typed routing intent overrides keyword fallback."""
    typed = _classify_from_intent(routing_intent)
    if typed:
        return typed
    t = text or ""
    # Try free model classifier before keyword fallback
    model_result = _model_classify(t)
    if model_result:
        return model_result
    if has_image:
        return _complete_classification({"category": "vision", "complexity": "routine", "urgency": "queue",
                "confidence": "high", "why": "image present", "classifier_model": "deterministic"})
    planning_only = _is_planning_only_request(t)
    plan, ex = bool(_PLAN.search(t)) or planning_only, bool(_EXEC.search(t))
    research, refactor, infra, ui = bool(_RESEARCH.search(t)), bool(_REFACTOR.search(t)), bool(_INFRA.search(t)), bool(_UI.search(t))
    if planning_only:
        category, confidence = "planning", "high"
    elif ui and ex:
        category, confidence = "execution_ui_design", "high"
    elif plan and not ex:
        category, confidence = "planning", "high"
    elif research and not ex:
        category, confidence = "research", "high"
    elif infra and ex:
        category, confidence = "execution_infrastructure", "high"
    elif refactor and ex:
        category, confidence = "execution_refactor", "high"
    elif ex and not plan:
        category, confidence = "execution_routine", "high"
    elif ex and plan:
        category, confidence = "planning", "medium"
    else:
        category, confidence = "execution_routine", "low"
    complexity = "hard" if (_HARD.search(t) or len(t) > 600) else "routine"
    urgency = "now" if _URGENT.search(t) else "queue"
    return _complete_classification({"category": category, "complexity": complexity, "urgency": urgency,
            "confidence": confidence,
            "classifier_model": "deterministic",
            "why": f"plan_kw={plan} planning_only={planning_only} research_kw={research} refactor_kw={refactor} infra_kw={infra} ui_kw={ui} exec_kw={ex}"})


def _complete_classification(cls: dict) -> dict:
    category = cls.get("category") or cls.get("target_tier") or "execution_routine"
    domain = cls.get("domain")
    capabilities = cls.get("capabilities_required") or []
    authority = cls.get("authority_agent")
    default_capabilities = ["coding"]
    if category == "execution_ui_design":
        domain = domain or "ui_design"
        default_capabilities = ["frontend", "design_system"]
        authority = "vael"
    elif category == "execution_infrastructure":
        domain = domain or "infrastructure"
        default_capabilities = ["infrastructure"]
        authority = "kern"
    elif category in ("planning", "research"):
        domain = domain or category
        default_capabilities = ["reasoning"]
        authority = authority or "sage"
    elif category == "vision":
        domain = domain or "vision"
        default_capabilities = ["vision"]
    else:
        domain = domain or "code"
    capabilities = _normalize_required_capabilities(category, capabilities, default_capabilities)
    cls["category"] = category
    cls["target_tier"] = category
    cls["domain"] = domain
    cls["capabilities_required"] = capabilities
    cls["sensitivity"] = cls.get("sensitivity") or ("high" if cls.get("complexity") == "hard" else "medium")
    cls["authority_agent"] = authority
    cls["verification_required"] = bool(cls.get("verification_required") or category in ("execution_ui_design", "execution_infrastructure", "execution_refactor"))
    cls["verification_policy"] = cls.get("verification_policy") or ("required" if cls["verification_required"] else "async")
    cls["reason"] = cls.get("reason") or cls.get("why")
    cls["classifier_model"] = cls.get("classifier_model") or "deterministic"
    return cls


# ---------------------------------------------------------------- model classifier
# Free-model classification with cache. Falls back to keyword regex when model
# is unavailable, slow, or returns low-confidence results.

_CLASSIFIER_CFG = {
    "model": "qwen2.5-coder:14b",
    "enabled": True,
    "timeout": 15,
    "max_total_seconds": 24,
    "ollama_url": "http://192.168.1.170:11434",
}

# LRU cache with TTL
_CLASS_CACHE: dict[str, tuple[dict, float]] = {}
_CLASS_CACHE_MAX = 256
_CLASS_CACHE_TTL = 3600


import hashlib


def _classifier_prompt(task: str) -> str:
    return (
        "You classify tasks. Return ONLY JSON with fields: "
        "category (planning|research|execution_routine|execution_ui_design|execution_refactor|execution_infrastructure|vision), "
        "complexity (routine|hard), urgency (now|queue), confidence (high|medium|low), "
        f"why (brief). Task: {task}"
    )


def _classifier_messages(task: str) -> list[dict]:
    return [
        {"role": "system", "content": (
            "You classify tasks. Return ONLY JSON with fields: "
            "category (planning|research|execution_routine|execution_ui_design|execution_refactor|execution_infrastructure|vision), "
            "complexity (routine|hard), urgency (now|queue), confidence (high|medium|low), "
            "domain, capabilities_required array, sensitivity (low|medium|high), "
            "authority_agent, verification_required boolean, why (brief reason)."
        )},
        {"role": "user", "content": task},
    ]


def _classifier_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:32]


def _parse_classifier_content(content: str, classifier_model: str) -> dict | None:
    content = (content or "").strip()
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()
    result = json.loads(content)
    known_categories = {
        "planning", "research", "execution_routine", "execution_ui_design",
        "execution_refactor", "execution_infrastructure", "vision",
    }
    if result.get("category") not in known_categories:
        return None
    if result.get("confidence") not in ("high", "medium"):
        return None
    result["why"] = f"model:{result.get('why', '')}"
    result["classifier_model"] = classifier_model
    return _complete_classification(result)


def _call_litellm_classifier(proxy_model: str, task: str, timeout: int) -> dict | None:
    payload = json.dumps({
        "model": proxy_model,
        "messages": _classifier_messages(task),
        "temperature": 0,
        "max_tokens": 512,
    }).encode()
    req = urllib.request.Request(f"{LITELLM_URL}/v1/chat/completions", data=payload,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = json.load(r)
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    return _parse_classifier_content(content, data.get("model") or proxy_model)


def _model_classify(task: str, cfg: dict | None = None) -> dict | None:
    """Call free local model for intelligent classification. Returns None on failure."""
    try:
        runtime_cfg = (cfg or load_config()).get("classifier", {})
    except Exception:
        runtime_cfg = {}
    classifier_cfg = {**_CLASSIFIER_CFG, **runtime_cfg}
    if not (classifier_cfg.get("enabled", True) and (classifier_cfg.get("timeout") or 0) > 0):
        return None
    cache_key = _classifier_hash(task)
    now = time.time()
    if cache_key in _CLASS_CACHE:
        entry, ts = _CLASS_CACHE[cache_key]
        if now - ts < _CLASS_CACHE_TTL:
            return entry
    timeout = int(classifier_cfg.get("timeout") or 15)
    max_total = int(classifier_cfg.get("max_total_seconds") or max(timeout, 1))
    deadline = now + max(max_total, 1)
    param = {"model": classifier_cfg["model"], "messages": _classifier_messages(task),
             "stream": False, "options": {"temperature": 0}}
    try:
        remaining = max(1, int(deadline - time.time()))
        req = urllib.request.Request(f"{classifier_cfg['ollama_url']}/api/chat",
                                     data=json.dumps(param).encode(),
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=min(timeout, remaining)) as r:
            d = json.load(r)
        result = _parse_classifier_content(d.get("message", {}).get("content", ""), classifier_cfg["model"])
        if result:
            if len(_CLASS_CACHE) >= _CLASS_CACHE_MAX and _CLASS_CACHE:
                _CLASS_CACHE.pop(next(iter(_CLASS_CACHE)))
            _CLASS_CACHE[cache_key] = (result, now)
            return result
    except Exception:
        pass
    available = litellm_models()
    for fallback in classifier_cfg.get("fallbacks") or []:
        remaining = int(deadline - time.time())
        if remaining <= 1:
            break
        proxy = fallback.get("proxy")
        if not proxy or proxy not in available:
            continue
        try:
            result = _call_litellm_classifier(proxy, task, max(1, min(timeout, 8, remaining)))
            if result:
                result["classifier_model"] = fallback.get("model") or proxy
                if len(_CLASS_CACHE) >= _CLASS_CACHE_MAX and _CLASS_CACHE:
                    _CLASS_CACHE.pop(next(iter(_CLASS_CACHE)))
                _CLASS_CACHE[cache_key] = (result, now)
                return result
        except Exception:
            continue
    return None


# ---------------------------------------------------------------- availability
def litellm_models() -> set:
    try:
        with urllib.request.urlopen(f"{LITELLM_URL}/v1/models", timeout=6) as r:
            return {m["id"] for m in json.load(r).get("data", [])}
    except Exception:
        return set()


def litellm_proxy_for(surface: str | None, model: str | None = None, explicit_proxy: str | None = None) -> str | None:
    if explicit_proxy:
        return explicit_proxy
    surface_key = str(surface or "").strip()
    model_key = str(model or "").strip()
    if model_key:
        return LITELLM_MODEL_PROXY_ALIASES.get((surface_key, model_key))
    return LITELLM_SURFACE_MODELS.get(surface_key)


def ollama_has(cfg: dict, tag: str) -> bool:
    """Real backend check: is this model actually installed on the Mac's Ollama right now."""
    base = cfg.get("surfaces", {}).get("ollama", {}).get("base_url", "http://localhost:11434")
    try:
        with urllib.request.urlopen(f"{base}/api/tags", timeout=5) as r:
            return tag in {m["name"] for m in json.load(r).get("models", [])}
    except Exception:
        return False


def executor_surfaces() -> set:
    """CLI surfaces the Mac executor can currently run."""
    try:
        with urllib.request.urlopen(f"{EXECUTOR_URL}/health", timeout=4) as r:
            return set(json.load(r).get("surfaces", []))
    except Exception:
        return set()


# ---------------------------------------------------------------- runtime state
def _runtime_key(ch: dict) -> tuple[str, str]:
    return str(ch.get("surface") or "unknown"), str(ch.get("model") or ch.get("agent") or "default")


def _ensure_runtime_table(con: sqlite3.Connection) -> None:
    con.execute("""CREATE TABLE IF NOT EXISTS model_runtime_state(
        surface TEXT NOT NULL,
        model TEXT NOT NULL,
        failure_count INTEGER DEFAULT 0,
        circuit_open_until REAL,
        quota_reset_at REAL,
        last_success REAL,
        last_failure REAL,
        last_error TEXT,
        PRIMARY KEY(surface, model)
    )""")


def _runtime_db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    _ensure_runtime_table(con)
    return con


def runtime_state(surface: str | None, model: str | None = None) -> dict:
    con = _runtime_db()
    row = con.execute("SELECT * FROM model_runtime_state WHERE surface=? AND model=?",
                      (str(surface or "unknown"), str(model or "default"))).fetchone()
    con.close()
    now = time.time()
    if not row:
        return {"circuit_state": "closed", "quota_blocked": False}
    circuit_open_until = row["circuit_open_until"] or 0
    quota_reset_at = row["quota_reset_at"] or _parsed_rate_limit_reset_at(row["last_error"]) or 0
    return {
        "failure_count": row["failure_count"] or 0,
        "circuit_state": "open" if circuit_open_until > now else "closed",
        "circuit_open_until": circuit_open_until or None,
        "quota_blocked": quota_reset_at > now,
        "quota_reset_at": quota_reset_at or None,
        "last_success": row["last_success"],
        "last_failure": row["last_failure"],
        "last_error": row["last_error"],
    }


def _rate_limit_message(value: object) -> str:
    return str(value or "").lower()


def _is_rate_limit_message(value: object) -> bool:
    msg = _rate_limit_message(value)
    return (
        "rate limit" in msg
        or "rate_limited" in msg
        or "too many requests" in msg
        or "quota" in msg
        or "weekly limit" in msg
        or "usage limit" in msg
        or "hit your limit" in msg
        or ("you've hit your" in msg and "limit" in msg)
    )


def _parsed_rate_limit_reset_at(value: object, now: float | None = None) -> float | None:
    match = _LIMIT_RESET_RE.search(str(value or ""))
    if not match:
        return None
    month_name, day_raw, hour_raw, minute_raw, am_pm, tz_name = match.groups()
    month = _MONTHS.get(month_name.lower())
    if not month:
        return None
    now_ts = time.time() if now is None else now
    tz = dt.datetime.fromtimestamp(now_ts).astimezone().tzinfo
    if tz_name:
        try:
            tz = ZoneInfo(tz_name)
        except ZoneInfoNotFoundError:
            pass
    current = dt.datetime.fromtimestamp(now_ts, tz)
    hour = int(hour_raw)
    minute = int(minute_raw or "0")
    if am_pm:
        marker = am_pm.lower()
        if marker == "pm" and hour != 12:
            hour += 12
        elif marker == "am" and hour == 12:
            hour = 0
    try:
        reset = dt.datetime(current.year, month, int(day_raw), hour, minute, tzinfo=tz)
    except ValueError:
        return None
    if reset.timestamp() <= now_ts:
        try:
            reset = dt.datetime(current.year + 1, month, int(day_raw), hour, minute, tzinfo=tz)
        except ValueError:
            return None
    return reset.timestamp()


def _rate_limit_reset_seconds(exc: Exception) -> int:
    if isinstance(exc, urllib.error.HTTPError):
        retry_after = exc.headers.get("Retry-After") if exc.headers else None
        if retry_after and retry_after.isdigit():
            return max(1, int(retry_after))
    parsed_at = _parsed_rate_limit_reset_at(exc)
    if parsed_at:
        return max(1, int(parsed_at - time.time()))
    return DEFAULT_RATE_LIMIT_RESET_SECONDS


def _is_rate_limit_error(exc: Exception) -> bool:
    if isinstance(exc, urllib.error.HTTPError) and exc.code == 429:
        return True
    return _is_rate_limit_message(exc)


def apply_runtime_state(candidate: dict) -> dict:
    state = runtime_state(candidate.get("surface"), candidate.get("model") or candidate.get("agent") or "default")
    enriched = dict(candidate)
    enriched["circuit_state"] = state.get("circuit_state") or enriched.get("circuit_state") or "closed"
    enriched["circuit_open_until"] = state.get("circuit_open_until")
    enriched["quota_reset_at"] = state.get("quota_reset_at")
    enriched["last_success"] = state.get("last_success")
    enriched["last_failure"] = state.get("last_failure")
    enriched["last_error"] = state.get("last_error")
    if state.get("quota_blocked"):
        enriched["quota_remaining"] = 0
    enriched["rejection_reason"] = enriched.get("rejection_reason") or get_registry().rejection_reason(enriched)
    return enriched


def record_runtime_success(ch: dict) -> None:
    surface, model = _runtime_key(ch)
    con = _runtime_db()
    con.execute("""INSERT INTO model_runtime_state(surface,model,failure_count,circuit_open_until,quota_reset_at,last_success,last_error)
        VALUES(?,?,?,?,?,?,?)
        ON CONFLICT(surface,model) DO UPDATE SET
          failure_count=0, circuit_open_until=NULL, quota_reset_at=NULL,
          last_success=excluded.last_success, last_error=NULL""",
        (surface, model, 0, None, None, time.time(), None))
    con.commit()
    con.close()


def record_runtime_failure(ch: dict, exc: Exception) -> None:
    surface, model = _runtime_key(ch)
    now = time.time()
    con = _runtime_db()
    row = con.execute("SELECT failure_count FROM model_runtime_state WHERE surface=? AND model=?",
                      (surface, model)).fetchone()
    failure_count = (row["failure_count"] if row else 0) + 1
    circuit_open_until = now + CIRCUIT_OPEN_SECONDS if failure_count >= CIRCUIT_FAILURE_THRESHOLD else None
    quota_reset_at = now + _rate_limit_reset_seconds(exc) if _is_rate_limit_error(exc) else None
    con.execute("""INSERT INTO model_runtime_state(surface,model,failure_count,circuit_open_until,quota_reset_at,last_failure,last_error)
        VALUES(?,?,?,?,?,?,?)
        ON CONFLICT(surface,model) DO UPDATE SET
          failure_count=excluded.failure_count,
          circuit_open_until=COALESCE(excluded.circuit_open_until, model_runtime_state.circuit_open_until),
          quota_reset_at=COALESCE(excluded.quota_reset_at, model_runtime_state.quota_reset_at),
          last_failure=excluded.last_failure,
          last_error=excluded.last_error""",
        (surface, model, failure_count, circuit_open_until, quota_reset_at, now, _format_error_detail(exc)))
    con.commit()
    con.close()


def apply_runtime_to_model_status(rows: list[dict]) -> list[dict]:
    out = []
    up = litellm_models()
    for row in rows:
        runtime = dict(row.get("runtime") or {})
        proxy = litellm_proxy_for(row.get("surface"), row.get("model"))
        if row.get("surface") in LITELLM_SURFACE_MODELS:
            runtime["via"] = "litellm"
            runtime["detail"] = proxy
            runtime["available"] = bool(proxy and proxy in up)
            runtime["health"] = "up" if runtime["available"] else "down"
        state = runtime_state(row.get("surface"), row.get("model"))
        if state.get("circuit_state") == "open":
            runtime["health"] = "circuit_open"
            runtime["available"] = False
        if state.get("quota_blocked"):
            runtime["health"] = "quota_exhausted"
            runtime["available"] = False
            runtime["quota_remaining"] = 0
        runtime["circuit_state"] = state.get("circuit_state") or runtime.get("circuit_state") or "closed"
        runtime["last_success"] = state.get("last_success") or runtime.get("last_success")
        runtime["last_failure"] = state.get("last_failure") or runtime.get("last_failure")
        runtime["last_error"] = state.get("last_error") or runtime.get("last_error")
        runtime["quota_reset_at"] = state.get("quota_reset_at")
        next_row = dict(row)
        next_row["runtime"] = runtime
        out.append(next_row)
    return out


# ---------------------------------------------------------------- select
def _gate_when_applies(when: str | None, cls: dict) -> bool:
    if not when:
        return True
    if when in ("hard", "highest_stakes", "high_stakes"):
        return cls["complexity"] == "hard"
    return True


_CAPABILITY_ALIASES = {
    "frontend": {"frontend", "ui_implementation", "coding"},
    "front_end": {"frontend", "ui_implementation", "coding"},
    "react": {"frontend", "ui_implementation", "coding"},
    "typescript": {"frontend", "ui_implementation", "coding"},
    "javascript": {"frontend", "ui_implementation", "coding"},
    "html": {"frontend", "ui_implementation", "design_system"},
    "css": {"frontend", "ui_implementation", "design_system"},
    "scss": {"frontend", "ui_implementation", "design_system"},
    "css_scss": {"frontend", "ui_implementation", "design_system"},
    "tailwind": {"frontend", "ui_implementation", "design_system"},
    "responsive": {"frontend", "ui_implementation", "design_system"},
    "dashboard": {"frontend", "ui_implementation", "design_system"},
    "design_system": {"design_system", "design_compliance", "ui_implementation"},
    "accessibility": {"accessibility", "design_compliance", "ui_implementation"},
    "a11y": {"accessibility", "design_compliance", "ui_implementation"},
    "wcag": {"accessibility", "design_compliance", "ui_implementation"},
    "accessibility_wcag": {"accessibility", "design_compliance", "ui_implementation"},
    "infrastructure": {"infrastructure", "repo_policy", "schemas", "coding"},
    "schemas": {"schemas", "repo_policy", "infrastructure"},
    "coding": {"coding", "refactor", "ui_implementation", "writable_workspace"},
    "reasoning": {"reasoning", "planning", "architecture", "security"},
    "planning": {"planning", "architecture", "reasoning"},
    "verification": {"verification", "design_compliance"},
    "vision": {"vision", "design_compliance"},
}

_CAPABILITY_NORMALIZATION = {
    "react": "frontend",
    "typescript": "frontend",
    "javascript": "frontend",
    "html": "frontend",
    "css": "design_system",
    "scss": "design_system",
    "css_scss": "design_system",
    "tailwind": "design_system",
    "responsive": "frontend",
    "dashboard": "design_system",
    "wcag": "accessibility",
    "a11y": "accessibility",
    "accessibility_wcag": "accessibility",
    "ui": "frontend",
    "ui_design": "design_system",
    "front_end": "frontend",
    "web_development": "frontend",
}

_DOMAIN_ALIASES = {
    "ui": {"ui", "ui_design", "frontend", "front_end", "design"},
    "ui_design": {"ui", "ui_design", "frontend", "front_end", "design"},
    "frontend": {"ui", "ui_design", "frontend", "front_end", "design"},
    "front_end": {"ui", "ui_design", "frontend", "front_end", "design"},
    "design": {"ui", "ui_design", "frontend", "front_end", "design"},
    "infra": {"infra", "infrastructure", "ops", "devops"},
    "infrastructure": {"infra", "infrastructure", "ops", "devops"},
    "code": {"code", "general"},
    "web_development": {"ui", "ui_design", "frontend", "front_end", "design", "code"},
}


def _canon(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").lower()).strip("_")


def _normalize_required_capabilities(category: str, raw_caps: list, defaults: list[str]) -> list[str]:
    """Reduce classifier vocabulary to registry capability buckets."""
    ordered: list[str] = []
    for cap in raw_caps or []:
        req = _canon(str(cap))
        if not req:
            continue
        req = _CAPABILITY_NORMALIZATION.get(req, req)
        if req not in _CAPABILITY_ALIASES:
            continue
        if req not in ordered:
            ordered.append(req)
    if not ordered:
        ordered = list(defaults)
    if category == "execution_ui_design":
        for required in ("frontend", "design_system"):
            if required not in ordered:
                ordered.append(required)
    return ordered


def _capability_supported(required: str, offered: set[str]) -> bool:
    req = _canon(required)
    if "ui" in req and "design" in req:
        req = "design_system"
    elif "front" in req or "web_development" in req:
        req = "frontend"
    elif "infra" in req or "devops" in req:
        req = "infrastructure"
    accepted = _CAPABILITY_ALIASES.get(req, {req})
    return bool(accepted & offered)


def _domain_allowed(domain: str | None, allowed: set[str]) -> bool:
    if not domain or not allowed or "general" in allowed:
        return True
    d = _canon(domain)
    if "ui" in d and "design" in d:
        d = "ui_design"
    elif "front" in d or d == "web_development":
        d = "frontend"
    elif "infra" in d or "devops" in d:
        d = "infrastructure"
    accepted = _DOMAIN_ALIASES.get(d, {d})
    return bool(accepted & allowed)


def apply_registry_policy(candidate: dict, cls: dict) -> dict:
    """Deterministic policy checks using registry metadata."""
    rec = dict(candidate)
    if rec.get("rejection_reason") or not rec.get("routable"):
        return rec
    offered = {_canon(c) for c in rec.get("capabilities") or []}
    missing = [
        cap for cap in (cls.get("capabilities_required") or [])
        if not _capability_supported(str(cap), offered)
    ]
    role = str(rec.get("role") or "")
    # Recovery and verification surfaces may be narrower than primary surfaces.
    if missing and role not in VERIFIER_ROLES and role not in ("recovery", "planning_fallback", "second_opinion"):
        rec["rejection_reason"] = "missing_capability:" + ",".join(map(str, missing[:4]))
        return rec
    allowed_domains = {_canon(d) for d in rec.get("allowed_domains") or []}
    if not _domain_allowed(cls.get("domain"), allowed_domains):
        rec["rejection_reason"] = "domain_not_allowed:" + str(cls.get("domain"))
        return rec
    if cls.get("sensitivity") in ("high", "critical", "high_stakes") and rec.get("trust_level") == "draft":
        rec["rejection_reason"] = "trust_too_low_for_sensitivity"
    return rec


def _enrich_candidate(raw: dict, cls: dict) -> dict:
    return apply_runtime_state(apply_registry_policy(get_registry().enrich_candidate(raw), cls))


def _candidate(cfg: dict, entry: dict, cls: dict, up: set, execs: set) -> dict:
    if entry.get("agent"):
        agent = entry["agent"]
        surface = AGENT_SURFACES.get(agent, f"agent:{agent}")
        gated_out = not _gate_when_applies(entry.get("when"), cls)
        available = surface in execs
        return _enrich_candidate({"agent": agent, "model": None, "surface": surface, "billing": entry.get("billing"),
                "role": entry.get("role"), "gate": entry.get("gate"), "via": "agent",
                "routable": False, "available": available, "gated_out": gated_out, "proxy": None}, cls)
    surface = entry.get("surface")
    gated_out = entry.get("when") in ("hard", "highest_stakes") and cls["complexity"] != "hard"
    if entry.get("role") == "ui_design_planning" and cls.get("domain") not in ("ui", "ui_design", "frontend", "front_end", "design"):
        gated_out = True
    via, proxy = None, None
    if surface in LITELLM_SURFACE_MODELS:
        via, proxy, routable = "litellm", litellm_proxy_for(surface, entry.get("model"), entry.get("proxy")), True
        if surface == "ollama":
            available = bool(proxy and proxy in up and ollama_has(cfg, entry.get("model")))
        else:
            available = bool(proxy and proxy in up)
    elif surface in CLI_SURFACES:
        via, routable = "executor", True
        available = EXEC_ALIAS.get(surface, surface) in execs
    else:
        routable, available = False, False
    return _enrich_candidate({"model": entry.get("model"), "surface": surface, "billing": entry.get("billing"),
            "role": entry.get("role"), "via": via, "routable": routable, "available": available,
            "gated_out": gated_out, "proxy": proxy}, cls)


def select(cfg: dict, cls: dict) -> dict:
    """Deterministic walk down the tier's ranked chain; first healthy wins."""
    tier = cls["category"]
    chain = cfg.get("tiers", {}).get(tier, [])
    up = litellm_models()
    execs = executor_surfaces()
    considered, chosen = [], None
    for entry in chain:
        rec = _candidate(cfg, entry, cls, up, execs)
        considered.append(rec)
        if chosen is None and rec["routable"] and rec["available"] and not rec["gated_out"] and not rec.get("rejection_reason"):
            chosen = rec
    sel = {"tier": tier, "chosen": chosen, "considered": considered}
    sel["rejections"] = route_rejections(sel)
    sel["why_log"] = route_why_log(cls, sel)
    sel["quota_snapshot"] = quota_snapshot(sel)
    sel["circuit_snapshot"] = circuit_snapshot(sel)
    return sel


def route_rejections(sel: dict) -> list[dict]:
    rows = []
    chosen = sel.get("chosen") or {}
    for rec in sel.get("considered", []):
        if rec is chosen:
            continue
        reason = rec.get("rejection_reason")
        if reason:
            rows.append({"surface": rec.get("surface"), "model": rec.get("model"), "reason": reason})
    return rows


def route_why_log(cls: dict, sel: dict) -> list[str]:
    chosen = sel.get("chosen") or {}
    log = [
        f"Task classified as {cls.get('target_tier') or cls.get('category')}.",
    ]
    if cls.get("reason") or cls.get("why"):
        log.append(str(cls.get("reason") or cls.get("why")))
    if cls.get("authority_agent"):
        log.append(f"{str(cls.get('authority_agent')).upper()} authority applies for {cls.get('domain') or cls.get('category')}.")
    if chosen:
        log.append(f"{chosen.get('surface')} selected for {chosen.get('role') or 'primary'} execution.")
    else:
        log.append("No eligible surface selected.")
    for rej in route_rejections(sel)[:8]:
        log.append(f"{rej['surface']} skipped: {rej['reason']}.")
    return log


def quota_snapshot(sel: dict) -> dict:
    return {
        rec.get("registry_id") or rec.get("surface"): {
            "quota": rec.get("quota") or {},
            "quota_remaining": rec.get("quota_remaining"),
        }
        for rec in sel.get("considered", [])
        if rec.get("registry_id") or rec.get("surface")
    }


def circuit_snapshot(sel: dict) -> dict:
    return {
        rec.get("registry_id") or rec.get("surface"): rec.get("circuit_state") or "closed"
        for rec in sel.get("considered", [])
        if rec.get("registry_id") or rec.get("surface")
    }


def refresh_selection_metadata(cls: dict, sel: dict) -> dict:
    sel["rejections"] = route_rejections(sel)
    sel["why_log"] = route_why_log(cls, sel)
    sel["quota_snapshot"] = quota_snapshot(sel)
    sel["circuit_snapshot"] = circuit_snapshot(sel)
    return sel


def find_verifiers(cfg: dict, cls: dict, tier: str) -> list[dict]:
    """Available subscription verifiers in configured order."""
    up, execs = litellm_models(), executor_surfaces()
    verifiers = []
    for entry in cfg.get("tiers", {}).get(tier, []):
        if entry.get("billing") != "subscription" or entry.get("role") not in VERIFIER_ROLES:
            continue
        rec = _candidate(cfg, entry, cls, up, execs)
        if rec["routable"] and rec["available"] and not rec["gated_out"]:
            verifiers.append(rec)
    return verifiers


# ---------------------------------------------------------------- execute
def execute_litellm_messages(proxy_model: str, messages: list, timeout: int = 180) -> dict:
    payload = json.dumps({"model": proxy_model, "messages": messages, "max_tokens": 512}).encode()
    req = urllib.request.Request(f"{LITELLM_URL}/v1/chat/completions", data=payload,
                                 headers={"Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as r:
        d = json.load(r)
    return {"content": d["choices"][0]["message"]["content"],
            "served_by": d.get("model"), "latency_ms": int((time.time() - t0) * 1000)}


def execute_litellm(proxy_model: str, text: str, timeout: int = 180) -> dict:
    payload = json.dumps({"model": proxy_model,
                          "messages": [{"role": "user", "content": text}],
                          "max_tokens": 512}).encode()
    req = urllib.request.Request(f"{LITELLM_URL}/v1/chat/completions", data=payload,
                                 headers={"Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=timeout) as r:
        d = json.load(r)
    return {"content": d["choices"][0]["message"]["content"],
            "served_by": d.get("model"), "latency_ms": int((time.time() - t0) * 1000)}


def execute_executor(surface: str, text: str, model: str | None,
                     cwd: str | None = None, repo: str | None = None,
                     timeout: int = 600) -> dict:
    payload_obj = {"surface": EXEC_ALIAS.get(surface, surface),
                   "prompt": text, "model": model, "timeout": timeout}
    workdir = cwd or repo
    if workdir:
        payload_obj["cwd"] = workdir
    payload = json.dumps(payload_obj).encode()
    req = urllib.request.Request(f"{EXECUTOR_URL}/run", data=payload,
                                 headers={"Content-Type": "application/json",
                                          "Authorization": f"Bearer {EXECUTOR_TOKEN}"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=max(20, timeout + 15)) as r:
        d = json.load(r)
    if d.get("error"):
        raise RuntimeError(d["error"])
    if d.get("exit_code") not in (None, 0):
        raise RuntimeError(d.get("stderr") or d.get("output") or f"executor exit_code={d.get('exit_code')}")
    return {"content": d.get("output", ""), "served_by": f"{surface} (mac executor)",
            "latency_ms": d.get("latency_ms") or int((time.time() - t0) * 1000),
            "cwd": d.get("cwd"), "executor_model": d.get("model")}


def _execute_ch(ch: dict, text: str, *, messages: list | None = None,
                  cwd: str | None = None, repo: str | None = None,
                  timeout: int = 600) -> dict:
    if ch["via"] == "litellm":
        if messages is not None:
            return execute_litellm_messages(ch["proxy"], messages, timeout=timeout)
        return execute_litellm(ch["proxy"], text, timeout=timeout)
    return execute_executor(ch["surface"], text, ch["model"], cwd=cwd, repo=repo, timeout=timeout)


def _candidate_timeout(cls: dict, ch: dict) -> int:
    """Bound each fallback attempt so one dead surface cannot block the chain."""
    category = cls.get("category")
    if category in ("planning", "research"):
        return 75
    if category == "execution_ui_design":
        if ch.get("surface") == "gemini-cli":
            role = ch.get("role")
            model = str(ch.get("model") or "")
            if role in ("design_compliance_verification", "fallback_when_available") or "preview" in model:
                return 45
            return 75
        return 150
    if category == "execution_infrastructure":
        return 240
    return 20


def _verifier_passed(content: str) -> bool:
    line = ((content or "").strip().splitlines() or [""])[0].upper()
    return line.startswith("PASS")


def _format_error_detail(exc: Exception) -> str:
    msg = str(exc).strip().replace("\n", " ")
    return (msg[:200] if msg else type(exc).__name__)


def _is_format_only_output(content: str) -> bool:
    """Stub PASS/FAIL or tiny outputs should not trigger verifier escalation."""
    text = (content or "").strip()
    if len(text) < 24:
        return True
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return True
    head = lines[0].upper()
    return head.startswith(("PASS", "FAIL")) and len(text) < 120 and len(lines) <= 4


def _record_verifier_error(attempt: dict, exc: Exception) -> None:
    attempt["status"] = "error"
    attempt["error_type"] = type(exc).__name__
    attempt["error_detail"] = _format_error_detail(exc)


def _verifier_error_fragment(attempt: dict) -> str:
    surface = attempt.get("surface") or "unknown"
    err_type = attempt.get("error_type") or "Error"
    detail = attempt.get("error_detail") or ""
    if detail and detail != err_type:
        return f"{surface}:{err_type}:{detail[:120]}"
    return f"{surface}:{err_type}"


def _verify_prompt(task: str, output: str) -> str:
    return (f"Review the task output. Reply PASS or FAIL on the first line only.\n\n"
            f"Task:\n{task}\n\nOutput:\n{output}")


def _find_agent_gate(cfg: dict, tier: str, gate: str, cls: dict) -> dict | None:
    for entry in cfg.get("tiers", {}).get(tier, []):
        if entry.get("agent") and entry.get("gate") == gate and _gate_when_applies(entry.get("when"), cls):
            return entry
    return None


def _vael_brief_prompt(task: str) -> str:
    return ("You are VAEL, design authority for FORGE/NUVUE. Produce a concise structured "
            "design brief before implementation. Cover intent, layout, typography, color/spacing, "
            "components, accessibility, and brand alignment. Brief only — no code.\n\nTask:\n" + task)


def _vael_approval_prompt(task: str, output: str) -> str:
    return ("You are VAEL, final design approval for FORGE/NUVUE. Review the task and output. "
            "Reply APPROVED or REVISION_NEEDED on the first line, then a short rationale.\n\n"
            f"Task:\n{task}\n\nOutput:\n{output}")


_VAEL_START = re.compile(r"^\s*(?:#+\s*)?(Intent|Visual Direction|Layout|Typography|Color|Components|Accessibility|Brand|APPROVED|REVISION_NEEDED)\b", re.I)
_HERMES_NOISE = re.compile(r"^\s*(?:Query:|Initializing agent\.\.\.|[╔╗╚╝═║╭╮╰╯─━┌┐└┘│┏┓┗┛┠┨┯┷┬┴┼+\- ]{3,})\s*$", re.I)


def _clean_vael_content(content: str) -> str:
    """Strip Hermes CLI wrapper noise while preserving VAEL's actual text."""
    lines = [ln for ln in (content or "").strip().splitlines() if not _HERMES_NOISE.match(ln)]
    for i, line in enumerate(lines):
        if _VAEL_START.match(line):
            lines = lines[i:]
            break
    return "\n".join(lines).strip()


def apply_vael_before(cfg: dict, cls: dict, tier: str, task: str, *,
                      cwd: str | None = None, repo: str | None = None) -> tuple[str, str | None, str | None]:
    if not _find_agent_gate(cfg, tier, "before_implementation", cls):
        return task, None, None
    if VAEL_SURFACE not in executor_surfaces():
        return task, "vael_brief_skipped:unavailable", None
    try:
        raw_brief = execute_executor(VAEL_SURFACE, _vael_brief_prompt(task), None,
                                     cwd=cwd, repo=repo, timeout=VAEL_GATE_TIMEOUT_SECONDS).get("content", "")
        brief = _clean_vael_content(raw_brief)
        if not brief:
            return task, "vael_brief_skipped:empty", None
        return f"{task}\n\n--- VAEL Design Brief ---\n{brief}", "vael_brief_applied", brief
    except Exception as e:
        return task, f"vael_brief_skipped:{type(e).__name__}", None


def apply_vael_after(cfg: dict, cls: dict, tier: str, task: str, result: dict | None, *,
                     cwd: str | None = None, repo: str | None = None) -> tuple[dict | None, str | None]:
    if not result or not _find_agent_gate(cfg, tier, "after_verification", cls):
        return result, None
    if VAEL_SURFACE not in executor_surfaces():
        return result, "vael_approval_skipped:unavailable"
    try:
        review = execute_executor(VAEL_SURFACE,
                                  _vael_approval_prompt(task, result.get("content", "")),
                                  None, cwd=cwd, repo=repo, timeout=VAEL_GATE_TIMEOUT_SECONDS)
        approval = _clean_vael_content(review.get("content") or "")
        line = ((approval.splitlines() or [""])[0]).upper()
        out = dict(result)
        out["vael_approval"] = approval
        stat = "vael_approved" if line.startswith("APPROVED") else "vael_revision_needed"
        return out, stat
    except Exception as e:
        return result, f"vael_approval_skipped:{type(e).__name__}"


def apply_verification(cfg: dict, cls: dict, sel: dict, task: str, result: dict | None, *,
                       cwd: str | None = None, repo: str | None = None,
                       messages: list | None = None) -> tuple:
    """After free-tier execution, subscription verifiers review; FAIL escalates once."""
    ch = sel.get("chosen") or {}
    if not result:
        return result, sel, None
    needs_verification = ch.get("billing") in FREE_BILLINGS or (
        sel.get("tier") == "execution_ui_design" and ch.get("role") == "primary"
    )
    if not needs_verification:
        return result, sel, None
    if not cls.get("verification_required") or cls.get("verification_policy") in ("async", "time_bounded", "pending"):
        attempts = list((result or {}).get("verification_attempts") or [])
        attempts.append({"status": "pending", "phase": "async", "detail": "routine verification deferred"})
        result["verification_attempts"] = attempts
        return result, sel, "verification_pending"
    verifiers = find_verifiers(cfg, cls, sel["tier"])
    if not verifiers:
        return result, sel, None

    attempts = list((result or {}).get("verification_attempts") or [])
    review_timeout, escalate_timeout = 90, 120
    for verifier in verifiers:
        attempt = {"surface": verifier.get("surface"), "model": verifier.get("model"), "phase": "review"}
        try:
            review = _execute_ch(verifier, _verify_prompt(task, result.get("content", "")),
                                 cwd=cwd, repo=repo, timeout=review_timeout)
        except Exception as e:
            _record_verifier_error(attempt, e)
            attempts.append(attempt)
            result["verification_attempts"] = attempts
            continue
        review_content = review.get("content") or ""
        first_line = ((review_content.strip().splitlines() or [""])[0])[:300]
        passed = _verifier_passed(review_content)
        attempt.update({"status": "passed" if passed else "failed", "first_line": first_line})
        attempts.append(attempt)
        result["verification_attempts"] = attempts
        if passed:
            return result, sel, "verified"
        primary_output = result.get("content", "")
        if _is_format_only_output(primary_output) or _is_format_only_output(review_content):
            continue
        esc_attempt = {"surface": verifier.get("surface"), "model": verifier.get("model"), "phase": "escalation"}
        try:
            escalated = _execute_ch(verifier, task, messages=messages, cwd=cwd, repo=repo,
                                    timeout=escalate_timeout)
            sel["chosen"] = verifier
            escalated["verification_attempts"] = attempts
            if result.get("vael_brief"):
                escalated["vael_brief"] = result.get("vael_brief")
            return escalated, sel, "verify_fail_escalated"
        except Exception as e:
            _record_verifier_error(esc_attempt, e)
            attempts.append(esc_attempt)
            result["verification_attempts"] = attempts
            continue
    result["verification_attempts"] = attempts
    error_attempts = [a for a in attempts if a.get("status") == "error"]
    if error_attempts:
        detail = ";".join(_verifier_error_fragment(a) for a in error_attempts[:5])
    elif any(a.get("status") == "failed" for a in attempts):
        detail = "all_verifiers_failed"
    else:
        detail = "no_successful_verifier"
    return result, sel, f"verify_skipped:{detail}"


def _result_metadata(result: dict | None) -> dict:
    """Verifier/VAEL metadata echoed in x_dispatch and CLI route metadata."""
    if not result:
        return {}
    meta = {}
    if result.get("verification_attempts"):
        meta["verification_attempts"] = result["verification_attempts"]
    brief = result.get("vael_brief")
    if brief:
        meta["vael_brief"] = brief
        meta["vael_brief_preview"] = brief[:1000]
    return meta


def verification_state(result: dict | None, status: str | None = None) -> dict:
    attempts = list((result or {}).get("verification_attempts") or [])
    if not attempts:
        state = "pending" if status and "verify" not in status and result else "verifier_unavailable"
    elif any(a.get("status") == "passed" for a in attempts):
        state = "passed"
    elif any(a.get("status") == "failed" for a in attempts):
        state = "failed"
    elif any(a.get("status") == "error" for a in attempts):
        state = "verifier_unavailable"
    elif any(a.get("status") == "pending" for a in attempts):
        state = "pending"
    else:
        state = "needs_review"
    return {"state": state, "attempts": attempts}


def mark_decision_manually_verified(decision_id, reviewer: str = "sage", note: str = "",
                                    evidence=None, db_path: str = DB_PATH) -> dict | None:
    """Mark a routing decision as passed after external/SAGE verification.

    The original routing status remains intact so the log still shows how the
    work executed. Only structured verification state is moved to passed, and
    any linked async verification job is mirrored to the same passed state.
    """
    try:
        normalized_id = int(decision_id)
    except (TypeError, ValueError):
        return None
    if normalized_id <= 0:
        return None

    con = _db(db_path)
    row = con.execute("SELECT id, verification_json FROM routing_decisions WHERE id=?",
                      (normalized_id,)).fetchone()
    if not row:
        con.close()
        return None

    try:
        existing = json.loads(row["verification_json"] or "{}")
    except Exception:
        existing = {}
    attempts = list(existing.get("attempts") or [])
    now = time.strftime("%Y-%m-%dT%H:%M:%S")
    attempts.append({
        "status": "passed",
        "phase": "manual_review",
        "source": "manual",
        "reviewer": reviewer or "sage",
        "note": note or "",
        "evidence": evidence,
        "ts": now,
    })
    result_json = {
        "state": "passed",
        "source": "manual",
        "reviewer": reviewer or "sage",
        "note": note or "",
        "evidence": evidence,
        "attempts": attempts,
    }
    encoded = json.dumps(result_json)
    con.execute("UPDATE routing_decisions SET verification_json=? WHERE id=?",
                (encoded, normalized_id))
    cur = con.execute("""UPDATE verification_jobs
        SET status=?, updated_ts=?, attempts_json=?, result_json=?, error=NULL
        WHERE routing_decision_id=?""",
        ("passed", now, json.dumps(attempts), encoded, normalized_id))
    jobs_updated = cur.rowcount if cur.rowcount is not None else 0
    con.commit()
    con.close()
    return {
        "decision_id": normalized_id,
        "verification": result_json,
        "verification_jobs_updated": jobs_updated,
    }


# ---------------------------------------------------------------- log
def _db(path: str = DB_PATH) -> sqlite3.Connection:
    con = sqlite3.connect(path)
    con.row_factory = sqlite3.Row
    con.execute("""CREATE TABLE IF NOT EXISTS routing_decisions(
        id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, task TEXT,
        category TEXT, complexity TEXT, urgency TEXT, confidence TEXT,
        chosen_surface TEXT, chosen_model TEXT, via TEXT, served_by TEXT,
        latency_ms INTEGER, status TEXT, considered TEXT)""")
    con.execute("""CREATE TABLE IF NOT EXISTS verification_jobs(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routing_decision_id INTEGER,
        ts TEXT,
        updated_ts TEXT,
        status TEXT,
        task TEXT,
        output TEXT,
        classification_json TEXT,
        selection_json TEXT,
        attempts_json TEXT,
        result_json TEXT,
        error TEXT)""")
    # self-migrate: add columns an older table may be missing
    cols = {r[1] for r in con.execute("PRAGMA table_info(routing_decisions)")}
    for col in ("via", "why_log", "rejections", "classification_json", "quota_snapshot",
                "circuit_snapshot", "verification_json"):
        if col not in cols:
            con.execute(f"ALTER TABLE routing_decisions ADD COLUMN {col} TEXT")
    con.commit()
    return con


def log_decision(con, task, cls, sel, result, status) -> int:
    ch = sel["chosen"] or {}
    con.execute("INSERT INTO routing_decisions(ts,task,category,complexity,urgency,"
                "confidence,chosen_surface,chosen_model,via,served_by,latency_ms,status,considered)"
                " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (time.strftime("%Y-%m-%dT%H:%M:%S"), task[:500], cls["category"],
                 cls["complexity"], cls["urgency"], cls["confidence"], ch.get("surface"),
                 ch.get("model"), ch.get("via"), (result or {}).get("served_by"),
                 (result or {}).get("latency_ms"), status, json.dumps(sel["considered"])))
    rowid = con.execute("SELECT last_insert_rowid()").fetchone()[0]
    con.execute("UPDATE routing_decisions SET why_log=?, rejections=?, classification_json=?, "
                "quota_snapshot=?, circuit_snapshot=?, verification_json=? WHERE id=?",
                (json.dumps(sel.get("why_log") or []), json.dumps(sel.get("rejections") or []),
                 json.dumps(cls), json.dumps(sel.get("quota_snapshot") or {}),
                 json.dumps(sel.get("circuit_snapshot") or {}),
                 json.dumps(verification_state(result, status)), rowid))
    con.commit()
    return int(rowid)


def enqueue_verification_job(con, routing_decision_id: int, task: str, cls: dict, sel: dict, result: dict | None) -> None:
    if not result or verification_state(result).get("state") != "pending":
        return
    existing = con.execute("SELECT id FROM verification_jobs WHERE routing_decision_id=?", (routing_decision_id,)).fetchone()
    if existing:
        return
    now = time.strftime("%Y-%m-%dT%H:%M:%S")
    con.execute("""INSERT INTO verification_jobs(
        routing_decision_id, ts, updated_ts, status, task, output,
        classification_json, selection_json, attempts_json)
        VALUES(?,?,?,?,?,?,?,?,?)""",
        (routing_decision_id, now, now, "queued", task[:2000], (result.get("content") or "")[:20000],
         json.dumps(cls), json.dumps(sel), json.dumps(result.get("verification_attempts") or [])))
    con.commit()


def _parse_job_ts(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return time.mktime(time.strptime(value, "%Y-%m-%dT%H:%M:%S"))
    except Exception:
        return None


def recover_stale_verification_jobs(timeout_seconds: int = VERIFICATION_JOB_TIMEOUT_SECONDS) -> int:
    """Mark verifier jobs that were left running by a worker restart as timed out."""
    con = _db()
    rows = con.execute("SELECT * FROM verification_jobs WHERE status='running'").fetchall()
    now = time.time()
    recovered = 0
    for row in rows:
        updated = _parse_job_ts(row["updated_ts"] or row["ts"])
        if updated and now - updated < timeout_seconds:
            continue
        attempts = []
        try:
            attempts = json.loads(row["attempts_json"] or "[]")
        except Exception:
            attempts = []
        attempts.append({
            "status": "timeout",
            "phase": "async",
            "error_detail": f"verification job exceeded {timeout_seconds}s while running",
        })
        result_json = {"state": "timeout", "attempts": attempts}
        con.execute("""UPDATE verification_jobs SET status=?, updated_ts=?, attempts_json=?,
            result_json=?, error=? WHERE id=?""",
            ("timeout", time.strftime("%Y-%m-%dT%H:%M:%S"), json.dumps(attempts),
             json.dumps(result_json), f"stale running verifier exceeded {timeout_seconds}s", row["id"]))
        if row["routing_decision_id"]:
            con.execute("UPDATE routing_decisions SET verification_json=? WHERE id=?",
                        (json.dumps(result_json), row["routing_decision_id"]))
        recovered += 1
    con.commit()
    con.close()
    return recovered


def recent_verification_jobs(limit: int = 50) -> list[dict]:
    recover_stale_verification_jobs()
    con = _db()
    rows = con.execute("SELECT * FROM verification_jobs ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    con.close()
    return [dict(r) for r in rows]


def process_verification_jobs_once(limit: int = 1) -> int:
    cfg = load_config()
    con = _db()
    con.close()
    recover_stale_verification_jobs()
    con = _db()
    jobs = con.execute("SELECT * FROM verification_jobs WHERE status IN ('queued','retry') ORDER BY id ASC LIMIT ?",
                       (limit,)).fetchall()
    processed = 0
    for job in jobs:
        now = time.strftime("%Y-%m-%dT%H:%M:%S")
        con.execute("UPDATE verification_jobs SET status=?, updated_ts=? WHERE id=?",
                    ("running", now, job["id"]))
        con.commit()
        try:
            cls = json.loads(job["classification_json"] or "{}")
            sel = json.loads(job["selection_json"] or "{}")
            task = job["task"] or ""
            output = job["output"] or ""
            verifiers = find_verifiers(cfg, cls, sel.get("tier") or cls.get("category") or "execution_routine")
            attempts = json.loads(job["attempts_json"] or "[]")
            if not verifiers:
                state = "verifier_unavailable"
                attempts.append({"status": "error", "phase": "async", "error_detail": "no_available_verifier"})
                result_json = {"state": state, "attempts": attempts}
            else:
                state = "failed"
                for verifier in verifiers[:2]:
                    attempt = {"surface": verifier.get("surface"), "model": verifier.get("model"), "phase": "async_review"}
                    try:
                        review = _execute_ch(verifier, _verify_prompt(task, output), timeout=45)
                        record_runtime_success(verifier)
                        review_content = review.get("content") or ""
                        attempt["first_line"] = ((review_content.strip().splitlines() or [""])[0])[:300]
                        attempt["status"] = "passed" if _verifier_passed(review_content) else "failed"
                        attempts.append(attempt)
                        if attempt["status"] == "passed":
                            state = "passed"
                            break
                    except Exception as exc:
                        record_runtime_failure(verifier, exc)
                        _record_verifier_error(attempt, exc)
                        attempts.append(attempt)
                        state = "verifier_unavailable"
                result_json = {"state": state, "attempts": attempts}
            con.execute("""UPDATE verification_jobs SET status=?, updated_ts=?, attempts_json=?,
                result_json=?, error=? WHERE id=?""",
                (state, time.strftime("%Y-%m-%dT%H:%M:%S"), json.dumps(attempts),
                 json.dumps(result_json), None, job["id"]))
            con.execute("UPDATE routing_decisions SET verification_json=? WHERE id=?",
                        (json.dumps(result_json), job["routing_decision_id"]))
            con.commit()
            processed += 1
        except Exception as exc:
            con.execute("UPDATE verification_jobs SET status=?, updated_ts=?, error=? WHERE id=?",
                        ("verifier_unavailable", time.strftime("%Y-%m-%dT%H:%M:%S"),
                         _format_error_detail(exc), job["id"]))
            con.commit()
            processed += 1
    con.close()
    return processed


# ---------------------------------------------------------------- route
def route(text: str, has_image: bool = False, dry_run: bool = False,
          cwd: str | None = None, repo: str | None = None,
          routing_intent: dict | None = None) -> dict:
    cfg = load_config()
    cls = classify(text, has_image, routing_intent=routing_intent)
    sel = select(cfg, cls)
    result, status = None, "no_available_surface"
    if cls["confidence"] == "low":
        status = "low_confidence_defer_sage"

    errors = []
    candidates = []
    if sel.get("chosen"):
        candidates.append(sel["chosen"])
    for candidate in sel.get("considered", []):
        if candidate not in candidates:
            candidates.append(candidate)

    exec_text = text
    exec_text, vael_pre, vael_brief = apply_vael_before(cfg, cls, sel.get("tier", ""), exec_text, cwd=cwd, repo=repo)

    for ch in candidates:
        if not ch or not ch.get("routable") or not ch.get("available") or ch.get("gated_out") or ch.get("rejection_reason"):
            continue
        if dry_run:
            status = "would_execute(dry_run)"
            sel["chosen"] = ch
            break
        try:
            if ch["via"] == "litellm":
                result = execute_litellm(ch["proxy"], exec_text, timeout=_candidate_timeout(cls, ch))
            else:
                result = execute_executor(ch["surface"], exec_text, ch["model"], cwd=cwd, repo=repo,
                                          timeout=_candidate_timeout(cls, ch))
            record_runtime_success(ch)
            if vael_brief:
                result["vael_brief"] = vael_brief
            status = "executed" if not errors else "executed_after_fallback:" + ";".join(errors[:8])
            if vael_pre:
                status = f"{status}_{vael_pre}"
            sel["chosen"] = ch
            result, sel, vstat = apply_verification(cfg, cls, sel, text, result, cwd=cwd, repo=repo)
            if vstat:
                status = f"{status}_{vstat}"
            result, vael_post = apply_vael_after(cfg, cls, sel.get("tier", ""), text, result,
                                                 cwd=cwd, repo=repo)
            if vael_post:
                status = f"{status}_{vael_post}"
            break
        except Exception as e:
            record_runtime_failure(ch, e)
            errors.append(f"{ch.get('surface')}:{type(e).__name__}")
            status = "exec_error_chain:" + ";".join(errors[:5])
    con = _db()
    refresh_selection_metadata(cls, sel)
    decision_id = log_decision(con, text, cls, sel, result, status)
    enqueue_verification_job(con, decision_id, text, cls, sel, result)
    metadata = _result_metadata(result) if result else {}
    metadata.update({
        "why_log": sel.get("why_log") or [],
        "rejections": sel.get("rejections") or [],
        "quota_snapshot": sel.get("quota_snapshot") or {},
        "circuit_snapshot": sel.get("circuit_snapshot") or {},
        "verification": verification_state(result, status),
    })
    return {"classification": cls, "selection": sel, "result": result, "status": status, "metadata": metadata}


def main() -> None:
    ap = argparse.ArgumentParser(description="DISPATCH router")
    ap.add_argument("task", help="task text")
    ap.add_argument("--image", action="store_true", help="task includes an image (vision tier)")
    ap.add_argument("--dry-run", action="store_true", help="classify + select only, no execution")
    ap.add_argument("--cwd", help="working directory to forward to executor-backed CLI surfaces")
    ap.add_argument("--repo", help="alias for --cwd; target repository path for executor-backed CLI surfaces")
    ap.add_argument("--json", action="store_true", help="emit raw JSON")
    a = ap.parse_args()
    out = route(a.task, a.image, a.dry_run, cwd=a.cwd, repo=a.repo)
    if a.json:
        print(json.dumps(out, indent=2))
        return
    c, s = out["classification"], out["selection"]
    print(f"CLASSIFY: {c['category']} / {c['complexity']} / urgency={c['urgency']} "
          f"/ confidence={c['confidence']}")
    print(f"TIER CHAIN ({s['tier']}):")
    avail = {True: "up", False: "down", None: "cli-pending"}
    for r in s["considered"]:
        mark = "  <== CHOSEN" if r is s["chosen"] else ""
        gate = " (gated:hard-only)" if r["gated_out"] else ""
        via = f" via {r['via']}" if r["via"] else ""
        print(f"   {r['surface']:14} {str(r['model'])[:34]:34} [{avail[r['available']]}]{via}{gate}{mark}")
    print(f"STATUS: {out['status']}")
    if out.get("metadata"):
        print(f"METADATA: {json.dumps(out['metadata'], ensure_ascii=False)[:1200]}")
    if out["result"]:
        print(f"SERVED BY: {out['result']['served_by']} ({out['result']['latency_ms']}ms)")
        print(f"OUTPUT: {out['result']['content'][:200]}")


if __name__ == "__main__":
    main()
