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
- Public home now uses the GALASH full-screen responsive composition with a replaceable background-image token, diagonal panel navigation, access actions, and decorative vertical brand treatment.
- Login now uses the previous GALASH split-screen composition with diagonal panel, welcome area, vertical brand, email/password form, Google access, and registration link.
- Public home composition now separates the dark full-bleed background layer from a replaceable tilted photo inset, uses the inverted left triangle, the upper-right translucent band, and an SVG outline G; it remains image-ready when the supplied asset is added.
- The public home now loads the supplied group photograph from `src/assets/fondo.png` through the shared `--galash-home-image` token.
- Public home now contains three responsive screens: hero carousel, join CTA with editable mosaic, and editable seedbed tabs with footer; seedbed and mosaic copy lives in `dashboard-content.ts`.
- Hero now uses a reusable accessible three-slide carousel with synchronized 6-second progress, pause-on-hover/focus/visibility/intersection controls, keyboard and touch navigation; the join and seedbed screens contain no robot assets.
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
