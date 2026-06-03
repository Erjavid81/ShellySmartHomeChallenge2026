#!/usr/bin/env python3
"""
shelly_api_test.py
Tests connectivity and basic control of all FrigateGuard Shelly devices.
Usage: python3 scripts/shelly_api_test.py
"""

import urllib.request
import json

DEVICES = {
    "Shelly 1 Gen3 (hallway light)": {
        "ip": "192.168.1.50",
        "test_url": "/rpc/Switch.GetStatus?id=0",
        "on_url":  "/rpc/Switch.Set",
        "on_body": '{"id":0,"on":true,"toggle_after":5}'
    },
    "Shelly Plus Plug S (doorbell)": {
        "ip": "192.168.1.51",
        "test_url": "/relay/0",
        "on_url":  "/relay/0?turn=on&timer=3",
        "on_body":  None
    },
}

def get(ip, path):
    url = f"http://{ip}{path}"
    try:
        with urllib.request.urlopen(url, timeout=3) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def post(ip, path, body):
    url = f"http://{ip}{path}"
    data = body.encode() if body else b""
    req = urllib.request.Request(url, data=data,
          headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=3) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

print("=== FrigateGuard AI — Shelly Device Test ===\n")
for name, cfg in DEVICES.items():
    print(f"Testing: {name} ({cfg['ip']})")
    status = get(cfg["ip"], cfg["test_url"])
    if "error" in status:
        print(f"  ❌ Unreachable: {status['error']}")
    else:
        print(f"  ✅ Reachable — status: {json.dumps(status)[:80]}")
        ans = input(f"  Trigger test action? (y/N): ").strip().lower()
        if ans == "y":
            if cfg["on_body"]:
                r = post(cfg["ip"], cfg["on_url"], cfg["on_body"])
            else:
                r = get(cfg["ip"], cfg["on_url"])
            print(f"  → Response: {json.dumps(r)[:80]}")
    print()

print("Test complete.")
