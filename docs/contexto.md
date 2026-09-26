# Active Context

## System

GALASH-UPTC web system for academic management, research, and communication.

## Implemented state

- Versioned OpenCode configuration in `opencode.json`.
- Shared agent rules in `AGENTS.md`.
- Selected skills managed by the repository in `.opencode/skills/`.
- Append-only technical log in `docs/bitacora.ndjson`.
- Append-only testing ledger in `docs/testing/events.ndjson`.
- Vanilla JavaScript testing dashboard in `docs/testing/dashboard/`.
- Angular application scaffold in `src/` with public dashboard, standalone login and registration synchronized through Firebase and the Auth service, Firebase email/password and Google authentication, Firebase sign-out, role model, Firebase SDK configuration loaded from the ignored local `src/environments/environment.ts`, and Tailwind-ready PostCSS configuration.
- OpenCode project configuration selects Bash as its shell, allowing the npm CLI to be used from Git Bash on Windows.
- Local Angular development proxies `/api` requests to `http://localhost:8080`, avoiding browser CORS restrictions while the backend runs locally.
- Private requirements excluded from version control.

## Conventions

- User defines scope and requirements for each task.
- Keep changes small and limited to requested scope.
- Backend validates authorization.
- Critical actions produce audit records.
- Personal data follows least privilege.
- Completed work records files and tests in the log.

## Record

- Detailed history: `docs/bitacora.ndjson`.
- This file describes current state, not history.
- Contains no private requirements, credentials, or personal data.
