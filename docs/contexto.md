# Active Context

## System

GALASH-UPTC web system for academic management, research, and communication.

## Implemented state

- Public `/nosotros` uses eight standalone OnPush components: page, viewport-fitted constellation hero with compact acrostic and contained transparent original emblem, progressive grey-to-white mission/vision carousel, separate objectives, continuous right-to-left gallery of staggered portrait cards with rounded corners, overlaid captions and pause control, transparent original logo with four non-overlapping disciplines, campus location with embedded map and Instagram/Facebook/CvLAC/GrupLAC icons below the official location link, and visual collaboration form. Distinct animated SVG icons accompany mission/vision, objectives and knowledge areas (static under reduced motion). Campus address comes from typed mock location data verified against official UPTC directory. A separate values section awaits user clarification. Numbered subtitles, hero CTA/description/footer, sticky index and reading bar are removed. Constellation draws above the background, with 100 desktop/45 mobile points and continuous movement; fades into the following section. Mission/vision changes after word highlighting finishes, pauses offscreen/hidden and holds selection on keyboard focus. Institutional content remains a delayed typed mock with loading/error/empty states. Backend content, valid official destinations and real collaboration delivery remain pending; no API contract changed.

- Shared KnowledgeGraphComponent now advances satellite force targets around the central node on a 36-second orbital cycle. Labels remain upright and choose their side from current node positions. Reading/focusing or dragging a node stops orbital advancement. Offscreen/hidden graph simulation stops as before. Per the latest user instruction, orbital motion starts automatically without activation controls, independently of OS reduced-motion preference; existing drag, tooltips and semillero transitions are preserved.

- HU-SEM-08 has an explicitly labeled local review demo, authorized before backend integration: example cards in a continuous three-column wall (up/down/up), with contextual pause, edge fades and automatic motion without activation controls, as explicitly requested by the user, and an authenticated text composer below projects capture author/date and submit as pending. Administration includes Reseñas, a reactive pending badge, all/status filters and accept/publish, hide or reject actions. The shared in-memory store lasts across SPA navigation within the tab and resets on reload. Demo UI does not call review endpoints, services.md is unchanged, and no API schema is invented. Real public listing, persistence, moderation and notification remain pending backend contract/handoff.

- “Iniciar sesión” uses the reusable native-button SpecularButtonDirective with configurable light/material inputs, pointer-following highlight and 250px proximity. Shared CSS draws the illuminated border and reflection; the directive itself needs no React/shadcn. The previous periodic sweep is removed. Pointer updates are frame-batched outside Angular, keyboard focus lights the button, and listeners are removed on destroy. Authenticated account controls retain their original style and auth actions are unchanged.

- Home is trying an alternate full-width centered welcome with a reusable standalone GlitchBackgroundComponent. It dynamically loads Three.js to render a shader with perspective grid, abstract waves colored from CSS tokens (Glaucous/link blue via cssColor), RGB separation, subtle grain and occasional horizontal distortions. Text and CTA stay stable above it. Rendering targets 30 fps with capped pixel ratio, pauses offscreen/when the tab is hidden, starts moving automatically without an activation/pause button, and releases observers/listeners/GPU resources on destruction. WebGL failure retains a solid blue fallback. The centered group introduction and real seedbed/member counts remain below. The preceding photo-overlay design (90% of available height) is backed up locally for restoration if requested.

- Public `/eventos` is lazy-loaded and linked as “Eventos” from the desktop/mobile header and footer, replacing Noticias. Standalone EventsComponent and reusable EventCardComponent consume the existing published-events service, with Próximos/Anteriores/Todos filters, next-event spotlight, responsive cards, optional images and detail dialog. The agenda remains general; no seedbed association or public cancelled-event visibility is invented. Date counts refresh every minute and the timer is cleared on destruction.

- Admin menu “Eventos” embeds a standalone events editor and API service (M6). It loads real events and detail, filters the four publication states, creates drafts, updates content, and connects publish/hide/cancel actions. Dates are converted between local inputs and RFC3339. The editor uses image URLs; file upload, seedbed assignment and news management remain pending because these services/fields are not registered for M6. Read-only browser verification covered list/detail and filters; write operations remain unverified against the live service.

