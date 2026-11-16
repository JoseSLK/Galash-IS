# Automated test catalog

Catalog is an opt-in index of implemented frontend tests, not a test-result
ledger. `events.ndjson` remains the source of truth for test definitions, runs,
and outcomes. Consult and update this catalog only when the user asks to create
or add tests. For other work, use existing event-log rules without catalog work.

Purpose: keep traceable evidence of which UI behaviors are covered, so it can
feed the external test report. `Matriz_de_pruebas_v1_1.md` is the reference of
user-interface tests to cover; it contains only UI-verifiable behavior.

## When adding tests

1. Read `docs/testing/README.md`, this guide, and the relevant catalog table.
2. Find the matching `PT-*`, `TD-*` or `TU-*` row in
   `Matriz_de_pruebas_v1_1.md` by filtering on its ID or HU heading; do not
   load the whole matrix.
3. Inspect matching test definitions in `docs/testing/events.ndjson` to choose
   the next unused stable `T` ID. Filter by relevant area and read no more than
   15 matching entries.
4. Add the test following Angular conventions: `*.spec.ts` next to the
   component or service it covers; browser end-to-end tests under `e2e/`.
5. Append one catalog row in the table matching the test type. Use the same `T`
   ID in the catalog and the `test` event. Add existing matrix IDs only when
   they directly cover the test; do not create new matrix IDs without the user.
6. Append the test-definition event. When tests run, append linked `R` and `X`
   events as required by `AGENTS.md`, and store screenshots or reports under
   `docs/testing/evidence/<run-id>/`. Do not record results in this catalog.

Classify isolated component, service, guard, pipe or form logic with test
doubles (no real backend) as **unit/component**; flows driven in a real
browser against the running app as **end-to-end UI**; production build checks
as **build**; scripted checks executed by a person in the browser as **manual
UI**. Keep one table per type and always record domain in its own column.

IDs are never reused. Keep existing rows stable; material test changes get a
new version or ID, in keeping with `docs/testing/README.md`.
If separate immutable `T` definitions cover different behaviors in one spec
(`it` block or `describe`), keep one catalog row per `T` ID and repeat the
spec name.

## Unit/component tests

|T ID|Domain|Test name|Purpose|Test file|Existing matrix ID(s)|
|---|---|---|---|---|---|
|T029|api-client|ApiService prefixes API base URL, strips leading slashes and sends credentials|Guard the shared HTTP client used by every backend call|`src/app/core/services/api.service.spec.ts`||

## End-to-end UI tests

|T ID|Domain|Test name|Purpose|Test file|Existing matrix ID(s)|
|---|---|---|---|---|---|
|T030|public-home|public home renders main content|Smoke check of the public home on desktop, tablet and mobile with mocked backend|`e2e/home.spec.ts`|PT-NF-02|
|T031|accessibility|public home has no WCAG 2 A/AA violations|Automated axe scan of the public home; covers only the automatable part of keyboard and screen-reader checks|`e2e/home.spec.ts`|PT-NF-06|
|T044|public-home|header compact class and emblem box ignore ±10px scroll jitter|Guards the nav emblem against size jumps: compact state uses scroll hysteresis and only scales the emblem, so layout box and header height stay fixed|`e2e/nav-emblem.spec.ts`|PT-NF-02|
|T045|accessibility|glitch background honors prefers-reduced-motion|Counts animation frames on the home: under reduce the WebGL hero background draws one static frame (no rAF loop) and it resumes or stops when the preference changes|`e2e/glitch-reduced-motion.spec.ts`|PT-NF-06|
|T2026111601|members|`teacher profile shows a valid CvLAC link that opens safely in a new tab`|Perfil docente muestra 'Ver CvLAC' con href exacto, target _blank y rel noopener.|`e2e/cvlac-profile.spec.ts`|PT-INT-03|
|T2026111602|members|`teacher profile hides the CvLAC link when it is removed/unsafe`|Sin enlace o con javascript: no hay enlace y se muestra '[Enlace CvLAC pendiente]'.|`e2e/cvlac-profile.spec.ts`|PT-INT-03|
|T2026111603|roles|`<rol>: account menu matches the role`|Para anónimo, visitante, estudiante, docente, delegado y admin: Mi perfil solo con sesión, Administración solo admin, Administrar mi semillero solo delegado.|`e2e/role-access.spec.ts`|PT-TR-02|
|T2026111604|roles|`<rol>: direct URL access to guarded routes`|Acceso directo: /administracion solo admin (adminGuard), /mi-perfil y /gestion-semillero redirigen a / sin sesión (profileGuard); sin semillero asignado no se muestra el panel.|`e2e/role-access.spec.ts`|PT-TR-02|
|T2026111605|visual|`main screens use one display font, one body font and the brand accent`|Captura 8 pantallas públicas y sus estilos computados; una fuente de títulos, una de texto y acento #F7C500 en todas.|`e2e/visual-identity.spec.ts`|PT-NF-01, TD-T05|
|T2026111607|forms|`<formulario>: validation errors are next to their fields`|Tras enviar vacío, cada campo inválido tiene mensaje visible, enlazado por aria-describedby y a ≤100 px. Cubre consulta de solicitud, Únete, crear semillero, noticia y proyecto; los marcados con D005 usan test.fail().|`e2e/form-errors.spec.ts`|PT-NF-03, TD-T06|
|T2026111610|navigation|`main navigation reaches each section with its heading`|Cada entrada del menú principal lleva a su ruta y muestra un h1.|`e2e/design-quality.spec.ts`|TD-T03|
|T2026111611|states|`<ruta>: loading, empty and error states are communicated`|Con API lenta, vacía y con error 500, Semilleros, Proyectos, Noticias e Integrantes muestran carga y error en una región alert/aria-live.|`e2e/design-quality.spec.ts`|TD-T07, TU-T08|
|T2026111612|responsive|`responsive <vista>: no horizontal scroll on public screens`|Sin desbordamiento horizontal a 320 px, móvil horizontal (915×412) y tableta horizontal (1138×712) en 7 pantallas públicas.|`e2e/design-quality.spec.ts`|TD-T09, TU-T11|
|T2026111613|accessibility|`public screens pass axe WCAG A/AA and keep a visible focus ring`|axe WCAG 2.1 A/AA en 7 pantallas (solo se acepta D009) y anillo o cambio visible de foco en los primeros 15 Tab.|`e2e/design-quality.spec.ts`|TD-T10, TU-T10|
|T2026111614|accessibility|`200% zoom keeps public screens usable`|Con zoom 200 % (640 px de ancho) no hay desbordamiento horizontal y el h1 es visible.|`e2e/design-quality.spec.ts`|TU-T10|
|T2026111615|visual|`<ruta> matches the approved screenshot`|Regresión visual con toHaveScreenshot de 5 pantallas contra la línea base aprobada (desktop; omitida en CI).|`e2e/visual-regression.spec.ts`|TD-T14|

## Build tests

|T ID|Domain|Test name|Purpose|Test file|Existing matrix ID(s)|
|---|---|---|---|---|---|

## Performance tests

|T ID|Domain|Test name|Purpose|Test file|Existing matrix ID(s)|
|---|---|---|---|---|---|
|T032|performance|Lighthouse CI home budgets|Track production build performance, accessibility, best-practices and SEO scores|`lighthouserc.json`||

## Manual UI tests

|T ID|Domain|Test name|Purpose|Test file|Existing matrix ID(s)|
|---|---|---|---|---|---|

For a new test type, add a table with the same columns. Keep domain as a column
in every table so tests remain filterable by functionality.
