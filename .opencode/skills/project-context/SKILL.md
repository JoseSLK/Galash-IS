---
name: project-context
description: Loads GALASH repository rules and append-only implementation history. Use at task start or before changing project files.
---

Classify task scope from the user prompt. Read `AGENTS.md` before editing. Read
`docs/contexto.md` and relevant entries from `docs/bitacora.ndjson` only when
task scope requires current state or prior work.

- User prompt supplies current scope and requirements.
- Private requirement files are not repository context.
- Inspect code before proposing or making changes.
- Read only files relevant to the task.
- For testing tasks, read `docs/testing/README.md` first and no broader project
  files unless testing scope explicitly requires them.
- Filter logs by exact `id`, `type`, `scope`, `test`, `run`, `area`, `status`,
  or defect reference; read at most 15 matching entries per log file.
- At completion, record files and test results in one new log event.
- Never edit or delete historical log entries.
