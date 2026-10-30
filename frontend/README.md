# 🌌 ExoVerse — Frontend & 3D Visualization

> **An AI-Powered 3D Exoplanet Explorer**  
> *CBIT Hacktoberfest '26 — Team 6 (Qubix)*  
> **Role: Person 1 — Frontend & 3D Visualization (Shresta Kancharla)**

---

## 🚀 Overview

**ExoVerse** is an interactive 3D web application designed for exploring, comparing, and analyzing exoplanets discovered by NASA observational missions (Kepler, TESS, Spitzer). The application integrates a real-time Three.js solar system environment, scientific comparative charts, mathematical Earth Similarity Index (ESI) formulations, and an AI-driven astronomical assistant.

---

## 🛠️ Technology Stack

* **Framework:** React 19 + Vite
* **3D Engine:** Three.js + React Three Fiber (`@react-three/fiber`)
* **3D Helpers:** `@react-three/drei` (OrbitControls, Stars, 3D HTML Billboards)
* **Data Visualization:** Recharts
* **Styling:** Tailwind CSS + Custom Space Theme CSS (Glassmorphism, Dark Palette)
* **HTTP Client:** Axios
* **Icons:** Lucide React

---

## 🪐 Key Features & Pages

### 1. Home / Overview Dashboard
* Deep-space observatory aesthetic with real-time catalogue counters.
* Hero 3D planet stage showcasing featured exoplanets.
* Observation log table with real-time search filtering.

### 2. Interactive 3D Planet Explorer (`ExplorerPage.jsx`)
* **Multi-Planet Solar System:** Luminous central host star radiating light, orbital guide rings, and exoplanets positioned across 3D space.
* **Procedural Shaders & Textures:**
  * *Banded Gas Giants (Jovian):* Zonal jet streams, turbulence, and Great Storm vortices (with planetary rings).
  * *Terrestrial / Habitable Worlds:* Oceans, continents, mountain ridges, polar ice, and a dual-layer sphere with independent rotating 3D clouds.
  * *Lava Worlds:* Obsidian basalt crust with glowing molten magma fissures powered by 3D emissive maps.
  * *Ice Worlds:* Glacial sheets, frost blooms, and crystalline crevasses.
  * *Desert Worlds:* Iron-oxide sands, dunes, and canyons.
* **Direct 3D Interaction:** Click any planet in 3D space to lock-on with double holographic neon targeting rings and floating 3D labels.
* **Cinematic Camera Glide:** Smoothly tracks and frames focused planets at an optimal viewing distance, then grants 100% free mouse zoom and orbit controls.
* **Camera Reset:** Floating button smoothly glides the camera back to the wide system overview.
* **Scale Disclaimer:** Clear notifications that sizes and appearances are illustrative, while values are scientifically accurate.

### 3. Scientific Details Panel (`PlanetDetailsPanel.jsx`)
Standardized to official NASA Exoplanet Archive parameters:
* **Planet Name & Host Star**
* **Radius:** Earth radii ($R_\oplus$)
* **Mass:** Earth masses ($M_\oplus$) *(Gracefully labeled `'Unmeasured'` when data is unconfirmed)*
* **Distance:** Parsecs ($pc$) from Earth
* **Orbital Period:** Earth days
* **Equilibrium Temperature:** Kelvin ($K$)
* **Discovery Year:** Confirmed observation record
* **Habitability Triad:** Strictly categorized as `Conservative`, `Optimistic`, or `Hostile`.
* **Quick Action:** One-click *"Compare with Earth"* button.

### 4. Cross-System Compare Page (`ComparePage.jsx`)
* Dual searchable dropdowns for Planet A and Planet B with instant "SWAP" button.
* Preloaded **Earth (*Sol d*) baseline** to contrast exoplanets directly with our home world.
* Automated difference highlight pills (radius ratio, temperature delta, mass ratio).
* Interactive **Recharts** comparing physical dimensions and thermal environments.

### 5. Planet Insights & Habitability Page (`InsightsPage.jsx`)
* **Earth Similarity Index (ESI) Engine:** Computes similarity (0.00 to 1.00) using Planetary Habitability Laboratory (PHL) formulations.
* **Honest Partial-Score Flags:** When parameters are missing (e.g. mass), flags the score as partial without inventing data.
* **Recharts Population Distribution:** Charts showing catalog breakdown by habitability zone and planetary classification.
* **Mandatory Scientific Notice:** Prominent statement clarifying that habitability indicators describe orbital mechanics, not proof of extraterrestrial life.

### 6. AI Astronomer Chat (`AstronomerPage.jsx`)
* Conversational interface connected to FastAPI `POST /api/chat` running Featherless AI (`Qwen/Qwen2.5-7B-Instruct`).
* Active study subject context selector (allows targeting specific exoplanets or general astronomy).
* Dynamic prompt suggestion chips tailored to the active planet.
* Resilient offline fallback generator guaranteeing the app never crashes if the backend server is unreachable.

---

## 💻 Installation & Execution

### Prerequisites
* Node.js (v18.0.0 or higher recommended)
* npm (v9.0.0 or higher)

### 1. Navigate to the Frontend Directory
```bash
cd /Users/ksreddy14janicioud.com/Desktop/HFT26-TEAM-6/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `frontend/` directory (or use default fallback):
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 🔗 Backend API Contract Integration

Configured in `src/services/api.js`:
* `GET /api/planets` — Fetches catalogue exoplanets.
* `GET /api/planets/:id` — Fetches specific planet data.
* `POST /api/compare` — Cross-examines two planet IDs.
* `POST /api/chat` — AI Astronomer completion (`{ question, planet_names, planet_data, context }`).

---

## 📜 Scientific Disclaimers
* All planetary measurements are derived from the NASA Exoplanet Archive and Kepler/TESS mission discoveries.
* 3D rendering scales and procedural textures are artistic representations designed for educational visualization and are not exact scale models.
* Habitability indicators estimate physical orbital conditions; no alien life has been confirmed on any exoplanet.
