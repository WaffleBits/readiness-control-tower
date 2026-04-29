# Product Requirements

## Product

Readiness Control Tower helps an operations leader identify degraded mission readiness, understand root causes, and evaluate near-term interventions using synthetic operational data.

## Users

- Commander: needs a fast answer to "can we execute the mission plan?"
- Operations lead: needs the current readiness posture and blockers.
- Maintenance lead: needs asset-level blockers and repair prioritization.
- Analyst: needs a clean model for explaining degradation.

## Core Jobs

1. See fleet readiness and mission delay risk in one view.
2. Identify the top root causes behind readiness degradation.
3. Drill into specific assets and mission events.
4. Evaluate a simple what-if intervention before acting.
5. Preserve an audit-friendly explanation of recommendations.

## MVP Scope

- Synthetic datasets for assets, missions, maintenance events, parts, personnel, and outages.
- Readiness summary score.
- Asset risk ranking.
- Root-cause scoring.
- Recommendation generation.
- Timeline view.
- What-if endpoint for part expedite and system restoration scenarios.
- React dashboard with API fallback data for easy demo.

## Out Of Scope

- Real operational data.
- Authentication against a government identity provider.
- Production data warehouse deployment.
- Real-time event streaming.
- Classified, export-controlled, or proprietary integrations.

## Success Criteria

- A reviewer can run the project locally in under 10 minutes.
- The dashboard answers what is degraded, why, and what to do next.
- The backend analytics are covered by focused tests.
- The public README clearly explains the mission relevance without claiming real operational access.

