# 🎯 FrigateGuard AI — Physical Smart Alerts from AI Camera Detection

> **Shelly Smart Home Challenge 2026 — Category: Solve the Problem**

Bridge the gap between AI video analytics and your physical home. **FrigateGuard AI** turns Frigate NVR detection events — recognized faces, unknown visitors, license plates — into immediate physical actions via Shelly devices, locally and in real time.

---

## The Problem

Modern AI-powered cameras are surprisingly good: they can recognize a family member's face, read a license plate, or distinguish a person from a shadow. But the response is always the same — a push notification on a screen you might not be looking at.

I wanted the house itself to react:

- When my daughter gets home from school, the hallway light turns on automatically
- When an unknown person approaches the front door, an audible alert triggers
- When an unrecognized car parks outside, a visual warning light activates

The missing piece was a bridge between Frigate's AI events and Shelly's physical outputs — fast, local, no cloud dependency.

---

## The Solution

FrigateGuard AI connects **Frigate NVR** (AI-based video analytics running in Docker) to **Shelly devices** via MQTT and Node-RED. Detection events published by Frigate are routed in real time to the appropriate Shelly action — all on the local network, sub-second latency.

No cloud. No internet dependency. No third-party services.

### Architecture

```
Cameras (RTSP)
     │
     ▼
┌──────────────┐     MQTT events      ┌────────────────┐    HTTP/RPC    ┌─────────────────┐
│  Frigate NVR │ ──────────────────▶ │   Node-RED     │ ────────────▶ │  Shelly devices  │
│  (Docker)    │  frigate/events      │  (flow logic)  │               │  (local network) │
└──────────────┘                      └────────────────┘               └─────────────────┘
                                              │
                                              ▼
                                     Telegram notifications
                                     + HA dashboard logging
```

### Hardware

| Device | Role |
|---|---|
| Shelly 1 Gen3 | Hallway light relay — turns on when a known face is recognized |
| Shelly Plus Plug S | Smart plug powering the doorbell — activates for unknown visitors |
| Shelly Dimmer (0-10V) | External warning light — activates for unrecognized license plates |
| Shelly BLU Button1 | Manual override and system test |

### Detection Scenarios

**Scenario 1 — Recognized family member**
> Frigate detects a known face (confidence > 0.90) → Node-RED calls Shelly 1 Gen3 API → hallway light turns on for 5 minutes → Telegram push with snapshot: "Welcome home!"

**Scenario 2 — Unknown visitor at the door**
> Frigate detects a person, face unknown → Node-RED activates Shelly Plus Plug S (doorbell) → Telegram notification with snapshot + inline buttons "Open door" / "Ignore"

**Scenario 3 — Unrecognized vehicle (LPR)**
> Frigate reads a plate not in the whitelist → Node-RED activates warning light (red mode via Shelly Dimmer) → Event logged to Home Assistant dashboard with image

---

## Tech Stack

| Component | Detail |
|---|---|
| **Host** | Mac Mini M4, 16GB RAM — Docker for all services |
| **Frigate NVR** | v0.17, face recognition + LPR + person detection |
| **Cameras** | Ubiquiti G5 Turret Ultra (4K), IMOU PTZ — RTSP via go2rtc |
| **MQTT** | Mosquitto 2.0, local broker |
| **Node-RED** | v3.1, flows exported in this repo |
| **Shelly devices** | Shelly 1 Gen3, Shelly Plus Plug S, Shelly BLU Button1 |
| **Network** | Unifi UDM Pro, dedicated camera VLAN (VLAN 20) |
| **Notifications** | Telegram Bot API |
| **Dashboard** | Home Assistant with Lovelace |

---

## Installation

### Prerequisites

- Docker and Docker Compose
- Frigate NVR configured with at least one RTSP camera
- Mosquitto MQTT broker running
- Shelly devices on the same local network
- Node-RED (Docker container recommended)

### Step 1 — Frigate MQTT configuration

Add to your Frigate `config.yml`:

```yaml
mqtt:
  enabled: true
  host: 192.168.1.222   # your MQTT broker IP
  port: 1883
  topic_prefix: frigate

cameras:
  front_door:
    ffmpeg:
      inputs:
        - path: rtsp://user:pass@192.168.1.10:554/stream1
          roles: [detect]
    detect:
      enabled: true
      width: 1920
      height: 1080
    objects:
      track: [person, car]
    face_recognition:
      enabled: true
      min_area: 5000
```

### Step 2 — Import Node-RED flows

1. Open Node-RED (`http://your-host:1880`)
2. Menu → Import → paste content of `flows/frigateguard_main.json`
3. Edit the Shelly device IPs in the HTTP Request nodes
4. Edit your Telegram bot token and chat ID
5. Deploy

### Step 3 — Shelly device configuration

| Device | Config |
|---|---|
| Shelly 1 Gen3 (hallway light) | Relay mode, static IP, timer 5 min |
| Shelly Plus Plug S (doorbell) | On/off via HTTP API, static IP |
| Shelly Dimmer (warning light) | 0-10V mode, static IP |

### Step 4 — Test

Use the included test script to simulate a Frigate event:

```bash
bash scripts/test_mqtt_event.sh
```

This publishes a mock `frigate/events` payload to your broker. You should see the corresponding Shelly device activate within ~800ms.

---

## API Calls (Shelly RPC)

**Turn on hallway light for 5 minutes:**
```
POST http://192.168.1.50/rpc/Switch.Set
Body: {"id":0,"on":true,"toggle_after":300}
```

**Activate doorbell plug:**
```
GET http://192.168.1.51/relay/0?turn=on&timer=5
```

**Set warning light red:**
```
POST http://192.168.1.52/rpc/Light.Set
Body: {"id":0,"on":true,"brightness":80}
```

---

## Performance

| Metric | Value |
|---|---|
| Latency: detection → Shelly action | < 800ms |
| Face recognition accuracy | ~94% (good lighting) |
| False positives (person detection) | < 3% (detection zones configured) |
| System uptime (30 days) | 99.6% |
| Extra power consumption | ~8W (Mac Mini idle + Docker) |

---

## Network Security

- Cameras on a dedicated VLAN (VLAN 20) — no direct internet access
- Shelly devices on a separate IoT VLAN (VLAN 30)
- Node-RED has controlled access to both VLANs via Unifi firewall rules
- Frigate exposed externally only via Cloudflare Tunnel with authentication
- MQTT secured with username/password, no external exposure

---

## Files

```
frigateguard-ai/
  README.md
  flows/
    frigateguard_main.json       Node-RED main flow
    frigateguard_telegram.json   Telegram notification flow
  config/
    frigate_sample.yml           Frigate config example
    mosquitto.conf               MQTT broker config
  scripts/
    test_mqtt_event.sh           Simulate a Frigate event for testing
    shelly_api_test.py           Test Shelly device connectivity
```

---

## Author

Davide — Brescia, Italy
Shelly Smart Home Challenge 2026
`#ShellySmartHomeChallenge2026` `#FrigateGuardAI` `#ShellyIoT` `#AIHomeSecurity`
