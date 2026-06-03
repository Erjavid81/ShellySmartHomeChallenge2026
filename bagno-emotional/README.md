# 🛁 BagnoEmotional — Multi-Mood Bathroom Light with a Single Button

> **Shelly Smart Home Challenge 2026 — Category: Build the Logic**

Control your bathroom lights with **3 different behaviors from a single wall button** — all running natively on the Shelly device itself. No hub. No cloud. No Home Assistant. No Node-RED. Just a Shelly script.

---

## The Problem

My bathroom had a plain white bulb and a regular wall switch. I wanted three distinct behaviors:

- **Quick on/off** without thinking about it
- **Instant reset to a clean 3000K white** — perfect for mirror, makeup, shaving
- **A slow mood-light mode** that cycles through calming RGB colors with smooth fade transitions — great for an evening bath

Every solution I found required a hub, a cloud service, or a full home automation stack. I wanted something that works locally, survives internet outages, and fits in a wall-mounted button.

---

## The Solution

A JavaScript script loaded directly onto a **Shelly Plus RGBW PM**, paired with a **Shelly BLU Button1** mounted on the wall. The script handles all three behaviors natively — the logic lives inside the device.

### Hardware

| Device | Role |
|---|---|
| Shelly Plus RGBW PM | RGBW light controller + BLE Gateway for the button |
| Shelly BLU Button1 | Wall-mounted button (BLE) |
| RGBW bulbs / LED strip | Bathroom lights (connected to the RGBW PM output) |

### Button Behaviors

| Action | Effect |
|---|---|
| **1 click** | Toggle light on/off |
| **2 clicks** | Reset to warm white 3000K (smooth 3-second fade) |
| **Long press** | Start **Emotional mode**: slow RGB color cycling with 8-second dissolve transitions |
| **Long press again** | Stop Emotional mode, return to warm white |

---

## How It Works

The script uses the Shelly Gen2+ native JavaScript engine:

- `Shelly.addEventHandler()` listens for BLU Button1 events via BTHome/BLE
- `single_push` → `RGB.Toggle`
- `double_push` → `RGBW.Set` with pre-calculated 3000K warm white values (R:255 G:197 B:88 W:200)
- `long_push` → starts a `Timer.set()` loop that picks a random color from a 9-color palette and calls `RGB.Set` with `transition_duration: 8` for the dissolve effect
- A second long press clears the timer and returns to warm white

### Color Palette (Emotional Mode)

```
Teal · Indigo · Blue-Violet · Cornflower Blue
Medium Purple · Thistle · Dark Turquoise
Dark Slate Blue · Medium Orchid
```

---

## Installation

### Step 1 — Wire the lights to the Shelly Plus RGBW PM

Connect your RGBW bulbs or LED strip to the R / G / B / W outputs of the controller. Power the device with 12V or 24V DC depending on your lights.

### Step 2 — Pair the BLU Button1 as a BLE source

1. Open the Shelly Plus RGBW PM web interface
2. Go to **Bluetooth → BLE Gateway**
3. Enable BLE Gateway and scan for devices
4. Find your BLU Button1 and associate it
5. Note the component ID (e.g. `bthomesensor:200`)

### Step 3 — Load the script

1. Go to **Scripts** in the device web interface
2. Click **Create Script**, paste the contents of `bagno_emotional.js`
3. Edit `CFG.bluAddr` with your BLU Button1 MAC address
4. Edit `bthomesensor:200` if your component ID is different (check in Script Console)
5. Save and enable **Run on startup**

### Step 4 — Test

- Single press → light toggles
- Double press → smooth fade to warm white
- Long press → Emotional mode starts cycling colors
- Long press again → back to warm white

> **Tip:** If double press triggers before long press is detected, adjust the firmware's input timing settings in the device web UI.

---

## Configuration Reference

```javascript
let CFG = {
  rgbId: 0,                     // RGB component ID on the Shelly Plus RGBW PM
  bluAddr: "b4:35:22:fe:56:e5", // BLU Button1 MAC address — CHANGE THIS
  warmWhite: {
    r: 255, g: 197, b: 88, w: 200,  // ~3000K warm white
    bri: 100,
    transition: 3                    // seconds
  },
  emotional: {
    brightness: 80,
    transition: 8,          // seconds of dissolve between colors
    intervalMs: 8000,       // ms between color changes
    palette: [ ... ]        // 9 colors — edit freely
  }
};
```

---

## Why This Works Without Any Hub

Everything runs inside the Shelly Plus RGBW PM firmware. The script boots with the device, listens for BLE events from the button, and drives the lights directly via the internal RGB component API. No MQTT broker, no Node-RED, no Home Assistant, no internet connection needed.

This is the power of Shelly native scripting: the smart home logic lives *inside the device*.

---

## Files

| File | Description |
|---|---|
| `bagno_emotional.js` | The full script (197 lines, commented) |
| `README.md` | This file |

---

## Author

Davide — Milan, Italy
Shelly Smart Home Challenge 2026
`#ShellySmartHomeChallenge2026` `#BagnoEmotional` `#ShellyScript` `#NoHub`