- The home join-section mosaic displays the supplied `assets/img1.jpeg` group photograph in its large tile and `assets/img2.jpeg` exhibition photograph in the small tile, with responsive cropping and alternative text.

- `/unete` requires a verified backend session before displaying or submitting the form. Its access screen reuses the header Google login and preserves the selected seedbed. Step 1 shows name, document, phone and birth date read-only from `GET /users/me`; only the student code (prefilled, optional), birth place and address are editable. An account missing document, phone or birth date cannot continue until it completes them in the registration drawer (repeats `POST /auth/register`). Changing or closing the session clears the previous account's form data. The admin request detail still shows the personal data returned by M3.

- Data integration with the backend (services listed in `servicios.md`, `Uso` column): `/` loads seedbeds and the member count (`GET /seedbeds`, `GET /members?limit=100`, `100+` when it reaches the limit) only when the dashboard is not `headerOnly`. `/semilleros` uses `GET /seedbeds` (`?id=` is the real id), `/seedbeds/{id}/space`, `/members` and `GET /projects?seedbedId=`. Its public events section now consumes `GET /events`, keeps only `publicado` even for an authenticated Admin, and identifies the list as the group agenda because M6 has no seedbed association. It supports date ordering, scrolling and details including dates, venue, organizer and valid meeting/registration links; loading/error states are independent of seedbed loading. M4 activities are no longer displayed as events. The knowledge graph and the home topics come from `seedbed.topics`. `/unete` sends only `cod` plus the academic fields to `POST /registration-requests` (personal data comes from the account) and shows the id and the `trackingToken` only once, without storing it.

- `/administracion` (Admin only; the backend validates every call) manages registration requests and accounts. Requests: list, detail with history, and only the contract M3 transitions, with a required observation. Accounts: debounced search from the directory box against `GET /admin/members` (minimum 2 characters, includes inactive accounts), role by Firebase UID (`PUT /users/{uid}/roles`) and status (`PATCH /members/{id}/status`). `parseUserRole` reads `profesor` as `docente`. The admin demo was removed.

- `/mi-solicitud` provides request lookup through `GET /registration-requests/{id}/status` with the current applicant session. A standalone component contains the lookup and result views, uses the five M3 states, and displays available update date and authorized observation. Links are enabled from `/unete` and its receipt. Anonymous token lookup is pending because token transport is not documented; a successful lookup with an applicant-owned request remains to be verified. No fabricated history or leader phase is shown.
- Not connected yet (no UI): editing seedbeds, topics, activities, projects, proposals, news, and profile editing (M5).

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
- Google access is initiated from the header dropdown; an API `403` opens the registration drawer, and new users receive a backend session only after `/auth/register` succeeds. The drawer asks for birth date and phone (required) and student code (optional); `409` means the document or code belongs to another account. With a session open, the same drawer updates the basic data and closing it keeps the session.
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

- Shared public navigation now shows the transparent GALASH emblem next to the brand text. Gallery CSS movement runs continuously, including reduced-motion preference at the user’s explicit request; only its pause button stops it. Cards retain alternating heights in every mode and never expose a horizontal scrollbar. Duplicate groups provide a seamless loop and are hidden from assistive technology.

- Nosotros hero now fits below the 64px header within one viewport, with contained emblem and responsive type. Shared navigation uses a cropped named SVG view plus alpha contrast filter to make the small logo crisp. Gallery hides horizontal scrollbars in all modes.

- The four knowledge-area icons explicitly keep animating under reduced motion at the user’s request; other icon consumers keep their existing preference behavior.

- Nosotros hero now composes the unchanged constellation canvas with HeroAcronimoComponent: six buttons around the unchanged transparent emblem, typed letter data, Auditoría initially selected, 3-second rotation, manual reset, pause/play, hover/focus pauses, reduced-motion initial pause and live-region control. The former vertical list is replaced by a heading and selected-letter card; mobile puts the emblem above the text.
- Visual refresh (feat/refresh-visual): design-system/galash-is/MASTER.md is the visual contract. Mint #9BE8B8 removed; role tokens in src/styles.css (--galash-accent Jonquil #F7C500, --galash-accent-fg, --galash-link, --galash-focus, --galash-border(-strong), --galash-text-strong, --galash-secondary Glaucous). Global white focus ring + navy halo. Pending = dashed + clock, success = neutral + check. Typography Sora 600 / IBM Plex Sans 400-600 / IBM Plex Mono 500 loaded via <link> in index.html. Canvas/WebGL colors read tokens with src/app/shared/css-color.ts.

