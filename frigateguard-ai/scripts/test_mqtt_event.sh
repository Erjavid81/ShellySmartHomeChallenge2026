#!/bin/bash
# test_mqtt_event.sh
# Simulates Frigate NVR v0.17 detection events on your MQTT broker.
# Use this to test Node-RED flows and Shelly actions instantly.
#
# Requirements: mosquitto_pub (apt install mosquitto-clients / brew install mosquitto)
# Usage: bash scripts/test_mqtt_event.sh

BROKER="192.168.1.222"
PORT="1883"
TOPIC="frigate/events"
USER="mqtt_user"
PASS="mqtt_pass"

echo "=== FrigateGuard AI — MQTT Event Simulator (v0.17) ==="
echo "Select the scenario you want to simulate:"
echo "1) Scenario 1 — Recognized Family Member (Hallway Light)"
echo "2) Scenario 2 — Unknown Visitor (Doorbell Plug)"
echo "3) Scenario 3 — Unrecognized Vehicle (Red Warning Light)"
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo "Simulating: Recognized Family Member..."
    PAYLOAD='{
      "type": "update",
      "before": null,
      "after": {
        "id": "event-face-17",
        "camera": "front_door",
        "label": "person",
        "top_score": 0.95,
        "has_snapshot": true,
        "sub_label": "Davide",
        "attributes": [
          {"box": [10,20,30,40], "label": "face", "score": 0.94}
        ]
      }
    }'
    ;;
  2)
    echo "Simulating: Unknown Visitor..."
    PAYLOAD='{
      "type": "update",
      "before": null,
      "after": {
        "id": "event-unknown-17",
        "camera": "front_door",
        "label": "person",
        "top_score": 0.88,
        "has_snapshot": true,
        "sub_label": null,
        "attributes": []
      }
    }'
    ;;
  3)
    echo "Simulating: Unrecognized Vehicle (LPR)..."
    PAYLOAD='{
      "type": "update",
      "before": null,
      "after": {
        "id": "event-lpr-17",
        "camera": "driveway",
        "label": "car",
        "top_score": 0.91,
        "has_snapshot": true,
        "sub_label": "XY999ZZ",
        "attributes": [
          {"box": [50,60,70,80], "label": "license_plate", "score": 0.96}
        ]
      }
    }'
    ;;
  *)
    echo "❌ Invalid choice. Exiting."
    exit 1
    ;;
esac

echo "Publishing event to MQTT broker ($BROKER:$PORT)..."
mosquitto_pub -h "$BROKER" -p "$PORT" \
  -u "$USER" -P "$PASS" \
  -t "$TOPIC" \
  -m "$PAYLOAD"

echo "✅ Done. Verify your Shelly response and Telegram logs."

