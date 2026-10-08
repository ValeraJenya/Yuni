# Codex Security — future independent follow-up

Prepared: 2026-10-08. Future workflow only; do not launch tooling, scans or validation while preparing this specification. This is not a Sol worker and does not replace [Security Deep-Dive](../workers/04-SECURITY-DEEP-DIVE.md) or historical Wave 1 Security/Data Integrity.

## Activation and prerequisites

Require main technical audit and Astra synthesis artifacts (or an explicit owner decision on remaining blockers), frozen CODE_AUDIT_SHA, separately verified Codex Security availability/access, owner-approved scope/data boundary, independent context/worktree, exact output and disjoint SEC ID range. Tool availability and model routing must be confirmed at activation; do not invent an installed provider or silently substitute.

Apply [Shared Contract](../00-SHARED-CONTRACT.md), Yuni privacy rules and current DEC dependencies. Presence of this file, a plugin or an accepted environment does not authorize repository upload, external provider calls or active testing. Require explicit approval for data transfer and each additional operation.

## Threat Model → Deep Security Scan → Validation → reconcile findings

1. **Threat Model:** map actual assets, entry points, trust boundaries, actors and abuse cases from primary source at the frozen SHA. Distinguish deployed/current behavior from future architecture.
2. **Deep Security Scan:** execute only the separately approved tool scope; exclude secrets/PII and ordinary Yuni runtime. If tooling/data-access permission is missing, BLOCKED; do not install or configure automatically.
3. **Validation:** reopen source for scan candidates; mark unproven exploitability NOT VERIFIED. Runtime/exploit validation requires a new explicit safe task/environment/operations approval; this document grants none. Never use real credentials/user data or attack production/staging.
4. **Reconcile:** compare independent results with Yuni findings only after primary analysis. Preserve stable IDs and merged/rejected provenance; propose new SEC candidates in allocated ranges. Astra reviews P0/P1/conflicts; central registry integration needs a separate owner-authorized stage.

## Output and STOP

Future assigned report template: `docs/audits/yuni-2026-09/passes/<RUN_ID>/codex-security.md`. Record fingerprint/tool/source, threat model, scan scope/data boundary, candidates/evidence, validation actually performed vs proposed, duplicates/merges, blocked checks and limitations. Return the six-field Shared Contract envelope.

STOP on SHA/scope mismatch, missing critical evidence/tool prerequisite, unapproved data transfer, ambiguous runtime target, secret/PII, destructive action, unresolved DEC or provisional P0/P1. No fixes, registry writes, commit/push or runtime authorization are included. This future follow-up remains separate from the ten-worker launch.
