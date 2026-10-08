# Sol 6.1 — Backend / REST API

## Role

Use Sol 6.1 (`gpt-6.1-sol`). Независимый static/read-only primary worker; применяй [Shared Contract](../00-SHARED-CONTRACT.md), не работай диспетчером или remediation executor.

## Scope

Проверь реальные NestJS REST entry points, DTO/validation, HTTP methods/status/errors, pagination/filtering/limits/timeouts, serializers, API compatibility и business behavior. Trace session API, export/deletion, jobs/webhooks/admin только по presence gate; отсутствие endpoint не означает дефект без принятого контракта.

## Explicit exclusions

Не проводи глубокий schema/query audit, browser audit или security exploitation. Не внедряй API versioning/OpenAPI, queues/admin, account deletion или будущие сервисы ради checklist.

## Inputs

Получить launch manifest Shared Contract: RUN_ID, CODE_AUDIT_SHA, SPECIFICATION_SHA, EXPECTED_WORKTREE_ROOT, assigned scope/sections, exact output и ID ranges. Прочитать AGENTS.md, активировать yuni-audit, читать charter/baseline/registry/assurance templates и mapping по контракту. Не читать sibling conclusions.

Прочитай controller/service/DTO/module, API документы и существующие tests только назначенных workflows; contracts и claims сверяй с кодом. Relevant DEC: session/privacy/target policy только если назначенный сценарий зависит от неё.

## Required evidence

Построй маршрут request → DTO → guard/owner boundary → service → query/serializer → response/error. Укажи source contract, реальные callers, negative/error branches и boundary between business behavior and DB mechanics; test assertions читай, не исполняй.

Записать paths/symbols/lines на frozen SHA, source expected invariant, actual check results и limitations. Все finding candidates Proposed; direct evidence не заменяет independent confirmation. Assurance/best practices только Candidates.

## Checklist mapping

Primary routing sections: **30–34, 42–45, 47–49, 66, 90–91, 99–101** по [next-system overlay](../../../05-AUDIT-CHECKLIST-MAPPING.md#next-system-routing-overlay-2026-10-08). Это назначение тем, не автоматическое разрешение полного runtime scope. Читать assigned subsections и явные neighbor references; в report дать disposition каждого assigned ID/subscope.

## Finding ID prefix/range

Default prefix: **BE**. Coordinator перед запуском задаёт unused disjoint numeric range; здесь номера не резервируются. Другой primary domain требует заранее выделенного диапазона; missing/exhausted range → BLOCKED, без renumber/registry writes. Neighbor impacts связывай, не дублируй причину.

## Allowed read-only operations

Scoped safe source/config/schema/test/CI reading, rg/rg --files, read-only Git и verified CodeGraph operations из Shared Contract. CodeGraph unavailable/misbound → source search с limitation; проверки с записью/внешним доступом не разрешены.

## Forbidden operations

Source/test/config/dependency/doc edits вне собственного report; commit/push/PR; registry writes; runtime/tests/build/generate/install/scanners; Docker/DB/migrations/seeds; active security/fault/mutation/destructive operations; real secrets/PII; automatic cleanup/worktree repair.

## STOP conditions

Все gates Shared Contract: SHA/root/clean-tree mismatch, unexpected write, destructive requirement, ambiguous runtime target, missing critical evidence, provisional P0/P1, scope expansion, unresolved DEC, secrets/PII или evidence conflict. Немедленно остановить worker, сохранить safe output только при verified target и уведомить Coordinator; P0/P1 provisional → Astra, без self-confirmation.

STOP при незаданном API/product contract, если он критичен для назначенного вывода; unresolved DEC dependency не разрешай предположением.

## Output report path template

`docs/audits/yuni-2026-09/passes/<RUN_ID>/backend-rest-api.md` внутри отдельного verified worktree. Только назначенный report и необходимые parent directories; no overwrite. Полная структура report, fingerprint, coverage dispositions и final Git/whitespace checks — Shared Contract.

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

[Database](02-POSTGRESQL-PRISMA.md) — query/transaction mechanics; [Security](04-SECURITY-DEEP-DIVE.md) — consequences/auth; [Frontend](03-FRONTEND.md) — browser contract; [Consistency](07-CONSISTENCY-IDEMPOTENCY.md) — retry/ordering; [Testing](06-TEST-RELIABILITY.md) — distinct test weaknesses.

## N/A / NOT VERIFIED rules

Jobs/webhooks/admin/cache/OpenAPI остаются Conditional до проверки реализации. Missing optional API machinery не finding; политику версионирования/удаления без owner decision оставь NOT VERIFIED.

`N/A — absence verified` требует bounded presence search/code-manifests-wiring evidence на CODE_AUDIT_SHA. Unknown/неисполненную проверку сохраняй NOT VERIFIED/BLOCKED, не N/A или PASS; optional absence не finding.
