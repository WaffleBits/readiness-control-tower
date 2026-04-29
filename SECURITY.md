# Security

## Public-Safe Data

This repository uses synthetic data only. Do not add classified, proprietary, government-furnished, export-controlled, customer, production, or otherwise sensitive information.

## Supported Reporting

If you find a security issue in this demo project, open a GitHub issue with a minimal reproduction that does not include secrets or sensitive data.

## Security-Relevant Design Notes

- The current MVP does not implement production authentication.
- Synthetic CSV data is mounted read-only in Docker Compose.
- The frontend includes fallback demo data so reviewers can inspect the UI without a live backend.
- Production extensions should add OIDC, RBAC, structured audit logs, secret management, and dependency scanning.

