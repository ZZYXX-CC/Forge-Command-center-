#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

CONVEX_URL = os.environ.get("CONVEX_URL", "http://192.168.1.179:3210").rstrip("/")
BOTS = json.loads(os.environ.get("TELEGRAM_BOTS_JSON", "{}") or "{}")
ALLOWED_USER_IDS = {int(x) for x in re.split(r"[\s,]+", os.environ.get("TELEGRAM_ALLOWED_USER_IDS", "")) if x}
ALLOWED_CHAT_IDS = {int(x) for x in re.split(r"[\s,]+", os.environ.get("TELEGRAM_ALLOWED_CHAT_IDS", "")) if x}
REQUIRE_MENTION_IN_GROUPS = os.environ.get("TELEGRAM_REQUIRE_MENTION_IN_GROUPS", "1") not in {"0", "false", "False"}
POLL_TIMEOUT = int(os.environ.get("TELEGRAM_POLL_TIMEOUT_SECONDS", "25"))
POLL_INTERVAL = float(os.environ.get("TELEGRAM_POLL_INTERVAL_SECONDS", "1"))
PROCESS_BACKLOG = os.environ.get("TELEGRAM_PROCESS_BACKLOG", "0") in {"1", "true", "True"}
DB_PATH = os.environ.get("TELEGRAM_INTAKE_DB", "/opt/dispatch/telegram/telegram-intake.db")


def db() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("""CREATE TABLE IF NOT EXISTS offsets(
        bot_id TEXT PRIMARY KEY,
        offset INTEGER NOT NULL
    )""")
    con.execute("""CREATE TABLE IF NOT EXISTS processed_updates(
        bot_id TEXT NOT NULL,
        update_id INTEGER NOT NULL,
        work_id TEXT,
        processed_at INTEGER NOT NULL,
        PRIMARY KEY(bot_id, update_id)
    )""")
    con.commit()
    return con


def clean_args(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: clean_args(v) for k, v in value.items() if v is not None}
    if isinstance(value, list):
        return [clean_args(v) for v in value]
    return value


