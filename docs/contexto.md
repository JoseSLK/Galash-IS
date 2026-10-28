# Active Context

## System

GALASH-UPTC web system for academic management, research, and communication.

## Implemented state

- Data integration with the backend (services listed in `servicios.md`, `Uso` column): `/` loads seedbeds and the member count (`GET /seedbeds`, `GET /members?limit=100`, `100+` when it reaches the limit) only when the dashboard is not `headerOnly`. `/semilleros` uses `GET /seedbeds` (`?id=` is the real id), `/seedbeds/{id}/space`, `/members`, `/activities` (the events section) and `GET /projects?seedbedId=`. The knowledge graph and the home topics come from `seedbed.topics`. `/unete` submits `POST /registration-requests` and shows the id and the `trackingToken` only once, without storing it.

- `/administracion` (Admin only; the backend validates every call) manages registration requests and accounts. Requests: list, detail with history, and only the contract M3 transitions, with a required observation. Accounts: debounced search from the directory box against `GET /admin/members` (minimum 2 characters, includes inactive accounts), role by Firebase UID (`PUT /users/{uid}/roles`) and status (`PATCH /members/{id}/status`). `parseUserRole` reads `profesor` as `docente`. The admin demo was removed.

- Not connected yet (no UI): status lookup of a request, editing seedbeds, topics, activities, projects, proposals, reviews and M6 events, and profile editing (M5).

- Versioned OpenCode configuration in `opencode.json`.
- Shared agent rules in `AGENTS.md`.
- Selected skills managed by the repository in `.opencode/skills/`.
- Append-only technical log in `docs/bitacora.ndjson`.
- Append-only testing ledger in `docs/testing/events.ndjson`.
- Vanilla JavaScript testing dashboard in `docs/testing/dashboard/`.
- Angular application scaffold in `src/` with a public dashboard, Google-only access from the header dropdown, Firebase ID-token authentication with the Go Auth API, HttpOnly backend-cookie session restoration and logout, a left-slide registration drawer shown when the API requires registration, API base URL configuration with the local `/api` proxy, Firebase SDK configuration loaded from the ignored local `src/environments/environment.ts`, and Tailwind-ready PostCSS configuration.
- OpenCode project configuration selects Bash as its shell, allowing the npm CLI to be used from Git Bash on Windows.
- Local Angular development proxies `/api` requests to `http://localhost:8080`, avoiding browser CORS restrictions while the backend runs locally.
- Public home now uses the GALASH full-screen responsive composition with a replaceable background-image token, diagonal panel navigation, access actions, and decorative vertical brand treatment.
- Google access is initiated from the header dropdown; an API `403` opens the registration drawer, and new users receive a backend session only after `/auth/register` succeeds.
- Public home composition now separates the dark full-bleed background layer from a replaceable tilted photo inset, uses the inverted left triangle, the upper-right translucent band, and an SVG outline G; it remains image-ready when the supplied asset is added.
- Public navigation header is fixed flush to the top, expands to 64px while scrolling upward and compacts to 44px while scrolling downward with a smooth 650ms resize; header actions are borderless and unfilled.
- The public home now loads the supplied group photograph from `src/assets/fondo.png` through the shared `--galash-home-image` token.
- Public home now contains three responsive screens: hero carousel, join CTA with mosaic and member counter, and seedbed tabs loaded from the backend with footer.
- Hero now uses a reusable accessible three-slide carousel with synchronized 6-second progress, pause-on-hover/focus/visibility/intersection controls, keyboard and touch navigation; the join and seedbed screens contain no robot assets.
- Test tooling: Vitest unit tests (`npm test`), Playwright e2e with axe accessibility scans (`npm run test:e2e`), Lighthouse CI performance budgets (`npm run test:perf`), and GitHub Actions workflow `.github/workflows/tests.yml` running build and all suites on pull requests and pushes to `main`.
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
