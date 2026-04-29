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

## Technical Scope

- Mission and deployment engineering: mission analytics, operational decision support, and user-facing workflows under uncertainty.
- Security teams: auditability, system outages, degraded workflows, public-safe data handling, and access-control extension points.
- AI infrastructure teams: can be extended into model-driven recommendation, simulation, and evaluation workflows.

## Gaps Worth Closing Next

- Add role-based access control around operational views.
- Add OpenTelemetry traces and structured service logs.
- Add a durable store such as Postgres or DuckDB behind the synthetic CSV model.
- Add runbooks that explain degraded-data, stale-feed, and failed-recommendation scenarios.
