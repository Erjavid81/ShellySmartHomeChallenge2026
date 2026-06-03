#!/bin/bash
# test_mqtt_event.sh
# Simulates a Frigate person detection event on your MQTT broker.
# Use this to test Node-RED flows without needing a real camera event.
#
# Requirements: mosquitto_pub (brew install mosquitto / apt install mosquitto-clients)
# Usage: bash scripts/test_mqtt_event.sh

BROKER="192.168.1.222"
PORT="1883"
TOPIC="frigate/events"
USER="mqtt_user"
PASS="mqtt_pass"

PAYLOAD='{
  "type": "new",
  "before": null,
  "after": {
    "id": "test-event-001",
    "camera": "front_door",
    "label": "person",
    "top_score": 0.94,
    "has_snapshot": true,
    "sub_label": "famiglia",
    "attributes": {}
  }
}'

echo "Publishing test Frigate event to $BROKER:$PORT $TOPIC"
mosquitto_pub -h "$BROKER" -p "$PORT" \
  -u "$USER" -P "$PASS" \
  -t "$TOPIC" \
  -m "$PAYLOAD"
echo "Done. Check your Shelly hallway light and Telegram."