def convex_mutation(path: str, args: dict[str, Any]) -> Any:
    body = json.dumps({
        "path": path,
        "format": "convex_encoded_json",
        "args": [clean_args(args)],
    }).encode()
    req = urllib.request.Request(
        f"{CONVEX_URL}/api/mutation",
        data=body,
        headers={"Content-Type": "application/json", "Convex-Client": "forge-telegram-intake-python"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        payload = json.load(response)
    if payload.get("status") != "success":
        raise RuntimeError(payload.get("errorMessage") or payload)
    return payload.get("value")


def telegram_api(token: str, method: str, params: dict[str, Any] | None = None, timeout: int = 35) -> dict[str, Any]:
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = urllib.parse.urlencode(params or {}).encode() if params is not None else None
    req = urllib.request.Request(url, data=data, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=timeout) as response:
        payload = json.load(response)
    if not payload.get("ok"):
        raise RuntimeError(payload)
    return payload


def send_message(bot: dict[str, Any], chat_id: int, text: str) -> None:
    try:
        telegram_api(bot["token"], "sendMessage", {
            "chat_id": chat_id,
            "text": text[:3900],
            "disable_web_page_preview": "true",
        }, timeout=15)
    except Exception as exc:
        print(f"ack failed for {bot.get('id')}: {exc}", flush=True)


def offset_for(con: sqlite3.Connection, bot_id: str) -> int | None:
    row = con.execute("SELECT offset FROM offsets WHERE bot_id=?", (bot_id,)).fetchone()
    return int(row["offset"]) if row else None


def set_offset(con: sqlite3.Connection, bot_id: str, offset: int) -> None:
    con.execute("""INSERT INTO offsets(bot_id, offset) VALUES(?, ?)
        ON CONFLICT(bot_id) DO UPDATE SET offset=excluded.offset""", (bot_id, offset))
    con.commit()


def bootstrap_offset(con: sqlite3.Connection, bot: dict[str, Any]) -> None:
    if PROCESS_BACKLOG or offset_for(con, bot["id"]) is not None:
        return
    updates = telegram_api(bot["token"], "getUpdates", {"timeout": 0, "limit": 100}, timeout=15).get("result") or []
    latest = max((int(update.get("update_id", 0)) for update in updates), default=0)
    set_offset(con, bot["id"], latest + 1)
    print(f"{bot['id']}: bootstrapped offset to {latest + 1}", flush=True)


def message_from_update(update: dict[str, Any]) -> dict[str, Any] | None:
    for key in ("message", "edited_message", "channel_post", "edited_channel_post"):
        if isinstance(update.get(key), dict):
            return update[key]
    return None


def text_from_message(message: dict[str, Any]) -> str:
    return str(message.get("text") or message.get("caption") or "").strip()


def sender_allowed(message: dict[str, Any]) -> bool:
    chat = message.get("chat") or {}
    sender = message.get("from") or {}
    chat_id = int(chat.get("id") or 0)
    sender_id = int(sender.get("id") or 0)
    return chat_id in ALLOWED_CHAT_IDS or sender_id in ALLOWED_USER_IDS


def is_group(message: dict[str, Any]) -> bool:
    chat_type = str((message.get("chat") or {}).get("type") or "")
    return chat_type in {"group", "supergroup", "channel"}


def mention_required_and_missing(bot: dict[str, Any], message: dict[str, Any], text: str) -> bool:
    if not REQUIRE_MENTION_IN_GROUPS or not is_group(message):
        return False
    username = str(bot.get("username") or "").lower()
    if username and f"@{username}" in text.lower():
        return False
    reply = message.get("reply_to_message") or {}
    reply_from = reply.get("from") or {}
    return str(reply_from.get("username") or "").lower() != username


def priority_from_text(text: str) -> str:
    lower = text.lower()
    if "#critical" in lower or "urgent" in lower:
        return "critical"
    if "#high" in lower:
        return "high"
    if "#low" in lower:
        return "low"
    return "medium"


def domain_from_text(text: str, bot_id: str) -> str:
    lower = text.lower()
    if bot_id == "edge" or any(w in lower for w in ("trade", "trading", "futures", "market", "edge")):
        return "trading"
    if bot_id == "vael" or any(w in lower for w in ("ui", "ux", "design", "frontend", "component", "layout")):
        return "ui_design"
    if bot_id == "kern" or any(w in lower for w in ("deploy", "lxc", "convex", "schema", "router", "systemd", "infra")):
        return "infrastructure"
    return "code"


def owner_for(bot_id: str, domain: str) -> str:
    if bot_id in {"kern", "vael", "edge"}:
        return bot_id
    if domain == "ui_design":
        return "vael"
    if domain in {"infrastructure", "code"}:
        return "kern"
    if domain == "trading":
        return "edge"
    return "SAGE"


def make_work_item(bot: dict[str, Any], update: dict[str, Any], message: dict[str, Any], text: str) -> dict[str, Any]:
    chat = message.get("chat") or {}
    sender = message.get("from") or {}
    domain = domain_from_text(text, bot["id"])
    title = text.splitlines()[0].strip()
    title = re.sub(r"@\w+", "", title).strip() or f"Telegram request for {bot.get('name') or bot['id']}"
    if len(title) > 110:
        title = title[:107].rstrip() + "..."
    metadata = {
        "source": "telegram",
        "bot": bot["id"],
        "chat_id": chat.get("id"),
        "chat_type": chat.get("type"),
        "chat_title": chat.get("title"),
        "sender_id": sender.get("id"),
        "sender_username": sender.get("username"),
        "message_id": message.get("message_id"),
        "update_id": update.get("update_id"),
        "domain": domain,
    }
    summary = "\n".join([
        "Telegram intake request.",
        f"Bot: {bot.get('name') or bot['id']}",
        f"Domain: {domain}",
        "",
        text,
        "",
        "Metadata:",
        json.dumps(metadata, sort_keys=True),
    ])
    return {
        "title": title,
        "summary": summary,
        "status": "ready",
        "priority": priority_from_text(text),
        "orchestrator": "SAGE",
        "owner": owner_for(bot["id"], domain),
        "executor": "DISPATCH",
        "surface": "dispatch-auto",
        "verificationStatus": "not_started",
        "verificationSummary": "Created from Telegram intake; awaiting SAGE orchestration.",
    }


def process_update(con: sqlite3.Connection, bot: dict[str, Any], update: dict[str, Any]) -> None:
    update_id = int(update.get("update_id", 0))
    message = message_from_update(update)
    if not message:
        return
    text = text_from_message(message)
    chat_id = int((message.get("chat") or {}).get("id") or 0)
    if not text:
        return
    if not sender_allowed(message):
        print(f"{bot['id']}: rejected unauthorized update {update_id}", flush=True)
        return
    if mention_required_and_missing(bot, message, text):
        print(f"{bot['id']}: ignored group update {update_id} without mention/reply", flush=True)
        return
    existing = con.execute("SELECT work_id FROM processed_updates WHERE bot_id=? AND update_id=?",
                           (bot["id"], update_id)).fetchone()
    if existing:
        return
    item = make_work_item(bot, update, message, text)
    created = convex_mutation("work:createWorkItem", item)
    work_id = (created or {}).get("workId")
    con.execute("INSERT INTO processed_updates(bot_id, update_id, work_id, processed_at) VALUES(?,?,?,?)",
                (bot["id"], update_id, work_id, int(time.time() * 1000)))
    con.commit()
    send_message(bot, chat_id, f"Queued for SAGE: {work_id}\nOwner: {item['owner']}\nPriority: {item['priority']}")
    print(f"{bot['id']}: queued {work_id} from update {update_id}", flush=True)


def normalize_bots() -> list[dict[str, Any]]:
    bots = []
    for bot_id, cfg in BOTS.items():
        token = cfg.get("token")
        if not token:
            continue
        if bot_id.lower() == "bridge":
            continue
        bot = {"id": bot_id.lower(), "token": token, "name": cfg.get("name") or bot_id.upper()}
        try:
            me = telegram_api(token, "getMe", timeout=15).get("result") or {}
            bot["username"] = me.get("username")
            bot["name"] = cfg.get("name") or me.get("first_name") or bot["name"]
        except Exception as exc:
            print(f"{bot_id}: getMe failed: {exc}", flush=True)
        bots.append(bot)
    return bots


def main() -> None:
    if not BOTS:
        raise SystemExit("TELEGRAM_BOTS_JSON is required")
    if not ALLOWED_USER_IDS and not ALLOWED_CHAT_IDS:
        raise SystemExit("refusing to start without TELEGRAM_ALLOWED_USER_IDS or TELEGRAM_ALLOWED_CHAT_IDS")
    con = db()
    bots = normalize_bots()
    if not bots:
        raise SystemExit("no usable Telegram bots configured")
    for bot in bots:
        bootstrap_offset(con, bot)
    print(f"Telegram intake running for {', '.join(bot['id'] for bot in bots)}", flush=True)
    while True:
        for bot in bots:
            try:
                offset = offset_for(con, bot["id"])
                params = {"timeout": POLL_TIMEOUT, "limit": 20}
                if offset is not None:
                    params["offset"] = offset
                updates = telegram_api(bot["token"], "getUpdates", params, timeout=POLL_TIMEOUT + 10).get("result") or []
                for update in updates:
                    update_id = int(update.get("update_id", 0))
                    process_update(con, bot, update)
                    set_offset(con, bot["id"], update_id + 1)
            except (urllib.error.URLError, TimeoutError) as exc:
                print(f"{bot['id']}: Telegram poll network error: {exc}", flush=True)
            except Exception as exc:
                print(f"{bot['id']}: intake error: {exc}", flush=True)
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
