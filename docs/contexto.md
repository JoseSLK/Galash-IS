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
- Login redesigned with the dark GALASH split-panel layout, responsive behavior, accessible form states, and email/password plus Google actions preserved.
- Login typography uses Signika Negative bold for titles and primary actions, Open Sans light for supporting content, and #7785AC for the primary login button text.
- Login diagonal background uses a pronounced CSS polygon in #5F6685 over the dark base, crossing behind the welcome panel while preserving the form panel layering.
- The #34374E login form panel now has its own diagonal right edge using clip-path, disabled only on mobile for a readable single-column layout.
- Login typography and primary actions now match the reference: white "Ingresar" button text, green mint form labels and underlines, Google sign-in copy, yellow "Bienvenid@", lorem ipsum supporting text, stacked GALASH letters, and a mint corner mark.
- Login diagonal background uses a precise CSS polygon in #5F6685 with two parallel straight edges, while the form column remains fully over the dark panel and clean in its default state.
- The diagonal panel cut now matches the reference proportions: the #34374E surface ends at the first diagonal edge and the #5F6685 stripe continues parallel to the lower-right corner.
- The #5F6685 login stripe keeps a constant width from its top edge to its bottom edge by using matching parallel polygon coordinates.
- The #5F6685 login stripe now ends earlier toward the lower-right, leaving more of the dark background visible in the right column while preserving its constant width.
- The diagonal background cut was moved further left so the dark right panel occupies more of the full-screen layout.
- Login typography sizes are tuned to the reference: approximately 36px for the welcome title, 13px for supporting copy, and 14px for the primary action, with smaller responsive values on mobile.
- The “De nuevo!” welcome line is slightly larger than the first line and remains white for contrast.
- Login typography and supporting content now match the reference: the “De nuevo!” line keeps its previous size, while the Lorem ipsum paragraph is slightly larger and white.
- The login heading now opens a small navigation menu with a link back to the main page, and only the @ in "Bienvenid@" uses the Jonquil highlight.
- Login heading and dropdown now match the reference: large white “Iniciar Sesión”, outlined downward arrow, and a dark “Home” option.
- Login heading now returns to its previous size and acts directly as a link to the main page without opening a dropdown.
- Google sign-in button keeps its existing dimensions while using Signika typography, a defined gray border, an oval shape, and a larger G mark to match the reference.
- Login now fills the entire viewport without the previous centered card margins or border.
- The login layout now uses balanced 1:1 columns while continuing to fill the entire viewport, giving the composition a less stretched appearance.
- Login form controls now use a shorter shared width so the email and password lines match the narrower primary button proportions.
- The dark blue login panel now occupies 60% of the full-screen layout, leaving a narrower right information column.
- Login form controls now use a slightly longer shared width, and the Google action is centered with Spanish copy.
- Login form controls and primary/secondary actions now share a centered axis within the form panel.
- Login form controls now use a slightly longer shared width, and the Google action is centered with Spanish copy.
- Login form controls now use a slightly longer shared width, and the Google action is centered with Spanish copy.
- Login typography sizes are tuned to the reference: approximately 36px for the welcome title, 13px for supporting copy, and 14px for the primary action, with smaller responsive values on mobile.
- Login typography sizes are tuned to the reference: approximately 36px for the welcome title, 13px for supporting copy, and 14px for the primary action, with smaller responsive values on mobile.
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
