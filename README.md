# Readiness Control Tower

[![CI](https://github.com/WaffleBits/readiness-control-tower/actions/workflows/ci.yml/badge.svg)](https://github.com/WaffleBits/readiness-control-tower/actions/workflows/ci.yml)

**Live demo: [wafflebits.github.io/readiness-control-tower](https://wafflebits.github.io/readiness-control-tower/)** (static build with bundled synthetic data and an in-browser what-if model; the full FastAPI backend runs via docker compose below)

Readiness Control Tower is a mission operations demo that turns messy operational data into a commander-facing readiness picture. It uses only synthetic data and shows the full path from data modeling and API design to root-cause analysis and a decision-focused frontend.

Mission teams rarely need another static dashboard. They need to know why readiness is degrading, what is blocking execution, and which action has the best operational return. This repo models that workflow with synthetic sortie, maintenance, parts, personnel, and system outage data.

## What It Does

- Ingests synthetic operational data from CSV files.
- Scores fleet and mission readiness.
- Explains root causes behind delays and degraded assets.
- Produces action recommendations with evidence.
- Exposes a FastAPI backend for readiness, timeline, root-cause, and what-if endpoints.
- Provides a React/TypeScript command dashboard for operational scanning.
- Runs locally through Docker Compose.

## Where to look

- `backend/app/analytics.py`: the readiness model and root-cause scoring.
- `backend/tests/test_analytics.py`: behavior-focused tests.
- `frontend/src/App.tsx`: the command dashboard workflow.

## Tech Stack

- Backend: Python, FastAPI, standard-library analytics
- Frontend: React, TypeScript, Vite
- Data: synthetic CSV datasets with a warehouse-friendly schema
- Infra: Docker Compose
- Tests: Python `unittest`

## Repository Layout

```text
.
├── backend/              # FastAPI service and analytics engine
├── frontend/             # React/TypeScript dashboard
├── data/synthetic/       # Synthetic readiness datasets
├── ARCHITECTURE.md       # System design notes
├── PRD.md                # Product requirements and user workflows
└── TODO.md               # Roadmap for production-grade extensions
```

## Run Locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### Docker

```bash
docker compose up --build
```

## API Examples

```bash
curl http://localhost:8000/api/readiness
curl http://localhost:8000/api/root-causes
curl -X POST http://localhost:8000/api/what-if \
  -H "Content-Type: application/json" \
  -d "{\"expedite_parts_days\": 2, \"restore_systems\": [\"maintenance-scheduler\"]}"
```


## Engineering Notes

This repo covers:

- Translate ambiguous operations into a usable software workflow.
- Build across backend, frontend, data, and deployment surfaces.
- Explain technical decisions in a mission-first way.
- Keep public portfolio work clear of sensitive information.

See `SECURITY.md` before adding data or integrations.

