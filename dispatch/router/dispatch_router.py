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
import json
import os
import re
import sqlite3
import time
import urllib.request
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
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
}
# CLI surfaces reachable through the Mac executor. Aliases only fold legacy names.
CLI_SURFACES = {
    "claude-code", "codex", "codex-cli-gpt55", "cursor", "cursor-pinned", "antigravity",
    "hermes-kern-gpt55", "kern-hermes-gpt55", "gemini-cli",
}
EXEC_ALIAS = {"cursor-pinned": "cursor", "kern-hermes-gpt55": "hermes-kern-gpt55"}


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
_EXEC = re.compile(r"\b(write|implement|fix|refactor|add|build|code|function|bug|"
                   r"patch|script|endpoint|test|deploy|migrat)\w*\b", re.I)
_HARD = re.compile(r"\b(hard|complex|novel|architecture|security|distributed|"
                   r"concurren\w*|race condition|migration|redesign)\b", re.I)
_URGENT = re.compile(r"\b(now|urgent|asap|immediately|right away|critical)\b", re.I)


def classify(text: str, has_image: bool = False) -> dict:
    """Rules-first classification. Ambiguous -> low confidence (defer to SAGE)."""
    t = text or ""
    if has_image:
        return {"category": "vision", "complexity": "routine", "urgency": "queue",
                "confidence": "high", "why": "image present"}
    plan, ex = bool(_PLAN.search(t)), bool(_EXEC.search(t))
    research, refactor, infra = bool(_RESEARCH.search(t)), bool(_REFACTOR.search(t)), bool(_INFRA.search(t))
    if plan and not ex:
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
    return {"category": category, "complexity": complexity, "urgency": urgency,
            "confidence": confidence,
            "why": f"plan_kw={plan} research_kw={research} refactor_kw={refactor} infra_kw={infra} exec_kw={ex}"}


# ---------------------------------------------------------------- availability
def litellm_models() -> set:
    try:
        with urllib.request.urlopen(f"{LITELLM_URL}/v1/models", timeout=6) as r:
            return {m["id"] for m in json.load(r).get("data", [])}
    except Exception:
        return set()


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


# ---------------------------------------------------------------- select
def select(cfg: dict, cls: dict) -> dict:
    """Deterministic walk down the tier's ranked chain; first healthy wins."""
    tier = cls["category"]
    chain = cfg.get("tiers", {}).get(tier, [])
    up = litellm_models()
    execs = executor_surfaces()
    considered, chosen = [], None
    for entry in chain:
        surface = entry.get("surface")
        gated_out = entry.get("when") in ("hard", "highest_stakes") and cls["complexity"] != "hard"
        via, proxy = None, None
        if surface in LITELLM_SURFACE_MODELS:
            via, proxy, routable = "litellm", LITELLM_SURFACE_MODELS[surface], True
            if surface == "ollama":
                available = proxy in up and ollama_has(cfg, entry.get("model"))
            else:
                available = proxy in up
        elif surface in CLI_SURFACES:
            via, routable = "executor", True
            available = EXEC_ALIAS.get(surface, surface) in execs
        else:
            routable, available = False, False   # metered/unwired API
        rec = {"model": entry.get("model"), "surface": surface, "billing": entry.get("billing"),
               "via": via, "routable": routable, "available": available,
               "gated_out": gated_out, "proxy": proxy}
        considered.append(rec)
        if chosen is None and routable and available and not gated_out:
            chosen = rec
    return {"tier": tier, "chosen": chosen, "considered": considered}


# ---------------------------------------------------------------- execute
def execute_litellm(proxy_model: str, text: str) -> dict:
    payload = json.dumps({"model": proxy_model,
                          "messages": [{"role": "user", "content": text}],
                          "max_tokens": 512}).encode()
    req = urllib.request.Request(f"{LITELLM_URL}/v1/chat/completions", data=payload,
                                 headers={"Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=180) as r:
        d = json.load(r)
    return {"content": d["choices"][0]["message"]["content"],
            "served_by": d.get("model"), "latency_ms": int((time.time() - t0) * 1000)}


def execute_executor(surface: str, text: str, model: str | None,
                     cwd: str | None = None, repo: str | None = None) -> dict:
    payload_obj = {"surface": EXEC_ALIAS.get(surface, surface),
                   "prompt": text, "model": model, "timeout": 600}
    workdir = cwd or repo
    if workdir:
        payload_obj["cwd"] = workdir
    payload = json.dumps(payload_obj).encode()
    req = urllib.request.Request(f"{EXECUTOR_URL}/run", data=payload,
                                 headers={"Content-Type": "application/json",
                                          "Authorization": f"Bearer {EXECUTOR_TOKEN}"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.load(r)
    if d.get("error"):
        raise RuntimeError(d["error"])
    return {"content": d.get("output", ""), "served_by": f"{surface} (mac executor)",
            "latency_ms": d.get("latency_ms") or int((time.time() - t0) * 1000),
            "cwd": d.get("cwd")}


# ---------------------------------------------------------------- log
def _db(path: str = DB_PATH) -> sqlite3.Connection:
    con = sqlite3.connect(path)
    con.execute("""CREATE TABLE IF NOT EXISTS routing_decisions(
        id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, task TEXT,
        category TEXT, complexity TEXT, urgency TEXT, confidence TEXT,
        chosen_surface TEXT, chosen_model TEXT, via TEXT, served_by TEXT,
        latency_ms INTEGER, status TEXT, considered TEXT)""")
    # self-migrate: add columns an older table may be missing
    cols = {r[1] for r in con.execute("PRAGMA table_info(routing_decisions)")}
    for col in ("via",):
        if col not in cols:
            con.execute(f"ALTER TABLE routing_decisions ADD COLUMN {col} TEXT")
    con.commit()
    return con


def log_decision(con, task, cls, sel, result, status) -> None:
    ch = sel["chosen"] or {}
    con.execute("INSERT INTO routing_decisions(ts,task,category,complexity,urgency,"
                "confidence,chosen_surface,chosen_model,via,served_by,latency_ms,status,considered)"
                " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (time.strftime("%Y-%m-%dT%H:%M:%S"), task[:500], cls["category"],
                 cls["complexity"], cls["urgency"], cls["confidence"], ch.get("surface"),
                 ch.get("model"), ch.get("via"), (result or {}).get("served_by"),
                 (result or {}).get("latency_ms"), status, json.dumps(sel["considered"])))
    con.commit()


# ---------------------------------------------------------------- route
def route(text: str, has_image: bool = False, dry_run: bool = False,
          cwd: str | None = None, repo: str | None = None) -> dict:
    cfg = load_config()
    cls = classify(text, has_image)
    sel = select(cfg, cls)
    result, status = None, "no_available_surface"
    if cls["confidence"] == "low":
        status = "low_confidence_defer_sage"
    ch = sel["chosen"]
    if ch:
        if dry_run:
            status = "would_execute(dry_run)"
        else:
            try:
                if ch["via"] == "litellm":
                    result = execute_litellm(ch["proxy"], text)
                else:
                    result = execute_executor(ch["surface"], text, ch["model"], cwd=cwd, repo=repo)
                status = "executed"
            except Exception as e:
                status = f"exec_error:{type(e).__name__}"
    con = _db()
    log_decision(con, text, cls, sel, result, status)
    return {"classification": cls, "selection": sel, "result": result, "status": status}


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
    if out["result"]:
        print(f"SERVED BY: {out['result']['served_by']} ({out['result']['latency_ms']}ms)")
        print(f"OUTPUT: {out['result']['content'][:200]}")


if __name__ == "__main__":
    main()
