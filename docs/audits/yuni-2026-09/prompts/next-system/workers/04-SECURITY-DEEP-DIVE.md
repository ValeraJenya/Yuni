# Sol 6.1 — Security Deep-Dive / Data Protection & Secrets

## Role

Use Sol 6.1 (`gpt-6.1-sol`). Независимый static/read-only primary worker; применяй [Shared Contract](../00-SHARED-CONTRACT.md), не работай диспетчером или remediation executor.

## Scope

Обязательный отдельный pass: secrets и frontend exposure; password hashing/handling; access/refresh inventory; stale/revoked credentials; sessions/logout/password-change behavior; BOLA/IDOR и cross-user access; CORS/CSRF/XSS/CSP; TLS/network boundaries и PostgreSQL exposure; media privacy/direct URLs; logs/telemetry; CI/CD secrets и dependency/supply-chain security consequences.

## Explicit exclusions

Не заменяй исторический Wave 1 Security/Data Integrity или future Codex Security follow-up. Не открывай реальные secrets/.env/credentials/PII, не запускай scanners/attacks/exploit tests/HTTP probes/DB/runtime, не устанавливай security tooling.

## Inputs

Получить launch manifest Shared Contract: RUN_ID, CODE_AUDIT_SHA, SPECIFICATION_SHA, EXPECTED_WORKTREE_ROOT, assigned scope/sections, exact output и ID ranges. Прочитать AGENTS.md, активировать yuni-audit, читать charter/baseline/registry/assurance templates и mapping по контракту. Не читать sibling conclusions.

Прочитай safe source/manifests/.env.example, auth guards/strategies/services, session/browser clients, serializers/media serving, infrastructure and CI definitions, dependency/lock metadata и tests. Документы policy сверяй с DEC-001–006; не читай secret values.

## Required evidence

Построй bounded threat/credential matrix: actor/entry → auth/owner policy → storage/data/output → deny path → impact/preconditions. Проследи logout/refresh/revocation и password-change applicability, data flow к client bundle/logs/direct URL. Для secret risk фиксируй path/category/reference и безопасную структуру, никогда значение. Unproven reachability остаётся Proposed.

Записать paths/symbols/lines на frozen SHA, source expected invariant, actual check results и limitations. Все finding candidates Proposed; direct evidence не заменяет independent confirmation. Assurance/best practices только Candidates.

## Checklist mapping

Primary routing sections: **25–26, 28–29, 35–38, 40, 50–56, 58–65, 67–70, 72–73, 98** по [next-system overlay](../../../05-AUDIT-CHECKLIST-MAPPING.md#next-system-routing-overlay-2026-10-08). Это назначение тем, не автоматическое разрешение полного runtime scope. Читать assigned subsections и явные neighbor references; в report дать disposition каждого assigned ID/subscope.

## Finding ID prefix/range

Default prefix: **SEC**. Coordinator перед запуском задаёт unused disjoint numeric range; здесь номера не резервируются. Другой primary domain требует заранее выделенного диапазона; missing/exhausted range → BLOCKED, без renumber/registry writes. Neighbor impacts связывай, не дублируй причину.

## Allowed read-only operations

Scoped safe source/config/schema/test/CI reading, rg/rg --files, read-only Git и verified CodeGraph operations из Shared Contract. CodeGraph unavailable/misbound → source search с limitation; проверки с записью/внешним доступом не разрешены.

## Forbidden operations

Source/test/config/dependency/doc edits вне собственного report; commit/push/PR; registry writes; runtime/tests/build/generate/install/scanners; Docker/DB/migrations/seeds; active security/fault/mutation/destructive operations; real secrets/PII; automatic cleanup/worktree repair.

## STOP conditions

Все gates Shared Contract: SHA/root/clean-tree mismatch, unexpected write, destructive requirement, ambiguous runtime target, missing critical evidence, provisional P0/P1, scope expansion, unresolved DEC, secrets/PII или evidence conflict. Немедленно остановить worker, сохранить safe output только при verified target и уведомить Coordinator; P0/P1 provisional → Astra, без self-confirmation.

На possible secret/PII прекрати чтение/вывод и сообщи только безопасную категорию; provisional P0/P1 немедленно BLOCKED → Coordinator → Astra. Critical неизвестная revocation/privacy/crypto policy требует owner decision, а не assumed exploit.

## Output report path template

`docs/audits/yuni-2026-09/passes/<RUN_ID>/security-deep-dive.md` внутри отдельного verified worktree. Только назначенный report и необходимые parent directories; no overwrite. Полная структура report, fingerprint, coverage dispositions и final Git/whitespace checks — Shared Contract.

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

[Network](05-NETWORK-EDGE.md) — connectivity/exposure; [DevOps](08-DEVOPS-CI-SUPPLY-CHAIN.md) — delivery/config/provenance; [Frontend](03-FRONTEND.md) — browser implementation; [Database](02-POSTGRESQL-PRISMA.md) — mechanics; [Consistency](07-CONSISTENCY-IDEMPOTENCY.md) — race; [Testing](06-TEST-RELIABILITY.md) — protection.

## N/A / NOT VERIFIED rules

Password-change/WSS/admin/keys delivery проверяй через presence gate; отсутствие функции/optional mechanism не доказательство bypass. Secrets не обнаружены ≠ доказано их отсутствие; реальная key rotation/SQL exposure/runtime exploitability без разрешённой проверки — NOT VERIFIED.

`N/A — absence verified` требует bounded presence search/code-manifests-wiring evidence на CODE_AUDIT_SHA. Unknown/неисполненную проверку сохраняй NOT VERIFIED/BLOCKED, не N/A или PASS; optional absence не finding.
