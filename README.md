# Shelly Smart Home Challenge 2026 — Official Submissions

Welcome to my official repository for the **Shelly Smart Home Challenge 2026**. This repository acts as a central hub for two distinct home automation projects built entirely on local architecture, sub-second latency, and zero cloud dependency.

---

## 📂 Project Index

This repository is split into two specialized projects. Click the links below to access the full code, architecture diagrams, and installation guides for each challenge entry:

### 1. 🛁 [BagnoEmotional](./bagno-emotional)
*   **Category:** Build the Logic (Scripting & Logic)
*   **Core Tech:** Shelly Plus RGBW PM + Shelly BLU Button1 + Native JavaScript (mJS)
*   **Description:** Control bathroom lighting with 3 unique behaviors from a single wall button running entirely locally inside the Shelly firmware. Includes a smooth, non-blocking 8-second color-dissolve "Emotional Mode" loop optimized for Gen2/Gen3 RPC APIs.

### 2. 🎯 [FrigateGuard AI](./frigateguard-ai)
*   **Category:** Solve the Problem (Real-World Solution)
*   **Core Tech:** Frigate NVR v0.17 + Node-RED + Shelly 1 Gen3 + Shelly Plus Plug S + Shelly Plus RGBW PM
*   **Description:** Bridges local AI video analytics (facial recognition, LPR, object tracking) directly into instant physical home reactions with sub-300ms latency. Bypasses cross-VLAN firewall limitations by mapping explicit local RPC HTTP POST commands across firewalled UniFi subnets.

---

## 🛠️ Global Architecture Philosophy

Both submissions are bound together by three strict engineering choices:
1. **100% Local Execution:** No cloud dependency, ensuring maximum privacy and total resilience during internet outages.
2. **Gen2/Gen3 Uniform RPC API:** All communications standardly target the modern Shelly `Light.Set` and `Switch.Set` API frameworks via POST payloads.
3. **Advanced Networking:** Tailored to enterprise-grade home networks using isolated VLAN layouts without breaking local automation flows.

---

## 👤 Author

*   **Davide** — Brescia, Italy
