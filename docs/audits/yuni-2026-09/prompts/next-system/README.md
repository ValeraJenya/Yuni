# Yuni — next-system audit specifications

Prepared: 2026-10-08. This is the approved role/specification structure, not a launched audit or automatic agent registration. No CODE_AUDIT_SHA has been selected here. Historical Wave 1 retains its original specifications, reports, SHA and review decisions.

## Roster and model routing

| Role | Model | Specification | Report slug |
| --- | --- | --- | --- |
| Lightweight Coordinator | Sol 6.1 (`gpt-6.1-sol`) | [Coordinator](01-COORDINATOR.md) | coordinator |
| Audit Architect / Escalation / Final Synthesis | Astra (`gpt-6-astra`) | [Astra Architect](02-ASTRA-ARCHITECT.md) | astra-synthesis |
| Backend / REST API | Sol 6.1 (`gpt-6.1-sol`) | [Backend](workers/01-BACKEND-REST-API.md) | backend-rest-api |
| PostgreSQL / Prisma | Sol 6.1 (`gpt-6.1-sol`) | [Database](workers/02-POSTGRESQL-PRISMA.md) | postgresql-prisma |
| Frontend | Sol 6.1 (`gpt-6.1-sol`) | [Frontend](workers/03-FRONTEND.md) | frontend |
| Security Deep-Dive / Data Protection & Secrets | Sol 6.1 (`gpt-6.1-sol`) | [Security](workers/04-SECURITY-DEEP-DIVE.md) | security-deep-dive |
| Network / Edge | Sol 6.1 (`gpt-6.1-sol`) | [Network](workers/05-NETWORK-EDGE.md) | network-edge |
| Test Reliability | Sol 6.1 (`gpt-6.1-sol`) | [Testing](workers/06-TEST-RELIABILITY.md) | test-reliability |
| Consistency / Idempotency | Sol 6.1 (`gpt-6.1-sol`) | [Consistency](workers/07-CONSISTENCY-IDEMPOTENCY.md) | consistency-idempotency |
| DevOps / CI / Supply Chain | Sol 6.1 (`gpt-6.1-sol`) | [DevOps](workers/08-DEVOPS-CI-SUPPLY-CHAIN.md) | devops-ci-supply-chain |
| Documentation Drift | Sol 6.1 (`gpt-6.1-sol`) | [Documentation](workers/09-DOCUMENTATION-DRIFT.md) | documentation-drift |
| Static Performance | Sol 6.1 (`gpt-6.1-sol`) | [Performance](workers/10-STATIC-PERFORMANCE.md) | static-performance |

Read [Shared Contract](00-SHARED-CONTRACT.md) and the selected role only. Model routing is a launch requirement: verify the assigned model; do not silently substitute. These Markdown files create no executable agent definitions, tools, runtime or permissions.

## Preparation and launch boundary

1. Approve specs and independent blind review separately from authorizing audit execution.
2. At launch, select one full CODE_AUDIT_SHA and a SPECIFICATION_SHA containing approved specs. Supply RUN_ID, exact worktree roots, scopes, report paths and disjoint ID ranges.
3. Coordinator verifies frozen targets and prepares independent contexts/worktrees. Start at most **3 primary workers simultaneously**, reduced further when available slots require it. Coordinator counts toward available agent slots; Astra is on-demand and must fit the same capacity.
4. Collect only six-field result envelopes; stop pipeline on blockers/conflicts/provisional P0/P1. Do not expose sibling conclusions to unfinished primary workers.
5. After all independent primary outputs, invoke Astra for final synthesis. Integration and remediation require separate owner-authorized tasks; this system grants no commit/push.

Default groups after launch approval: Backend/Database/Frontend; Security/Network/DevOps; Testing/Consistency/Static Performance; Documentation. These are scheduling suggestions, not dependency-free proof or automatic launch. Reorder/reduce scope according to owner decisions; all workers use the same frozen code SHA.

## Conditional activation gates

| Direction | Static presence prerequisite | Runtime prerequisite |
| --- | --- | --- |
| Financial / Payments / Ledger | Actual financial code/schema/provider wiring, not a future diagram | Separate financial scope, synthetic providers/data and explicit permitted operations |
| AI / LLM Security & Evals | Product AI implementation and actual model/tool/data flow | Separate safe scope, synthetic inputs, provider/data/cost controls and owner authorization |
| WSS runtime | Gateway/client/protocol/dependency/config wiring | Separate isolated WSS target, auth scenarios and authorized operations |
| Redis runtime | Redis consumers/dependencies/config wiring | Separate owned Redis target and approved safe operations |
| Kubernetes runtime | Actual manifests/deployment wiring | Separate safe cluster/namespace/context and explicit operation approval |

All remain CONDITIONAL until evidence establishes applicability. No separate conditional runtime specs are created here. Runtime activation is never implied by presence; missing optional technology is not a finding. Queues/replicas/mobile follow the same rule.

## Reuse and coverage

- Reuse Wave 1 safety, evidence, independence and source-reopening methods. Do not reuse its historical SHA, output paths or conclusions as current proof; never rewrite original reports/specs.
- [Mapping overlay](../../05-AUDIT-CHECKLIST-MAPPING.md#next-system-routing-overlay-2026-10-08) assigns each master section 0–124 exactly one routing owner. Secondary cross-references do not create duplicate findings or grant full neighboring scope.
- Coordinator covers governance and records owner-policy dependencies; Astra covers architecture and cross-agent synthesis. Static Performance cannot close load/capacity evidence; runtime-only subchecks remain NOT VERIFIED/BLOCKED or separately deferred by owners.
- Section ownership is planning coverage, not executed coverage. Each report states subsection dispositions, especially conditional technologies and runtime-only checks; audit completion must not be claimed from roster completeness.
- Charter/baseline/mapping reviews, registry reviews and spec safety reviews remain one-off blind-review tasks. Skills are reusable instructions; role specs define a pass. `yuni-refactor` is not an audit worker.

## Independent security follow-up

[Codex Security](followups/CODEX-SECURITY.md): Threat Model → Deep Security Scan → Validation → reconcile findings. It follows the main technical audit, needs separately confirmed tooling/scope and does not replace mandatory Security Deep-Dive or historical Wave 1 Security/Data Integrity.
