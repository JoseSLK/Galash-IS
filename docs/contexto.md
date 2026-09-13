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
