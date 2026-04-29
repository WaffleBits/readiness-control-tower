# Portfolio Review Notes

This project is intentionally designed as a public-safe engineering artifact for mission-focused software roles.

## What To Review

- `backend/app/analytics.py`: scoring, root-cause analysis, and what-if logic.
- `backend/tests/test_analytics.py`: focused validation of the analytics model.
- `frontend/src/App.tsx`: command dashboard workflow and operational views.
- `data/synthetic/*.csv`: synthetic model of assets, missions, maintenance, parts, personnel, and outages.
- `ARCHITECTURE.md`: system design and production-extension notes.

## What This Demonstrates

- Translating ambiguous operational problems into software workflows.
- Modeling messy cross-domain data without using sensitive information.
- Building a working backend, frontend, and deployable local environment.
- Explaining readiness degradation with evidence instead of static metrics.
- Keeping the project scoped enough to run locally while leaving a credible production roadmap.

## Target Role Signal

- Palantir: mission analytics, deployment engineering, operational decision support.
- Security teams: auditability, system outages, degraded workflows, public-safe data handling.
- AI infrastructure teams: can be extended into model-driven recommendation and simulation workflows.

