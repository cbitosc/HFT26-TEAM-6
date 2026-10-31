# AETHER — Where Curiosity Meets the Cosmos

**An AI-powered 3D exoplanet exploration platform**

AETHER is an interactive exoplanet exploration platform that brings distant worlds closer through immersive 3D visualization, scientific data, planetary comparisons, and AI-powered astronomical insights.

Built for **CBIT Hacktoberfest '26** by Team Qubix.

---

## Project Overview

Thousands of exoplanets have been discovered beyond our Solar System. However, exploring their properties and understanding their potential habitability can be challenging.

AETHER provides an interactive environment where users can explore exoplanets, examine their physical and orbital characteristics, compare different worlds, and obtain AI-generated scientific explanations.

The platform integrates data from the NASA Exoplanet Archive and presents it through an interactive 3D interface.

## Key Features

### 1. Interactive 3D Exoplanet Explorer
- Explore exoplanets through immersive 3D visualizations.
- Interact with planetary representations.
- Browse and search the available exoplanet catalogue.
- View important planetary and stellar properties.

### 2. Scientific Habitability Analysis
- Examine planetary radius, mass, orbital distance, and equilibrium temperature.
- Explore the relationship between stellar properties and planetary orbits.
- Classify planetary orbits using Conservative and Optimistic Habitable Zone boundaries.
- Present habitability as a scientific screening concept, not proof of life.

### 3. Planet Comparison
- Select two exoplanets for side-by-side comparison.
- Examine differences in physical, orbital, and stellar properties.

### 4. AI Astronomer
- Ask questions about selected exoplanets.
- Receive AI-generated explanations based on the selected planet's data.
- Explore astronomical concepts through an interactive chat interface.

### 5. Scientific Report Generation
- Generate customized scientific reports for exoplanets.
- Export reports in PDF and DOCX formats.
- Generate ZIP packages containing report exports.

### 6. Data-Driven Exploration
- Retrieve exoplanet records from the NASA Exoplanet Archive.
- Browse the catalogue using search and pagination.
- Present available scientific measurements in an accessible interface.

## Scientific Approach

### Habitable Zone Analysis

The Habitable Zone (HZ) is the region around a star where conditions could allow liquid water to exist on the surface of a suitable planet, assuming an appropriate atmosphere.

AETHER uses stellar properties and orbital distance to estimate the incident stellar flux and classify orbital positions.

The analysis distinguishes:

- **Conservative Habitable Zone:** Uses the Runaway Greenhouse inner boundary and Maximum Greenhouse outer boundary.
- **Optimistic Habitable Zone:** Uses the Recent Venus inner boundary and Early Mars outer boundary.
- **Optimistic-only:** The region within the optimistic boundaries but outside the conservative boundaries.

Habitable Zone classification is an estimate based on scientific models. It does not establish the presence of liquid water, a suitable atmosphere, or life.

### Planetary Similarity

Planetary characteristics such as radius, mass, and temperature help evaluate similarities with Earth and identify interesting candidates for further study.

A similarity assessment should not be interpreted as confirmation of habitability or extraterrestrial life.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| 3D Visualization | Three.js, React Three Fiber, Drei |
| UI and Charts | Tailwind CSS, Lucide React, Recharts |
| API Communication | Axios |
| Backend | Python, FastAPI |
| AI Integration | OpenAI-compatible client, Featherless AI |
| Scientific Data | NASA Exoplanet Archive |
| Report Export | JSZip and browser-based document generation |

## System Architecture

```text
                 AETHER FRONTEND
                 React + Vite
                       |
          +------------+------------+
          |            |            |
      3D Explorer   Comparison   AI Astronomer
          |            |            |
          +------------+------------+
                       |
                 FastAPI Backend
                       |
          +------------+------------+
          |            |            |
      NASA Data    AI Service   Planet Analysis
          |            |            |
          |       Featherless AI    |
          |                         |
          +-------------------------+
                       |
             NASA Exoplanet Archive
```

## Project Structure

```text
HFT26-TEAM-6/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── three/
│   ├── package.json
│   └── index.html
│
└── README.md
```

## Installation and Setup

### Prerequisites

- Python 3.10 or later
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/padmini-19/HFT26-TEAM-6.git
cd HFT26-TEAM-6
```

### 2. Backend Setup

Create and activate a virtual environment:

**Windows PowerShell**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory:

```env
FEATHERLESS_API_KEY=your_api_key_here
```

Replace the placeholder with your own API key. Never commit API keys or secret credentials.

Start the backend from the project root:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend
```

Backend API:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Frontend application:

```text
http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend status |
| GET | `/api/planets` | Retrieve exoplanets with pagination |
| GET | `/api/planets?search=name` | Search exoplanets |
| GET | `/api/planets/{planet_id}` | Retrieve individual planet details |
| POST | `/api/compare` | Compare two exoplanets |
| POST | `/api/chat` | Ask the AI Astronomer |

## Data Source

AETHER uses publicly available astronomical data from the **NASA Exoplanet Archive**.

Data source: https://exoplanetarchive.ipac.caltech.edu/

The archive provides information about confirmed exoplanets and their host stars, including orbital and physical parameters where available.

## Team Information

**Team Name:** Qubix  
**Team Number:** TEAM-6  
**Event:** CBIT Hacktoberfest '26  
**Institution:** Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad

### Team Members

| # | Name | Role |
|---|---|---|
| 1 | N Padmini Priya | Team Leader |
| 2 | Sirivalli Ravula | Team Member |
| 3 | Shresta Kancharla | Team Member |

## Hackathon Submission

This project is submitted as part of CBIT Hacktoberfest '26.

**Pull Request Checklist**

- [x] Solution overview and approach
- [x] Architecture and technology stack
- [x] Local setup and installation instructions
- [ ] Demo video / live deployment URL
- [ ] Application screenshots

## Future Scope

- Additional scientific models for planetary characterization.
- More detailed planetary atmosphere and stellar analysis.
- Expanded visualization and exploration capabilities.
- Additional scientific data sources and research integrations.

---

**AETHER — Where Curiosity Meets the Cosmos**

*Exploring distant worlds, one discovery at a time.*