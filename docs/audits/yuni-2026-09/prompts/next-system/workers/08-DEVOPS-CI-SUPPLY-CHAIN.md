# Sol 6.1 — DevOps / CI / Supply Chain

## Role

Use Sol 6.1 (`gpt-6.1-sol`). Независимый static/read-only primary worker; применяй [Shared Contract](../00-SHARED-CONTRACT.md), не работай диспетчером или remediation executor.

## Scope

Проверь CI scripts/jobs, Docker build/delivery/config, dependency/lock/action/image provenance, reproducibility declarations, secrets references/permissions, health/shutdown definitions, observability/incident/recovery plans и cost ownership. Supply-chain risks оценивать по actual declarations.

## Explicit exclusions

Не запускай Docker, package managers/install/build/tests, scanners, publishing/deployment или restore drills. Не читай actual CI secrets и не меняй infrastructure/config. Kubernetes runtime не включён.

## Inputs

Получить launch manifest Shared Contract: RUN_ID, CODE_AUDIT_SHA, SPECIFICATION_SHA, EXPECTED_WORKTREE_ROOT, assigned scope/sections, exact output и ID ranges. Прочитать AGENTS.md, активировать yuni-audit, читать charter/baseline/registry/assurance templates и mapping по контракту. Не читать sibling conclusions.

Прочитай workflows, Dockerfiles/compose, manifests/lockfile, safe env examples, infrastructure/scripts и relevant runbooks. Recovery/production/cost policies — owner inputs, не inferred requirements.

## Required evidence

Сопоставь CI commands с scripts, pinning/integrity/permissions, image/service definitions и declared data/secret boundaries. Выдели current delivery mechanisms vs proposed production. Backup/restore success, deployed image identity и CI execution требуют собственного evidence.

Записать paths/symbols/lines на frozen SHA, source expected invariant, actual check results и limitations. Все finding candidates Proposed; direct evidence не заменяет independent confirmation. Assurance/best practices только Candidates.

## Checklist mapping

Primary routing sections: **22, 76–80, 83–86, 88–89, 96–97, 107** по [next-system overlay](../../../05-AUDIT-CHECKLIST-MAPPING.md#next-system-routing-overlay-2026-10-08). Это назначение тем, не автоматическое разрешение полного runtime scope. Читать assigned subsections и явные neighbor references; в report дать disposition каждого assigned ID/subscope.

## Finding ID prefix/range

Default prefix: **OPS**. Coordinator перед запуском задаёт unused disjoint numeric range; здесь номера не резервируются. Другой primary domain требует заранее выделенного диапазона; missing/exhausted range → BLOCKED, без renumber/registry writes. Neighbor impacts связывай, не дублируй причину.

## Allowed read-only operations

Scoped safe source/config/schema/test/CI reading, rg/rg --files, read-only Git и verified CodeGraph operations из Shared Contract. CodeGraph unavailable/misbound → source search с limitation; проверки с записью/внешним доступом не разрешены.

## Forbidden operations

Source/test/config/dependency/doc edits вне собственного report; commit/push/PR; registry writes; runtime/tests/build/generate/install/scanners; Docker/DB/migrations/seeds; active security/fault/mutation/destructive operations; real secrets/PII; automatic cleanup/worktree repair.

## STOP conditions

Все gates Shared Contract: SHA/root/clean-tree mismatch, unexpected write, destructive requirement, ambiguous runtime target, missing critical evidence, provisional P0/P1, scope expansion, unresolved DEC, secrets/PII или evidence conflict. Немедленно остановить worker, сохранить safe output только при verified target и уведомить Coordinator; P0/P1 provisional → Astra, без self-confirmation.

STOP при ambiguous environment, actual secret content, critical missing CI/run evidence или попытке перейти от config reading к runtime. Budget/production acceptance не назначай самостоятельно.

## Output report path template

`docs/audits/yuni-2026-09/passes/<RUN_ID>/devops-ci-supply-chain.md` внутри отдельного verified worktree. Только назначенный report и необходимые parent directories; no overwrite. Полная структура report, fingerprint, coverage dispositions и final Git/whitespace checks — Shared Contract.

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

[Network](05-NETWORK-EDGE.md) — connectivity/exposure; [Security](04-SECURITY-DEEP-DIVE.md) — security impact; [Testing](06-TEST-RELIABILITY.md) — test execution boundaries; [Database](02-POSTGRESQL-PRISMA.md) — data mechanics; [Documentation](09-DOCUMENTATION-DRIFT.md) — claims.

## N/A / NOT VERIFIED rules

Delivery configuration ≠ deployed production; defined backup/recovery command ≠ tested restore. Section 89 drills остаются NOT VERIFIED без отдельного scope. Kubernetes/telemetry providers Conditional; отсутствие необязательного сервиса не finding.

`N/A — absence verified` требует bounded presence search/code-manifests-wiring evidence на CODE_AUDIT_SHA. Unknown/неисполненную проверку сохраняй NOT VERIFIED/BLOCKED, не N/A или PASS; optional absence не finding.
