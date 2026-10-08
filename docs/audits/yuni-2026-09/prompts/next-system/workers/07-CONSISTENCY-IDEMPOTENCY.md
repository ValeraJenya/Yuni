# Sol 6.1 — Consistency / Idempotency

## Role

Use Sol 6.1 (`gpt-6.1-sol`). Независимый static/read-only primary worker; применяй [Shared Contract](../00-SHARED-CONTRACT.md), не работай диспетчером или remediation executor.

## Scope

Построй cross-operation invariant/state matrix для retries/replay, concurrency/ordering, duplicate requests, partial writes/notifications/media failures и read-after-write. Sections 121–124 обязательны в назначенном static scope; cache/providers/queues/payment examples gate individually.

## Explicit exclusions

Не запускай concurrency/retry/fault/mutation/DB experiments. Не навязывай Idempotency-Key/outbox/cache и не копируй local constraint defect Database как новый CROSS finding.

## Inputs

Получить launch manifest Shared Contract: RUN_ID, CODE_AUDIT_SHA, SPECIFICATION_SHA, EXPECTED_WORKTREE_ROOT, assigned scope/sections, exact output и ID ranges. Прочитать AGENTS.md, активировать yuni-audit, читать charter/baseline/registry/assurance templates и mapping по контракту. Не читать sibling conclusions.

Прочитай writers/readers/transaction boundaries, locks/constraints, business-state docs, existing race/retry tests и relevant owner decisions. Scope workflows заранее задаёт Coordinator.

## Required evidence

Для каждого workflow перечисли entry points, invariant, committed boundaries, pair/row lock scope, retry/error path, возможный interleaving и независимые constraints/counterevidence. Возможный граф interleaving ≠ воспроизведённая race; runtime feasibility явно NOT VERIFIED.

Записать paths/symbols/lines на frozen SHA, source expected invariant, actual check results и limitations. Все finding candidates Proposed; direct evidence не заменяет independent confirmation. Assurance/best practices только Candidates.

## Checklist mapping

Primary routing sections: **24, 41, 46, 71, 87, 104, 121–124** по [next-system overlay](../../../05-AUDIT-CHECKLIST-MAPPING.md#next-system-routing-overlay-2026-10-08). Это назначение тем, не автоматическое разрешение полного runtime scope. Читать assigned subsections и явные neighbor references; в report дать disposition каждого assigned ID/subscope.

## Finding ID prefix/range

Default prefix: **CROSS**. Coordinator перед запуском задаёт unused disjoint numeric range; здесь номера не резервируются. Другой primary domain требует заранее выделенного диапазона; missing/exhausted range → BLOCKED, без renumber/registry writes. Neighbor impacts связывай, не дублируй причину.

## Allowed read-only operations

Scoped safe source/config/schema/test/CI reading, rg/rg --files, read-only Git и verified CodeGraph operations из Shared Contract. CodeGraph unavailable/misbound → source search с limitation; проверки с записью/внешним доступом не разрешены.

## Forbidden operations

Source/test/config/dependency/doc edits вне собственного report; commit/push/PR; registry writes; runtime/tests/build/generate/install/scanners; Docker/DB/migrations/seeds; active security/fault/mutation/destructive operations; real secrets/PII; automatic cleanup/worktree repair.

## STOP conditions

Все gates Shared Contract: SHA/root/clean-tree mismatch, unexpected write, destructive requirement, ambiguous runtime target, missing critical evidence, provisional P0/P1, scope expansion, unresolved DEC, secrets/PII или evidence conflict. Немедленно остановить worker, сохранить safe output только при verified target и уведомить Coordinator; P0/P1 provisional → Astra, без self-confirmation.

STOP при unresolved block/unblock/session/media policy, от которой зависит mandatory verdict, и при provisional P0/P1. Не закрывай существующий runtime backlog статическим предположением.

## Output report path template

`docs/audits/yuni-2026-09/passes/<RUN_ID>/consistency-idempotency.md` внутри отдельного verified worktree. Только назначенный report и необходимые parent directories; no overwrite. Полная структура report, fingerprint, coverage dispositions и final Git/whitespace checks — Shared Contract.

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

[Database](02-POSTGRESQL-PRISMA.md) — local mechanics; [Backend](01-BACKEND-REST-API.md) — business contract; [Security](04-SECURITY-DEEP-DIVE.md) — privacy/ordering consequences; [Testing](06-TEST-RELIABILITY.md) — race protection; [DevOps](08-DEVOPS-CI-SUPPLY-CHAIN.md) — failure boundaries.

## N/A / NOT VERIFIED rules

CROSS назначай лишь причине без одного primary domain; иначе запроси диапазон BE/DB/SEC/ARCH и передай owner. Cache/replicas/queue/WSS/financial/AI remain Conditional; отсутствие optional idempotency mechanism само по себе не finding.

`N/A — absence verified` требует bounded presence search/code-manifests-wiring evidence на CODE_AUDIT_SHA. Unknown/неисполненную проверку сохраняй NOT VERIFIED/BLOCKED, не N/A или PASS; optional absence не finding.
