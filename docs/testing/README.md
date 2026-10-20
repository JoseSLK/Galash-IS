# Testing Ledger

`events.ndjson` is the append-only source of truth. Add one JSON object per
line. Do not edit or delete historical events.

## Event types

```text
test    test definition
run     execution session
result  test outcome
defect  defect record or update
env     execution environment
note    human observation
```

## Compact schema

```json
{"v":1,"id":"T001","t":"test","area":"auth","p":"must","name":"Valid login"}
{"v":1,"id":"E001","t":"env","browser":"Chrome","os":"Linux","device":"desktop"}
{"v":1,"id":"R001","t":"run","at":"2026-09-12T14:00:00Z","build":"abc123","env":"E001","by":"jose","mode":"manual"}
{"v":1,"id":"X001","t":"result","run":"R001","test":"T001","s":"pass","ms":8420,"ev":["R001/T001.png"]}
{"v":1,"id":"D001","t":"defect","test":"T001","run":"R001","sev":"high","s":"open","name":"Example defect"}
```

Use controlled result statuses: `pass`, `fail`, `block`, `skip`, `not_run`.
Use UTC timestamps. Omit empty fields. Never store passwords, tokens, cookies,
or unnecessary personal data.

Test IDs are assigned when tests are created. Test definitions are immutable;
material changes create a new version or ID. Dashboard statistics are derived
from events and must not be written manually.

## Dashboard

Open `dashboard/index.html`. For local file access, use **Load events.ndjson**
or serve this directory with any static HTTP server. Dashboard has no runtime
dependencies.

## Running tests

Command list per test: `comandos.md`.

| Type | Tool | Command |
|---|---|---|
| Unit/component | Vitest via `@angular/build:unit-test` (jsdom) | `npm test` (`-- --watch=false` for a single run) |
| End-to-end UI + accessibility | Playwright (Chromium: desktop, tablet, mobile) + `@axe-core/playwright` | `npm run test:e2e` |
| Performance | Lighthouse CI on the production build | `npm run build && npm run test:perf` |
| Build | Angular CLI | `npm run build` |

- Unit specs live next to their source as `*.spec.ts`; e2e specs live in `e2e/`.
- E2E tests mock the backend with `page.route()`; mocks must follow
  `servicios.md` and the shared contract.
- First-time setup: `npx playwright install chromium`. Lighthouse needs Chrome;
  without a system Chrome set `CHROME_PATH` to Playwright's Chromium binary.
- Reports: `playwright-report/` and `.lighthouseci/reports/` (both ignored by
  git). Copy evidence worth keeping to `evidence/<run-id>/`.
- Known defects stay visible: mark the test with `test.fail()` and the defect
  ID; remove the mark when the defect is fixed.
- CI: `.github/workflows/tests.yml` runs build, unit, e2e and Lighthouse on
  every pull request and push to `main`, and uploads both reports.
