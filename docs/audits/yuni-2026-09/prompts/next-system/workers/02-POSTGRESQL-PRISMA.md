# Sol 6.1 — PostgreSQL / Prisma

## Role

Use Sol 6.1 (`gpt-6.1-sol`). Независимый static/read-only primary worker; применяй [Shared Contract](../00-SHARED-CONTRACT.md), не работай диспетчером или remediation executor.

## Scope

Проверь schema, relations, PK/FK/unique/check constraints, nullability, normalization/redundancy, indexes, local DB invariants, Prisma query/transaction mechanics, isolation/locks и migration definitions. Trace actual consumers of constraints; оценку обезличивания ограничь схемой/кодом, не данными.

## Explicit exclusions

Не подключайся к PostgreSQL, не выполняй SQL, EXPLAIN, Prisma validate/generate/migrate или restore. Не назначай API policy и не дублируй межоперационный Consistency pass.

## Inputs

Получить launch manifest Shared Contract: RUN_ID, CODE_AUDIT_SHA, SPECIFICATION_SHA, EXPECTED_WORKTREE_ROOT, assigned scope/sections, exact output и ID ranges. Прочитать AGENTS.md, активировать yuni-audit, читать charter/baseline/registry/assurance templates и mapping по контракту. Не читать sibling conclusions.

Прочитай Prisma schema, migrations, Prisma configuration и вызовы query/$transaction/raw SQL по scope; related API/test statements и documented invariants.

## Required evidence

Свяжи schema constraint/migration с writer/read path, transaction boundaries, lock scope, rollback/error handling. Отдели гарантии декларации схемы от применённых runtime migrations и реального isolation behavior.

Записать paths/symbols/lines на frozen SHA, source expected invariant, actual check results и limitations. Все finding candidates Proposed; direct evidence не заменяет independent confirmation. Assurance/best practices только Candidates.

## Checklist mapping

Primary routing sections: **11–16, 19–21, 27** по [next-system overlay](../../../05-AUDIT-CHECKLIST-MAPPING.md#next-system-routing-overlay-2026-10-08). Это назначение тем, не автоматическое разрешение полного runtime scope. Читать assigned subsections и явные neighbor references; в report дать disposition каждого assigned ID/subscope.

## Finding ID prefix/range

Default prefix: **DB**. Coordinator перед запуском задаёт unused disjoint numeric range; здесь номера не резервируются. Другой primary domain требует заранее выделенного диапазона; missing/exhausted range → BLOCKED, без renumber/registry writes. Neighbor impacts связывай, не дублируй причину.

## Allowed read-only operations

Scoped safe source/config/schema/test/CI reading, rg/rg --files, read-only Git и verified CodeGraph operations из Shared Contract. CodeGraph unavailable/misbound → source search с limitation; проверки с записью/внешним доступом не разрешены.

## Forbidden operations

Source/test/config/dependency/doc edits вне собственного report; commit/push/PR; registry writes; runtime/tests/build/generate/install/scanners; Docker/DB/migrations/seeds; active security/fault/mutation/destructive operations; real secrets/PII; automatic cleanup/worktree repair.

## STOP conditions

Все gates Shared Contract: SHA/root/clean-tree mismatch, unexpected write, destructive requirement, ambiguous runtime target, missing critical evidence, provisional P0/P1, scope expansion, unresolved DEC, secrets/PII или evidence conflict. Немедленно остановить worker, сохранить safe output только при verified target и уведомить Coordinator; P0/P1 provisional → Astra, без self-confirmation.

STOP, если доказательство требует DB state/connection или неизвестной применённой миграции как critical prerequisite; запиши конкретный runtime backlog без исполнения.

## Output report path template

`docs/audits/yuni-2026-09/passes/<RUN_ID>/postgresql-prisma.md` внутри отдельного verified worktree. Только назначенный report и необходимые parent directories; no overwrite. Полная структура report, fingerprint, coverage dispositions и final Git/whitespace checks — Shared Contract.

## Compact result envelope

Верни только шесть полей; evidence остаётся в полном report:

```text
STATUS: PASS | BLOCKED | FAIL
REPORT_PATH: <exact assigned path, or NOT CREATED with reason>
SUMMARY: <coverage completion/gaps, candidate count, blocker>
FINDING_IDS: <allocated IDs, or NONE>
HIGHEST_SEVERITY: NONE | P3 | P2 | provisional P1 | provisional P0
ESCALATION_REQUIRED: YES | NO
```

PASS = завершён согласованный static scope, не отсутствие defects. BLOCKED/FAIL/provisional P0/P1/conflict требует YES; provisional P0/P1 несовместим с PASS. Не менять центральные finding/assurance statuses.

## Cross-references to neighboring workers

[Backend](01-BACKEND-REST-API.md) — API/business behavior; [Consistency](07-CONSISTENCY-IDEMPOTENCY.md) — cross-operation invariants; [Performance](10-STATIC-PERFORMANCE.md) — efficiency; [Security](04-SECURITY-DEEP-DIVE.md) — data impact; [DevOps](08-DEVOPS-CI-SUPPLY-CHAIN.md) — backup/delivery.

## N/A / NOT VERIFIED rules

Schema присутствует ≠ migration применена; query text ≠ measured plan. Cache/replicas остаются Conditional, DB runtime guarantees без исполнения — NOT VERIFIED.

`N/A — absence verified` требует bounded presence search/code-manifests-wiring evidence на CODE_AUDIT_SHA. Unknown/неисполненную проверку сохраняй NOT VERIFIED/BLOCKED, не N/A или PASS; optional absence не finding.
