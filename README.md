# Readiness Control Tower

[![CI](https://github.com/WaffleBits/readiness-control-tower/actions/workflows/ci.yml/badge.svg)](https://github.com/WaffleBits/readiness-control-tower/actions/workflows/ci.yml)

Readiness Control Tower is a public-safe mission operations demo that turns messy operational data into a commander-facing readiness picture. It uses only synthetic data and is designed to show end-to-end product judgment: data modeling, API design, root-cause analysis, frontend workflow, and deployable local infrastructure.

## Why This Exists

Mission teams often do not need another static dashboard. They need to know why readiness is degrading, what is blocking execution, and which action has the best operational return. This repo models that workflow with synthetic sortie, maintenance, parts, personnel, and system outage data.

The project is intentionally relevant to roles that combine engineering with operational problem solving, including forward deployed engineering, security engineering, mission analytics, and government deployment work.

## What It Does

- Ingests synthetic operational data from CSV files.
- Scores fleet and mission readiness.
- Explains root causes behind delays and degraded assets.
- Produces action recommendations with evidence.
- Exposes a FastAPI backend for readiness, timeline, root-cause, and what-if endpoints.
- Provides a React/TypeScript command dashboard for operational scanning.
- Runs locally through Docker Compose.

## Reviewer Fast Path

- Start with `backend/app/analytics.py` for the readiness model.
- Check `backend/tests/test_analytics.py` for behavior-focused tests.
- Open `frontend/src/App.tsx` for the command dashboard workflow.
- Read `docs/PORTFOLIO_REVIEW.md` for the role-specific signal.

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
├── data/synthetic/       # Public-safe synthetic readiness datasets
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

## Public-Safe Data Statement

All datasets are synthetic and created for demonstration purposes. This repository does not include operational, classified, export-controlled, proprietary, or government-furnished information.

## Interview Signal

This repo is meant to communicate the ability to:

- Translate ambiguous operations into a usable software workflow.
- Build across backend, frontend, data, and deployment surfaces.
- Explain technical decisions in a mission-first way.
- Keep public portfolio work clear of sensitive information.

See `SECURITY.md` before adding data or integrations.

