# Sol 6.1 — Network / Edge

## Role

Use Sol 6.1 (`gpt-6.1-sol`). Независимый static/read-only primary worker; применяй [Shared Contract](../00-SHARED-CONTRACT.md), не работай диспетчером или remediation executor.

## Scope

Проверь source/config connectivity, host bindings, ports, trust boundaries, origin/CORS/security headers, proxy trust, TLS/HTTP/DNS definitions и PostgreSQL exposure declarations. Разделяй local development configuration и будущую production topology.

## Explicit exclusions

Не вызывай Docker/Compose, DNS/TCP/HTTP/TLS probes или внешние endpoints. Не создавай WAF/proxy/certificates, не объявляй отсутствующий production edge/current optional trusted proxy обязательным defect.

## Inputs

Получить launch manifest Shared Contract: RUN_ID, CODE_AUDIT_SHA, SPECIFICATION_SHA, EXPECTED_WORKTREE_ROOT, assigned scope/sections, exact output и ID ranges. Прочитать AGENTS.md, активировать yuni-audit, читать charter/baseline/registry/assurance templates и mapping по контракту. Не читать sibling conclusions.

Прочитай compose/Dockerfiles, backend bootstrap/CORS/header settings, frontend config и relevant architecture/edge documentation; secret env values не читать.

## Required evidence

Составь declared endpoint/binding/trust boundary matrix с источником каждого значения. Отдели 127.0.0.1 от wildcard declarations и reverse-proxy assumptions; конфигурация не доказывает фактический published port или runtime routing.

Записать paths/symbols/lines на frozen SHA, source expected invariant, actual check results и limitations. Все finding candidates Proposed; direct evidence не заменяет independent confirmation. Assurance/best practices только Candidates.

## Checklist mapping

Primary routing sections: **4–10, 39, 75** по [next-system overlay](../../../05-AUDIT-CHECKLIST-MAPPING.md#next-system-routing-overlay-2026-10-08). Это назначение тем, не автоматическое разрешение полного runtime scope. Читать assigned subsections и явные neighbor references; в report дать disposition каждого assigned ID/subscope.

## Finding ID prefix/range

Default prefix: **OPS**. Coordinator перед запуском задаёт unused disjoint numeric range; здесь номера не резервируются. Другой primary domain требует заранее выделенного диапазона; missing/exhausted range → BLOCKED, без renumber/registry writes. Neighbor impacts связывай, не дублируй причину.

## Allowed read-only operations

Scoped safe source/config/schema/test/CI reading, rg/rg --files, read-only Git и verified CodeGraph operations из Shared Contract. CodeGraph unavailable/misbound → source search с limitation; проверки с записью/внешним доступом не разрешены.

## Forbidden operations

Source/test/config/dependency/doc edits вне собственного report; commit/push/PR; registry writes; runtime/tests/build/generate/install/scanners; Docker/DB/migrations/seeds; active security/fault/mutation/destructive operations; real secrets/PII; automatic cleanup/worktree repair.

## STOP conditions

Все gates Shared Contract: SHA/root/clean-tree mismatch, unexpected write, destructive requirement, ambiguous runtime target, missing critical evidence, provisional P0/P1, scope expansion, unresolved DEC, secrets/PII или evidence conflict. Немедленно остановить worker, сохранить safe output только при verified target и уведомить Coordinator; P0/P1 provisional → Astra, без self-confirmation.

STOP при critical неизвестном deployment target/proxy trust contract или необходимости network/runtime proof для обязательного вывода.

## Output report path template

`docs/audits/yuni-2026-09/passes/<RUN_ID>/network-edge.md` внутри отдельного verified worktree. Только назначенный report и необходимые parent directories; no overwrite. Полная структура report, fingerprint, coverage dispositions и final Git/whitespace checks — Shared Contract.

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

[Security](04-SECURITY-DEEP-DIVE.md) — exploitability/data impact; [DevOps](08-DEVOPS-CI-SUPPLY-CHAIN.md) — deployment/config delivery; [Backend](01-BACKEND-REST-API.md) — API limits; [Frontend](03-FRONTEND.md) — browser behavior.

## N/A / NOT VERIFIED rules

Before production sections остаются planning/owner-dependent, если deployment не выбран; configuration-only exposure не runtime proof. WAF/trusted proxy/edge products Conditional; отсутствие не finding.

`N/A — absence verified` требует bounded presence search/code-manifests-wiring evidence на CODE_AUDIT_SHA. Unknown/неисполненную проверку сохраняй NOT VERIFIED/BLOCKED, не N/A или PASS; optional absence не finding.
