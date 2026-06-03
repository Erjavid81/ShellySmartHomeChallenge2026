#!/usr/bin/env python3
"""
shelly_api_test.py
Tests connectivity and basic control of all FrigateGuard Shelly devices.
Usage: python3 scripts/shelly_api_test.py
"""

import urllib.request
import json

# All Gen2/Gen3 devices share the same uniform RPC HTTP endpoints
DEVICES = {
    "Shelly 1 Gen3 (hallway light)": {
        "ip": "192.168.1.50",
        "test_url": "/rpc/Switch.GetStatus?id=0",
        "on_url":  "/rpc/Switch.Set",
        "on_body": '{"id":0,"on":true,"toggle_after":5}'
    },
    "Shelly Plus Plug S (doorbell)": {
        "ip": "192.168.1.51",
        "test_url": "/rpc/Switch.GetStatus?id=0",
        "on_url":  "/rpc/Switch.Set",
        "on_body": '{"id":0,"on":true,"toggle_after":3}'
    },
    "Shelly Plus RGBW PM (warning light)": {
        "ip": "192.168.1.52",
        "test_url": "/rpc/Light.GetStatus?id=0",
        "on_url":  "/rpc/Light.Set",
        "on_body": '{"id":0,"on":true,"rgb":,"white":0,"brightness":80,"toggle_after":4}'
    }
}

def post_rpc(ip, path, body_str):
    url = f"http://{ip}{path}"
    data = body_str.encode("utf-8")
    req = urllib.request.Request(
        url, 
        data=data,
        headers={"Content-Type": "application/json"}, 
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=3) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        return {"error": str(e)}

print("=== FrigateGuard AI — Shelly Device Test ===")
print("Standardized for Gen2/Gen3 RPC Local Architecture\n")

for name, cfg in DEVICES.items():
    print(f"Testing: {name} ({cfg['ip']})")
    
    # Check device reachability using RPC Status method
    status = post_rpc(cfg["ip"], cfg["test_url"], "{}")
    
    if "error" in status:
        print(f"  ❌ Unreachable or Error: {status['error']}")
    else:
        print(f"  ✅ Reachable — status: {json.dumps(status)[:80]}...")
        ans = input(f"  Trigger test action? (y/N): ").strip().lower()
        if ans == "y":
            r = post_rpc(cfg["ip"], cfg["on_url"], cfg["on_body"])
            print(f"  → Response: {json.dumps(r)[:80]}...")
    print()

print("Test complete.")

