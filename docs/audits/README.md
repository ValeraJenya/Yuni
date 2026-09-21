# Audit Index Process

Audit index хранит только reviewed audit records and findings. Raw drafts не являются подтверждёнными findings.

## September 2026 audit navigation

| Что нужно узнать | Source of truth / границы |
| --- | --- |
| Записанное состояние аудита | [Pre-Audit Plan](yuni-2026-09/00-PRE-AUDIT-PLAN.md): история и следующий шаг; конкретный результат проверять по связанному report/SHA |
| Findings и их lifecycle | [Findings Register](yuni-2026-09/03-FINDINGS.md): master, evidence, статусы и compatibility с историческими обозначениями |
| Ограниченные assurances | [Assurance Register](yuni-2026-09/06-ASSURANCE-REGISTER.md): scope, checked SHA и статические границы |
| Owner Decisions и runtime backlog | [Wave 1 Followups](yuni-2026-09/07-WAVE-1-FOLLOWUPS.md): DEC-001–006 и RV-01–09; [DEC-005 draft](yuni-2026-09/08-VALIDATION-ENVIRONMENT.md) не заменяет acceptance |
| Выполненная Wave 1 | [Synthesis](yuni-2026-09/passes/wave-1/04-SYNTHESIS-RED-TEAM.md) и связанные primary reports: ограниченный static scope |
| CURRENT architecture | [Program Flow Map](../architecture/program-flow-map.md), [Domain Model](../architecture/domain-model.md): dated source evidence |
| TARGET / PROPOSED / OPEN | [Scaling Roadmap](../architecture/scaling-roadmap.md), [Financial Flow](../architecture/financial-flow.md); vocabulary — [Architecture](../architecture/README.md) |
| Исторические планы и snapshots | [Wave 1 Plan](yuni-2026-09/04-WAVE-1-PLAN.md), [Mapping](yuni-2026-09/05-AUDIT-CHECKLIST-MAPPING.md), [Baseline](yuni-2026-09/02-BASELINE.md), [Project State](../PROJECT_STATE.md), [AI Context](../../AI_CONTEXT.md) |

Исторические estimates описывают ожидания на свою дату, а не выполненную работу или текущий roadmap; цифры не пересчитываются задним числом. При сверке 2026-09-21 `YUNI_AUDIT_REMAINING_WORK_ESTIMATE_2026-09-07.md` и ссылки на него в tracked repository не найдены; внешняя копия не является журналом выполнения. Актуальность каждого результата определяется его evidence и SHA, а не датой навигационной страницы.

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

Историческое правило общего index: finding связывался с task ID либо отмечался `false-positive` / `deferred`. Для центрального технического аудита текущий finding lifecycle и условия связи с remediation-задачей заданы [Findings Register §3](yuni-2026-09/03-FINDINGS.md#3-statuses); создание remediation-задачи не является условием существования Proposed/Confirmed finding. Смысловое соответствие старых статусов хранится [там же](yuni-2026-09/03-FINDINGS.md#compatibility-with-historical-auditreview-statuses).

Исторические статусы общего index/review (сохраняются в старых records, не подставляются автоматически в центральный registry):

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