# Audit Index Process

Audit index хранит только reviewed audit records and findings. Raw drafts не являются подтверждёнными findings.

## Требования к audit

Каждый audit должен содержать:

- ID;
- date;
- checked commit;
- scope;
- method;
- findings;
- statuses;
- evidence;
- related tasks;
- recheck date.

Audit не является абсолютной истиной без checked commit и evidence.

## Raw drafts

Raw/unreviewed audit drafts нельзя добавлять в Git как подтверждённые findings. Existing raw drafts внутри `docs/audits/` не оформляются автоматически как AUD-001.

## Finding lifecycle

Каждый finding должен быть связан с task ID или явно признан `false-positive` / `deferred`.

Допустимые finding statuses:

```text
verified
resolved
needs-recheck
deferred
false-positive
```

## Audit index table template

| Audit ID | Date | Checked commit | Scope | Method | Findings summary | Related tasks | Recheck date | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | YYYY-MM-DD | commit | paths/modules | manual/AI/tooling | summary | task IDs | YYYY-MM-DD | verified/resolved/needs-recheck/deferred/false-positive |

## Task 000

Task 000 создаёт только audit index process. AUD-001 не создаётся, и записи о конкретном existing raw draft не добавляются.