#!/usr/bin/env python3

import argparse
import json
import os
import sys
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def parse_args():
    parser = argparse.ArgumentParser(description="Delegate a task to the DISPATCH router.")
    parser.add_argument("task", nargs="?", help="Task text")
    parser.add_argument("--cwd", help="Optional working directory forwarded to executor-backed surfaces")
    parser.add_argument("--repo", help="Alias for --cwd; target repository path")
    parser.add_argument("--json", action="store_true", help="Dump raw response")
    return parser.parse_args()


def read_stdin():
    return sys.stdin.read().strip()


def build_request(url, task, cwd=None, repo=None):
    headers = {
        "Content-Type": "application/json",
    }
    payload = {
        "model": "dispatch-auto",
        "messages": [{"role": "user", "content": task}],
    }
    workdir = cwd or repo
    if workdir:
        payload["cwd"] = workdir
    data = json.dumps(payload).encode("utf-8")
    return Request(url, data=data, headers=headers)


def send_request(req):
    try:
        with urlopen(req) as response:
            if response.status != 200:
                sys.stderr.write(f"HTTP error: {response.status}\n")
                sys.exit(1)
            return json.loads(response.read().decode("utf-8"))
    except URLError as e:
        sys.stderr.write(f"URL error: {e.reason}\n")
        sys.exit(1)


def main():
    args = parse_args()
    task = args.task or read_stdin()

    url = os.getenv("DISPATCH_URL", "http://192.168.1.178:4001/v1/chat/completions")

    req = build_request(url, task, cwd=args.cwd, repo=args.repo)
    response = send_request(req)

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
