#!/usr/bin/env python3

import argparse
import json
import os
import socket
import sys
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def parse_args():
    parser = argparse.ArgumentParser(description="Delegate a task to the DISPATCH router.")
    parser.add_argument("task", nargs="?", help="Task text")
    parser.add_argument("--cwd", help="Optional working directory forwarded to executor-backed surfaces")
    parser.add_argument("--repo", help="Alias for --cwd; target repository path")
    parser.add_argument("--dry-run", action="store_true", help="Classify/select only; do not execute or enqueue verification")
    parser.add_argument("--timeout", type=int, default=int(os.getenv("DISPATCH_DELEGATE_TIMEOUT", "180")),
                        help="HTTP timeout in seconds")
    parser.add_argument("--task-type", help="Optional typed routing intent task_type, e.g. planning or implementation")
    parser.add_argument("--domain", help="Optional typed routing intent domain, e.g. code, planning, ui_design")
    parser.add_argument("--sensitivity", help="Optional typed routing intent sensitivity")
    parser.add_argument("--verification-policy", help="Optional typed routing intent verification policy")
    parser.add_argument("--json", action="store_true", help="Dump raw response")
    return parser.parse_args()


def read_stdin():
    return sys.stdin.read().strip()


def build_request(url, task, args):
    headers = {
        "Content-Type": "application/json",
    }
    payload = {
        "model": "dispatch-auto",
        "messages": [{"role": "user", "content": task}],
    }
    if args.dry_run:
        payload["dry_run"] = True
    intent = {
        key: value for key, value in {
            "task_type": args.task_type,
            "domain": args.domain,
            "sensitivity": args.sensitivity,
            "verification_policy": args.verification_policy,
        }.items()
        if value
    }
    if intent:
        payload["routing_intent"] = intent
    workdir = args.cwd or args.repo
    if workdir:
        payload["cwd"] = workdir
    data = json.dumps(payload).encode("utf-8")
    return Request(url, data=data, headers=headers)


def send_request(req, timeout):
    try:
        with urlopen(req, timeout=timeout) as response:
            if response.status != 200:
                sys.stderr.write(f"HTTP error: {response.status}\n")
                sys.exit(1)
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace") if e.fp else ""
        sys.stderr.write(f"HTTP error: {e.code} {body[:500]}\n")
        sys.exit(1)
    except URLError as e:
        sys.stderr.write(f"URL error: {e.reason}\n")
        sys.exit(1)
    except (TimeoutError, socket.timeout) as e:
        sys.stderr.write(f"Timeout after {timeout}s: {e}\n")
        sys.exit(1)


def main():
    args = parse_args()
    task = args.task or read_stdin()

    url = os.getenv("DISPATCH_URL", "http://192.168.1.178:4001/v1/chat/completions")

    req = build_request(url, task, args)
    response = send_request(req, args.timeout)

    if args.json:
        sys.stdout.write(json.dumps(response, indent=2) + "\n")
    else:
        assistant_content = response["choices"][0]["message"]["content"]
        sys.stdout.write(assistant_content + "\n")

    routing_summary = f"tier={response.get('x_dispatch', {}).get('tier')}, " \
                      f"chosen_surface={response.get('x_dispatch', {}).get('chosen_surface')}, " \
                      f"via={response.get('x_dispatch', {}).get('via')}, " \
                      f"latency_ms={response.get('x_dispatch', {}).get('latency_ms')}, " \
                      f"status={response.get('x_dispatch', {}).get('status')}"

    sys.stderr.write(routing_summary + "\n")


if __name__ == "__main__":
    main()
