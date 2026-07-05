#!/usr/bin/env python3

import argparse
import json
import os
import sys
import time
from urllib.error import URLError
from urllib.request import Request, urlopen

def get_env_or_default(env_var, default):
    return os.getenv(env_var, default)

def check_endpoint(url, timeout=4.0):
    start_time = time.time()
    try:
        with urlopen(Request(url), timeout=timeout) as response:
            end_time = time.time()
            latency_ms = int((end_time - start_time) * 1000)
            return 'UP', latency_ms
    except Exception as e:
        end_time = time.time()
        latency_ms = int((end_time - start_time) * 1000)
        return 'DOWN', latency_ms

def check_litemllm():
    url = f"http://{SVC}:4000/health/liveliness"
    status, latency_ms = check_endpoint(url)
    return "LiteLLM", status, latency_ms

def check_dispatch():
    url = f"http://{SVC}:4001/health"
    status, latency_ms = check_endpoint(url)
    if status == 'UP':
        try:
            response = urlopen(Request(url), timeout=4.0).read()
            data = json.loads(response.decode('utf-8'))
            if data.get('status') == 'ok':
                return "DISPATCH", status, latency_ms
        except Exception as e:
            pass
    return "DISPATCH", 'DOWN', latency_ms

def check_executor():
    url = f"http://{EXEC}:4100/health"
    status, latency_ms = check_endpoint(url)
    surfaces = []
    if status == 'UP':
        try:
            response = urlopen(Request(url), timeout=4.0).read()
            data = json.loads(response.decode('utf-8'))
            surfaces = ', '.join(data.get('surfaces', []))
        except Exception as e:
            pass
    return "Executor", status, latency_ms, surfaces

def get_decisions():
    url = f"http://{SVC}:4001/decisions"
    try:
        response = urlopen(Request(url), timeout=4.0).read()
        data = json.loads(response.decode('utf-8'))
        # /decisions returns {"decisions": [...]} in the live service. Keep the
        # legacy key as a fallback so older deployments still report correctly.
        rows = data.get('decisions')
        if rows is None:
            rows = data.get('logged_decisions', [])
        return len(rows or [])
    except Exception as e:
        return 0

def main():
    global SVC, EXEC
    parser = argparse.ArgumentParser(description="Dispatch Status Checker")
    parser.add_argument('--svc', default=get_env_or_default('DISPATCH_SVC', '192.168.1.178'))
    parser.add_argument('--exec', default=get_env_or_default('EXECUTOR_HOST', '192.168.1.170'))
    args = parser.parse_args()
    SVC = args.svc
    EXEC = args.exec

    services = [
        check_litemllm(),
        check_dispatch(),
        check_executor()
    ]

    print(f"{'Service':<10} {'Status':<5} {'Latency (ms)':<12} {'Surfaces':<20}")
    for name, status, latency_ms, *surfaces in services:
        if surfaces:
            print(f"{name:<10} {status:<5} {latency_ms:<12} {surfaces[0]:<20}")
        else:
            print(f"{name:<10} {status:<5} {latency_ms:<12}")

    litemllm_status, dispatch_status = services[0][1], services[1][1]
    if litemllm_status == 'UP' and dispatch_status == 'UP':
        decisions_count = get_decisions()
        print(f"Logged Decisions: {decisions_count}")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
