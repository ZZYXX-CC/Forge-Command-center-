#!/usr/bin/env python3
"""Watch Claude Code executor surface and alert once when session limit clears."""
from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path

HOME = Path('/Users/ichris')
PROFILE = Path('/Users/ichris/.hermes/profiles/kern')
STATE_PATH = PROFILE / 'state' / 'claude_code_surface_watch.json'
TOKEN_PATH = HOME / '.dispatch-executor' / 'token'
EXECUTOR_URL = 'http://127.0.0.1:4100/run'

STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
try:
    state = json.loads(STATE_PATH.read_text())
except Exception:
    state = {'alerted_available': False, 'last_status': None, 'last_checked': None}

try:
    token = TOKEN_PATH.read_text().strip()
    payload = {
        'surface': 'claude-code',
        'model': 'sonnet',
        'prompt': 'Reply exactly CLAUDE_STATUS_OK.',
        'timeout': 45,
    }
    req = urllib.request.Request(
        EXECUTOR_URL,
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'},
    )
    with urllib.request.urlopen(req, timeout=70) as r:
        result = json.load(r)
except Exception as e:
    state.update({'last_status': 'check_failed', 'last_error': str(e), 'last_checked': int(time.time())})
    STATE_PATH.write_text(json.dumps(state, indent=2))
    raise SystemExit(0)

text = ((result.get('output') or '') + '\n' + (result.get('stderr') or '') + '\n' + (result.get('error') or '')).lower()
available = result.get('exit_code') == 0 and 'claude_status_ok' in text
limited = 'session limit' in text or 'resets' in text

state.update({
    'last_checked': int(time.time()),
    'last_exit_code': result.get('exit_code'),
    'last_latency_ms': result.get('latency_ms'),
    'last_output_preview': (result.get('output') or '')[:180],
    'last_status': 'available' if available else ('session_limited' if limited else 'unavailable'),
})

if available and not state.get('alerted_available'):
    state['alerted_available'] = True
    STATE_PATH.write_text(json.dumps(state, indent=2))
    print('KERN ALERT — Claude Code')
    print('Status: Claude Code executor surface is back online.')
    print('Severity: low')
    print('Context: DISPATCH Mac executor returned CLAUDE_STATUS_OK from claude-code.')
    print('Suggested action: Re-enable Claude Code as a primary subscription executor for planning/high-context code tasks.')
    raise SystemExit(0)

if limited:
    # Reset alert flag while limited so the next recovery emits exactly one alert.
    state['alerted_available'] = False

STATE_PATH.write_text(json.dumps(state, indent=2))
