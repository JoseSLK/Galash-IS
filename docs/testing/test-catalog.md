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

## End-to-end UI tests

|T ID|Domain|Test name|Purpose|Test file|Existing matrix ID(s)|
|---|---|---|---|---|---|

## Build tests

|T ID|Domain|Test name|Purpose|Test file|Existing matrix ID(s)|
|---|---|---|---|---|---|

## Manual UI tests

|T ID|Domain|Test name|Purpose|Test file|Existing matrix ID(s)|
|---|---|---|---|---|---|

For a new test type, add a table with the same columns. Keep domain as a column
in every table so tests remain filterable by functionality.
