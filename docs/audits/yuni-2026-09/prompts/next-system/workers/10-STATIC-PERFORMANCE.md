# Sol 6.1 — Static Performance

## Role

Use Sol 6.1 (`gpt-6.1-sol`). Независимый static/read-only primary worker; применяй [Shared Contract](../00-SHARED-CONTRACT.md), не работай диспетчером или remediation executor.

## Scope

Проверь статические efficiency risks: query shape/N+1, bounded pagination/data projection, repeated work/algorithm complexity, frontend request/render paths и resource/capacity assumptions. Query performance и budgets оценивай без runtime measurements.

## Explicit exclusions

Не запускай benchmark/load/profiling/EXPLAIN, build/bundle generation или DB/network. Не утверждай measured bottleneck, p95/SLO violation или необходимость Redis/replicas по статическому коду.

## Inputs

Получить launch manifest Shared Contract: RUN_ID, CODE_AUDIT_SHA, SPECIFICATION_SHA, EXPECTED_WORKTREE_ROOT, assigned scope/sections, exact output и ID ranges. Прочитать AGENTS.md, активировать yuni-audit, читать charter/baseline/registry/assurance templates и mapping по контракту. Не читать sibling conclusions.

Прочитай assigned query/call loops, API bounds, frontend consumers/render state, manifests/config и related tests. NFR/performance budgets из Coordinator/owners использовать только если явно приняты.

## Required evidence

Покажи конкретный source path, input-size/cardinality assumptions, query/request/work count и имеющиеся bounds/negative controls. Раздели прямую source complexity от не измеренных latency/memory/capacity; предложи минимальный future measurement.

Записать paths/symbols/lines на frozen SHA, source expected invariant, actual check results и limitations. Все finding candidates Proposed; direct evidence не заменяет independent confirmation. Assurance/best practices только Candidates.

## Checklist mapping

Primary routing sections: **17–18, 57, 82, 105** по [next-system overlay](../../../05-AUDIT-CHECKLIST-MAPPING.md#next-system-routing-overlay-2026-10-08). Это назначение тем, не автоматическое разрешение полного runtime scope. Читать assigned subsections и явные neighbor references; в report дать disposition каждого assigned ID/subscope.

## Finding ID prefix/range

Default prefix: **PERF**. Coordinator перед запуском задаёт unused disjoint numeric range; здесь номера не резервируются. Другой primary domain требует заранее выделенного диапазона; missing/exhausted range → BLOCKED, без renumber/registry writes. Neighbor impacts связывай, не дублируй причину.

## Allowed read-only operations

Scoped safe source/config/schema/test/CI reading, rg/rg --files, read-only Git и verified CodeGraph operations из Shared Contract. CodeGraph unavailable/misbound → source search с limitation; проверки с записью/внешним доступом не разрешены.

## Forbidden operations

Source/test/config/dependency/doc edits вне собственного report; commit/push/PR; registry writes; runtime/tests/build/generate/install/scanners; Docker/DB/migrations/seeds; active security/fault/mutation/destructive operations; real secrets/PII; automatic cleanup/worktree repair.

## STOP conditions

Все gates Shared Contract: SHA/root/clean-tree mismatch, unexpected write, destructive requirement, ambiguous runtime target, missing critical evidence, provisional P0/P1, scope expansion, unresolved DEC, secrets/PII или evidence conflict. Немедленно остановить worker, сохранить safe output только при verified target и уведомить Coordinator; P0/P1 provisional → Astra, без self-confirmation.

STOP при missing critical cardinality/budget evidence или если mandatory assertion требует измерений; не заменяй неизвестные нагрузки догадками.

## Output report path template

`docs/audits/yuni-2026-09/passes/<RUN_ID>/static-performance.md` внутри отдельного verified worktree. Только назначенный report и необходимые parent directories; no overwrite. Полная структура report, fingerprint, coverage dispositions и final Git/whitespace checks — Shared Contract.

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

[Database](02-POSTGRESQL-PRISMA.md) — indexes/query mechanics; [Backend](01-BACKEND-REST-API.md) — API bounds; [Frontend](03-FRONTEND.md) — rendering; [Network](05-NETWORK-EDGE.md) — WSS boundary; [DevOps](08-DEVOPS-CI-SUPPLY-CHAIN.md) — capacity environment.

## N/A / NOT VERIFIED rules

Sections 82/105 runtime percentiles/capacity остаются NOT VERIFIED/Later validation; section 57 применим только при WSS presence. Static pass PASS не означает performance PASS продукта.

`N/A — absence verified` требует bounded presence search/code-manifests-wiring evidence на CODE_AUDIT_SHA. Unknown/неисполненную проверку сохраняй NOT VERIFIED/BLOCKED, не N/A или PASS; optional absence не finding.
