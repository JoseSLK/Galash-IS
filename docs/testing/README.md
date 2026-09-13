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
