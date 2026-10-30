# Active Context

## System

GALASH-UPTC web system for academic management, research, and communication.

## Implemented state

- “Iniciar sesión” uses the reusable native-button SpecularButtonDirective with configurable light/material inputs, pointer-following highlight and 250px proximity. Shared CSS draws the illuminated border and reflection; the directive itself needs no React/shadcn. The previous periodic sweep is removed. Pointer updates are frame-batched outside Angular, keyboard focus lights the button, and listeners are removed on destroy. Authenticated account controls retain their original style and auth actions are unchanged.

- Home is trying an alternate full-width centered welcome with a reusable standalone GlitchBackgroundComponent. It dynamically loads Three.js to render a shader with perspective grid, mint/violet abstract waves, RGB separation, subtle grain and occasional horizontal distortions. Text and CTA stay stable above it. Rendering targets 30 fps with capped pixel ratio, pauses offscreen/when the tab is hidden, starts moving automatically without an activation/pause button, and releases observers/listeners/GPU resources on destruction. WebGL failure retains a solid blue fallback. The centered group introduction and real seedbed/member counts remain below. The preceding photo-overlay design (90% of available height) is backed up locally for restoration if requested.

- Public `/eventos` is lazy-loaded and linked as “Eventos” from the desktop/mobile header and footer, replacing Noticias. Standalone EventsComponent and reusable EventCardComponent consume the existing published-events service, with Próximos/Anteriores/Todos filters, next-event spotlight, responsive cards, optional images and detail dialog. The agenda remains general; no seedbed association or public cancelled-event visibility is invented. Date counts refresh every minute and the timer is cleared on destruction.

- Admin menu “Eventos” embeds a standalone events editor and API service (M6). It loads real events and detail, filters the four publication states, creates drafts, updates content, and connects publish/hide/cancel actions. Dates are converted between local inputs and RFC3339. The editor uses image URLs; file upload, seedbed assignment and news management remain pending because these services/fields are not registered for M6. Read-only browser verification covered list/detail and filters; write operations remain unverified against the live service.

- The home join-section mosaic displays the supplied `assets/img1.jpeg` group photograph in its large tile and `assets/img2.jpeg` exhibition photograph in the small tile, with responsive cropping and alternative text.

- `/unete` requires a verified backend session before displaying or submitting the form. Its access screen reuses the header Google login and preserves the selected seedbed. Full name and document number are prefilled from available session data into empty, untouched fields; missing data remains editable, and changing or closing the session clears the previous account's form data. This is a frontend restriction; the M3 API contract is unchanged.

- Data integration with the backend (services listed in `servicios.md`, `Uso` column): `/` loads seedbeds and the member count (`GET /seedbeds`, `GET /members?limit=100`, `100+` when it reaches the limit) only when the dashboard is not `headerOnly`. `/semilleros` uses `GET /seedbeds` (`?id=` is the real id), `/seedbeds/{id}/space`, `/members` and `GET /projects?seedbedId=`. Its public events section now consumes `GET /events`, keeps only `publicado` even for an authenticated Admin, and identifies the list as the group agenda because M6 has no seedbed association. It supports date ordering, scrolling and details including dates, venue, organizer and valid meeting/registration links; loading/error states are independent of seedbed loading. M4 activities are no longer displayed as events. The knowledge graph and the home topics come from `seedbed.topics`. `/unete` submits `POST /registration-requests` and shows the id and the `trackingToken` only once, without storing it.

- `/administracion` (Admin only; the backend validates every call) manages registration requests and accounts. Requests: list, detail with history, and only the contract M3 transitions, with a required observation. Accounts: debounced search from the directory box against `GET /admin/members` (minimum 2 characters, includes inactive accounts), role by Firebase UID (`PUT /users/{uid}/roles`) and status (`PATCH /members/{id}/status`). `parseUserRole` reads `profesor` as `docente`. The admin demo was removed.

- `/mi-solicitud` provides request lookup through `GET /registration-requests/{id}/status` with the current applicant session. A standalone component contains the lookup and result views, uses the five M3 states, and displays available update date and authorized observation. Links are enabled from `/unete` and its receipt. Anonymous token lookup is pending because token transport is not documented; a successful lookup with an applicant-owned request remains to be verified. No fabricated history or leader phase is shown.
- Not connected yet (no UI): editing seedbeds, topics, activities, projects, proposals, reviews, news, and profile editing (M5).

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

- Las tarjetas públicas de eventos y su diálogo de detalle muestran la imagen opcional imageUrl con proporción 16:9 y sin recortar su contenido; solo se aceptan enlaces HTTP/HTTPS mediante safeEventLink.

- The home introduction is centered above a React Bits ScrollStack with 21:9 GALASH photos, page scrolling, natural container height and zero hold distance. React/ReactDOM are loaded dynamically through an Angular bridge that recovers an empty mount after template updates and unmounts on destruction. Three statistic cards and seedbed-specific SVG emblems have continuous animations. Build passes with initial-bundle budget and React CommonJS warnings.