- HU-SEM-05 public `/proyectos` is reachable from the shared menu via a lazy-loaded ProjectsPageComponent. ProjectListComponent and ProjectDetailComponent show typed mock data from ProjectsService (nine examples), combined status/seedbed filters, counts, coherent selection, progress, metadata, loading/error/retry/empty states and the existing shared sign-in flow. Uses current design tokens and responsive layout. No API calls added; backend JSON adapter, private documents and project mutation forms remain pending outside this public reference screen. Branch: feature/HU-SEM-05-gestionar-proyectos-investigacion, created from main.



- Current project workflow: proposal section, public proposal button, proposal store/example and proposal-only tests were removed at user request. Administration → Proyectos retains the shared catalogue plus Añadir proyecto aceptado and Actualizar información. The project editor includes synopsis/introduction, director, problem, objectives, methodology, optional in-memory annexes and all prior project metadata, with author/date audit. Mi proyecto still filters member/responsible account IDs. Seedbed project cards include matching local catalogue records; Ver más detalles shows synopsis, named members, start date and director. Backend-only records without agreed detail fields display unavailable metadata. Persistence and uploads remain local-demo pending real API integration; no API contract or servicios.md changes.

- Gestión de usuarios incluye Función en un semillero para la cuenta seleccionada: selector de semillero, asignación de líder (docente activo, PATCH con responsibleTeacherId) y delegado (integrante estudiante/docente activo, PUT de userIds conservando el otro delegado, máximo dos). Se muestra la función actual y los delegados; consultas y errores tienen estados visibles. Los roles generales no se amplían; no hubo cambios de backend. Validación con API simulada en escritorio/móvil y pruebas unitarias.

- Mi perfil muestra insignias y el listado de funciones de líder/delegado por semillero, obtenidas de managed_seedbed_ids en GET /users/me y del responsable en GET /seedbeds/{id}. Se consultan al entrar y con Actualizar funciones. Se mantiene el rol general; los detalles no accesibles se indican sin inventar permisos. Sin cambios de backend o base.

- Panel de líder en /gestion-semillero accesible desde Mi perfil: selecciona solo semilleros cuyo responsibleTeacherId coincide con la cuenta autenticada. Reutiliza solicitudes con seedbedId y servicio de estado por componente. Gestiona datos/visibilidad, integrantes, delegados, actividades y eventos nuevos asociados al semillero; mantiene estos eventos durante los cambios de sección. No muestra gestión global de cuentas. Proyectos, lista completa de eventos, cronograma y moderación de reseñas tienen mensajes explícitos de soporte pendiente/restringido. Los servicios administrativos generales siguen disponibles solo en su flujo original. Validación con 10 unitarias y 4 e2e simuladas; backend y datos reales sin modificar.

- El menú desplegable de la cuenta muestra Administrar mi semillero a líderes verificados, junto a Mi perfil; Admin mantiene Administración. El panel del líder comparte estilos y menú desplegable de secciones con el panel administrativo y reutiliza sus componentes de solicitudes/eventos, con ámbito del semillero y avisos de funciones pendientes. El acceso anterior desde Mi perfil se conserva.

- Corrección de reutilización: /administracion y /gestion-semillero cargan el mismo AdminComponent con admin.component.html y admin.component.css. El modo líder fija el ámbito a sus semilleros y oculta funciones globales; no existe ya un componente/pantalla paralelo del líder ni su CSS. Solicitudes y eventos siguen compartidos; las herramientas específicas usan los estilos administrativos existentes. Mi perfil conserva la información de funciones pero elimina enlace de gestión y botón de actualización; Administrar mi semillero permanece en el menú de cuenta.

- Menú de secciones compartido: en títulos cortos se centra bajo la flecha y corrige su desplazamiento lateral al abrir para evitar salir del viewport.
