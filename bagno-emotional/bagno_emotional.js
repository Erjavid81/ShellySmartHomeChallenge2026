/**
 * BagnoEmotional — Shelly Smart Home Challenge 2026
 * Multi-mood bathroom light control via Shelly BLU Button1
 * 
 * Hardware:
 *   - Shelly Plus RGBW PM  (Light controller + BLE Gateway)
 *   - Shelly BLU Button1   (Wall-mounted button, BLE)
 * 
 * Target Architecture: Shelly Gen2 / Gen3 (RPC API)
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
let CFG = {
  lightId: 0,                        // Native component ID (Light:0) on Shelly Plus RGBW PM
  bluAddr: "b4:35:22:fe:56:e5",      // BLU Button1 MAC address — CHANGE THIS
  bthomeSensorComponent: "bthomesensor:200", // Check your actual ID in Script Console

  // Warm white ~3000K Configuration
  warmWhite: {
    rgb: [255, 197, 88],             // Color mix
    white: 200,                      // Dedicated White Channel intensity (0-255)
    bri: 100,                        // Master brightness percentage
    transition: 3                    // Seconds
  },

  // Emotional mode settings
  emotional: {
    brightness: 80,
    white: 0,                        // Shut down pure white channel to maximize color saturation
    transition: 8,                   // Seconds of dissolve between colors
    intervalMs: 10000,               // 10s loop interval (allows 2s of color hold to prevent PWM conflicts)
    
    palette: [
      [0,   128, 128],               // Teal
      [75,  0,   130],               // Indigo
      [138, 43,  226],               // Blue-Violet
      [100, 149, 237],               // Cornflower Blue
      [147, 112, 219],               // Medium Purple
      [216, 191, 216],               // Thistle
      [0,   206, 209],               // Dark Turquoise
      [72,  61,  139],               // Dark Slate Blue
      [186, 85,  211]                // Medium Orchid
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
 * (Rewritten without do-while loop because mJS engine doesn't support it)
 */
function randomColor() {
  let p = CFG.emotional.palette;
  let idx = Math.floor(Math.random() * p.length);
  
  if (idx === lastColorIndex && p.length > 1) {
    idx = (idx + 1) % p.length;
  }
  
  lastColorIndex = idx;
  return p[idx];
}

/**
 * Native Gen2/Gen3 RPC Light Control
 */
function setLightState(on, rgb, white, brightness, transition) {
  Shelly.call("Light.Set", {
    id: CFG.lightId,
    on: on,
    rgb: rgb,
    white: white,
    brightness: brightness,
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
    console.log("[BagnoEmotional] Dissolving to:", JSON.stringify(c));
    
    setLightState(true, c, CFG.emotional.white, CFG.emotional.brightness, CFG.emotional.transition);
    emotionalTimer = Timer.set(CFG.emotional.intervalMs, false, nextColor);
  }

  nextColor();
}

/**
 * Stop Emotional mode and clear the timer safely.
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
 * Reset the light to warm white ~3000K using native RPC.
 */
function resetWarmWhite() {
  stopEmotional();
  let w = CFG.warmWhite;
  setLightState(true, w.rgb, w.white, w.bri, w.transition);
  console.log("[BagnoEmotional] Reset to warm white 3000K");
}

/**
 * Toggle the light on/off using the native Light.Toggle RPC method.
 */
function toggleLight() {
  if (emotionalActive) {
    stopEmotional();
  }
  Shelly.call("Light.Toggle", { id: CFG.lightId });
  console.log("[BagnoEmotional] Light toggled");
}

/**
 * Route actions to behaviors
 */
function handleAction(action) {
  console.log("[BagnoEmotional] Received action:", action);
  
  if (action === "single_push" || action === 1) {
    toggleLight();
  } else if (action === "double_push" || action === 2) {
    resetWarmWhite();
  } else if (action === "long_push" || action === 3) {
    if (!emotionalActive) {
      // Set an initial vibrant blue color before cycling to give instant visual feedback
      setLightState(true, [65, 105, 225], 0, CFG.emotional.brightness, 2);
      // Let the feedback transition complete briefly, then engage the timer loop
      Timer.set(1500, false, function() {
        startEmotional();
      });
    } else {
      stopEmotional();
      resetWarmWhite();
    }
  }
}

// ─── EVENT HANDLERS ───────────────────────────────────────────────────────────

// 1. BLU BUTTON1 (via Bluetooth Gateway / BTHome)
Shelly.addEventHandler(function(event) {
  if (!event || !event.info) return;

  if (event.component === CFG.bthomeSensorComponent) {
    let action = event.info.event;
    if (typeof action === "undefined" && event.info.data) {
      action = event.info.data.event; 
    }
    if (typeof action !== "undefined") {
      handleAction(action);
    }
  }
});

// 2. Physical Button connected to local SW input (Input:0)
Shelly.addEventHandler(function(event) {
  if (!event || !event.info) return;
  if (event.component !== "input:0") return;
  
  // Maps standard push events from hardwired button
  if (event.info.event) {
    handleAction(event.info.event);
  }
});

// ─── STARTUP ──────────────────────────────────────────────────────────────────
console.log("[BagnoEmotional] Script successfully initialized — Gen2 Stable Engine");
