/**
 * BagnoEmotional — Shelly Smart Home Challenge 2026
 * Multi-mood bathroom light control via Shelly BLU Button1
 *
 * Hardware:
 *   - Shelly Plus RGBW PM  (light controller + BLE Gateway)
 *   - Shelly BLU Button1   (wall-mounted button, BLE)
 *
 * Button behaviors:
 *   1 click     → toggle light on/off
 *   2 clicks    → reset to warm white ~3000K
 *   long press  → start Emotional mode (slow RGB color cycling)
 *   long press  → (while active) stop Emotional, return to warm white
 *
 * Load this script on the Shelly Plus RGBW PM.
 * Enable "Run on startup" so it persists after reboot.
 *
 * IMPORTANT: Change CFG.bluAddr to your BLU Button1 MAC address.
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
let CFG = {
  rgbId: 0,                          // RGB component ID on the Shelly Plus RGBW PM
  bluAddr: "b4:35:22:fe:56:e5",      // BLU Button1 MAC address — CHANGE THIS
  bthomeSensorComponent: "bthomesensor:200", // Check your actual ID in Script Console

  // Warm white ~3000K
  warmWhite: {
    r: 255, g: 197, b: 88, w: 200,
    bri: 100,
    transition: 3                    // seconds
  },

  // Emotional mode settings
  emotional: {
    brightness: 80,
    transition: 8,                   // seconds of dissolve between colors
    intervalMs: 8000,                // milliseconds between color changes
    // Calming color palette — feel free to customize
    palette: [
      [0,   128, 128],               // teal
      [75,  0,   130],               // indigo
      [138, 43,  226],               // blue-violet
      [100, 149, 237],               // cornflower blue
      [147, 112, 219],               // medium purple
      [216, 191, 216],               // thistle
      [0,   206, 209],               // dark turquoise
      [72,  61,  139],               // dark slate blue
      [186, 85,  211]                // medium orchid
    ]
  }
};

// ─── STATE ────────────────────────────────────────────────────────────────────
let emotionalActive = false;
let emotionalTimer = null;
let lastColorIndex = -1;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Pick a random color from the palette, avoiding immediate repetition.
 */
function randomColor() {
  let p = CFG.emotional.palette;
  let idx;
  do {
    idx = Math.floor(Math.random() * p.length);
  } while (idx === lastColorIndex && p.length > 1);
  lastColorIndex = idx;
  return p[idx];
}

/**
 * Send an RGB color to the light with a smooth transition.
 */
function setRgbColor(rgb, brightness, transition) {
  Shelly.call("RGB.Set", {
    id:  CFG.rgbId,
    on:  true,
    red:   rgb[0],
    green: rgb[1],
    blue:  rgb[2],
    brightness:          brightness,
    transition_duration: transition
  });
}

/**
 * Start Emotional mode: loop through random colors with dissolve transitions.
 */
function startEmotional() {
  emotionalActive = true;
  lastColorIndex = -1;
  console.log("[BagnoEmotional] Emotional mode ON");

  function nextColor() {
    if (!emotionalActive) return;
    let c = randomColor();
    console.log("[BagnoEmotional] Color:", JSON.stringify(c));
    setRgbColor(c, CFG.emotional.brightness, CFG.emotional.transition);
    emotionalTimer = Timer.set(CFG.emotional.intervalMs, false, nextColor);
  }

  nextColor();
}

/**
 * Stop Emotional mode and clear the timer.
 */
function stopEmotional() {
  if (!emotionalActive) return;
  emotionalActive = false;
  if (emotionalTimer !== null) {
    Timer.clear(emotionalTimer);
    emotionalTimer = null;
  }
  console.log("[BagnoEmotional] Emotional mode OFF");
}

/**
 * Reset the light to warm white ~3000K.
 * Tries RGBW.Set first (with white channel), falls back to RGB.Set.
 */
function resetWarmWhite() {
  stopEmotional();
  let w = CFG.warmWhite;
  Shelly.call("RGBW.Set", {
    id: CFG.rgbId, on: true,
    red: w.r, green: w.g, blue: w.b, white: w.w,
    brightness: w.bri,
    transition_duration: w.transition
  }, function(res, err) {
    if (err) {
      // Fallback for devices without a separate white channel
      Shelly.call("RGB.Set", {
        id: CFG.rgbId, on: true,
        red: w.r, green: w.g, blue: w.b,
        brightness: w.bri,
        transition_duration: w.transition
      });
    }
  });
  console.log("[BagnoEmotional] Reset to warm white 3000K");
}

/**
 * Toggle the light on/off. If turning off, also stop Emotional mode.
 */
function toggleLight() {
  // Stop emotional if running before toggling
  if (emotionalActive) {
    stopEmotional();
  }
  Shelly.call("RGB.Toggle", { id: CFG.rgbId }, function(res, err) {
    if (err) {
      Shelly.call("RGBW.Toggle", { id: CFG.rgbId });
    }
  });
  console.log("[BagnoEmotional] Light toggled");
}

/**
 * Handle a button action (single / double / long press).
 */
function handleAction(action) {
  if (action === "single_push" || action === 1) {
    toggleLight();

  } else if (action === "double_push" || action === 2) {
    resetWarmWhite();

  } else if (action === "long_push" || action === 3) {
    if (!emotionalActive) {
      // Turn on and immediately start emotional mode
      Shelly.call("RGB.Set", {
        id: CFG.rgbId, on: true,
        red: 65, green: 105, blue: 225,
        brightness: CFG.emotional.brightness,
        transition_duration: 2
      }, function() {
        startEmotional();
      });
    } else {
      stopEmotional();
      resetWarmWhite();
    }
  }
}

// ─── EVENT HANDLER: BLU BUTTON1 (via BLE / BTHome) ───────────────────────────
Shelly.addEventHandler(function(event) {
  if (!event || !event.info) return;

  // Match BTHome sensor component
  if (event.component === CFG.bthomeSensorComponent) {
    let action = event.info.event;
    if (typeof action === "undefined" && event.info.data) {
      action = event.info.data.event;  // alternative payload format
    }
    if (typeof action !== "undefined") {
      handleAction(action);
    }
  }
});

// ─── EVENT HANDLER: Physical button on the Shelly device (input:0) ───────────
// Useful if you also have a hardwired wall switch connected to the device input.
Shelly.addEventHandler(function(event) {
  if (!event || !event.info) return;
  if (event.component !== "input:0") return;
  handleAction(event.info.event);
});

// ─── STARTUP LOG ──────────────────────────────────────────────────────────────
console.log("[BagnoEmotional] Script started — v1.0 | Shelly Challenge 2026");
console.log("[BagnoEmotional] 1 click = toggle | 2 clicks = warm white | long press = Emotional");
