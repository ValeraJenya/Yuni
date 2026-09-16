# Architecture addendum integration — 2026-09-16

## Scope and provenance

Documentation-only integration of owner-supplied `YUNI_ARCHITECTURE_ADDENDUM_2026-09-16.md` and `CODEX_PROMPT_INTEGRATE_YUNI_ARCHITECTURE_2026-09-16.md`. This record is the scope/evidence/coverage report, not another topology source, an audit finding or an accepted infrastructure ADR.

- Code/config baseline: `8092c1aa0a1ddfc15ec368c8f05a306fc2e9e993` (`chore/pre-audit-setup`). Initial working tree was clean.
- Addendum SHA256: `F3CF41A786567F5A5EC1BA4BB5DBD5303A75DCC8BE65EBE16A2C9C92B2524D61`.
- Task input SHA256: `33AEE6D6DC2BCBD2564C84BC067D712E82D539769CEB96B061D1E857FEDCD771`.
- Owner scope: integrate today's architecture documentation and commit/push the branch; PR/merge stays with owners.
- Runtime changes: **none — documentation only**. No Docker, migrations, DB calls, application tests, live infrastructure inspection or RV runs.
- Status vocabulary is defined once in [Architecture](./README.md). CURRENT below means static repository evidence at the baseline; TARGET/PROPOSED do not imply implementation.

## Files and source-of-truth routing

| File | Change / reason | Status |
| --- | --- | --- |
| `AGENTS.md` | Architecture status/source routing for future agents | Documentation convention |
| `AI_CONTEXT.md` | Link dated evidence; correct the claim that frontend tests are absent | CURRENT static inventory / historical snapshot retained |
| `docs/PROJECT_STATE.md` | Link separate architecture snapshot without relabelling old baseline | CURRENT static scope |
| `docs/ROADMAP.md` | Link requirements to existing 023/025 and open future choices | TARGET / PROPOSED |
| `docs/README.md` | Discoverable learning entry | Documentation navigation |
| `docs/architecture/README.md` | Correct Prisma authority; status vocabulary and document index | CURRENT / status definitions |
| `docs/architecture/program-flow-map.md` | Current request/media diagrams, visibility boundaries, corrected delete order | CURRENT / OPEN |
| `docs/architecture/domain-model.md` | Ownership, identifiers, missing roles/attachments/finance | CURRENT / OPEN |
| `docs/architecture/scaling-roadmap.md` | Target entry, WSS, media choices, Redis gate, optional orchestration/capacity | TARGET / PROPOSED / OPEN |
| `docs/architecture/financial-flow.md` | New source because no financial architecture exists | PROPOSED / OPEN |
| `docs/security/README.md` | Private network/ID boundaries; separate invariant from Redis vendor choice | TARGET / CURRENT limitations |
| `docs/knowledge/README.md` | New compact learning guide; no existing knowledge section found | Educational, linked to authoritative docs |
| This file | Scope, coverage, evidence and unresolved decisions | Documentation evidence |

Allowed new/untracked files are exactly this record, `financial-flow.md` and `docs/knowledge/README.md`, for the reasons above. Do not copy raw source addenda into a second architecture tree. Existing ADRs, audit reports/registries, validation decisions, production code/config and `docs-site` snapshots are outside this change. No new operations directory is necessary: load balancing/capacity choices already belong in Scaling Roadmap. AGENTS is updated because documentation navigation and status conventions changed.

## Evidence table

Paths below are relative to the repository root. Confidence **high** applies to the inspected static artifact only; absence across scoped files is **medium**, never proof about external deployment.

| Statement | Code/config evidence and observed behavior | Confidence |
| --- | --- | --- |
| CURRENT local single backend + PostgreSQL + frontend | `docker-compose.yml`: three services, direct published ports; no app proxy; `main.ts`: `bootstrap`, `app.listen` | High |
| Browser uses REST API | `apps/frontend/lib/auth-api.ts`: `API_BASE_URL`, `buildUrl`, `fetch`; backend `*.controller.ts`: decorators for `/auth`, `/chat`, `/profiles`, `/media/profile-photos` | High |
| No global `/api`, explicit TLS/proxy/shutdown config in bootstrap | `apps/backend/src/main.ts`: no `setGlobalPrefix`, `httpsOptions`, `trust proxy`, `enableShutdownHooks` | High for this file; external edge OPEN |
| Media bytes are local; DB owns metadata | `modules/media/media.module.ts`: `useClass: LocalProfilePhotoStorageService`; adapter `saveProfilePhoto`: `writeFile`; Prisma `ProfilePhoto` | High |
| Known photo URL bypasses profile visibility filtering | `main.ts`: `useStaticAssets`, one-hour `maxAge`; `media.constants.ts`: public path; no DB lookup in static route | High static; no fresh runtime claim |
| Delete is file-first, not best effort | `MediaService.deleteProfilePhoto`: awaited storage delete before Prisma transaction; adapter rethrows non-ENOENT errors | High |
| IDs and ownership are distinct | Prisma `User`, `ProfilePhoto`, `Message`, `RefreshToken`: UUID defaults; `Profile.userId`; participant composite PK; `common/security/access-control.ts`; `MediaService.assertOwner` calls | High |
| Chat persistence exists; binary attachments are absent | Prisma `Message.body`, `voiceDurationSec`; `ConversationParticipant`; `modules/chat` controllers/service; no attachment storage model | High for schema; medium absence of upload flow |
| Rate-limit state is process-local | `common/rate-limit/rate-limit.service.ts`: `RateLimitService.buckets = new Map` | High |
| Session persistence does not imply immediate access-token revocation | `modules/auth/guards/jwt-access.guard.ts`: JWT verification; Prisma `RefreshToken` is separate | High static; policy/runtime OPEN |
| DB health check exists | `modules/health/health.service.ts`: `HealthService.getHealth`, `SELECT 1`; not executed in this task | High |
| WSS, Redis, S3, queues, financial services and roles are not implemented in inspected app | `app.module.ts`, backend/frontend `package.json`, Prisma models, backend source searches: no gateway/adapter/payment/role models | Medium, repository scope only |
| Image publishing differs from deployment | `.github/workflows/application-images.yml`: build/push GHCR; `hugo-deploy.yml`: docs site | High for workflow behavior; external deployment OPEN |

Discovery used `rg --files` for architecture/security/database/testing/audit/ADR and infra/deployment paths, `rg -n` for controller decorators, WebSocket/Socket.IO/Redis/S3/queue/payment/ledger/UUID symbols, then opened matching schema/config/code. Missing `docs/operations` and `docs/knowledge` were recorded as absent directories, not product defects. Frontend sources are under `app`, `features`, `lib`, not `src`; searches were corrected to those roots. No secrets or live user data were used.

## Addendum coverage

Each source section is preserved as a routed requirement, not duplicated prose.

| Source sections | Authoritative destination | Disposition |
| --- | --- | --- |
| 1–4: main, initial, scaled and common LB flow | Program Flow Map; Scaling Roadmap | CURRENT local flow; TARGET entry/scaling; product choices OPEN |
| 5–6: L3/L4/L7 and HTTP/TLS | Knowledge; Security network boundaries | Concepts separated; deployed versions OPEN |
| 7: S3 and upload | Program Flow Map; Scaling Roadmap media section | CURRENT local adapter; provider/upload/CDN OPEN |
| 8: users/photos/roles/chat | Domain Model ownership table | Actual Prisma ownership; absent entities explicit |
| 9–10: WSS and Redis | Scaling Roadmap delivery design and candidate gate | NOT IMPLEMENTED / PROPOSED |
| 11: Kubernetes | Scaling Roadmap; linked Knowledge | Optional, NOT IMPLEMENTED / PROPOSED |
| 12: IPv4/IPv6/NAT/firewall | Security network boundaries | TARGET validation requirements, live topology OPEN |
| 13: UUID | Domain Model | CURRENT defaults/constraints; alternatives OPEN |
| 14–20: Golden User, economics, state/ledger, consistency, fan-out, fraud | Financial Flow; Scaling Roadmap capacity section | PROPOSED conditional finance; no fees/legal rules invented |
| 21: CURRENT vs TARGET | Architecture index | Shared vocabulary, audit/task statuses unchanged |
| 22: document topics | Architecture index and routing table above | Existing sources reused; three new Markdown files only |
| 23: open decisions | Scaling Roadmap; Financial Flow | No accepted ADR fabricated |
| 24: acceptance criteria | This coverage/evidence record and diagrams | Documentation coverage, not proof of runtime correctness |

Five diagrams cover CURRENT request flow, TARGET scaled flow, CURRENT upload/media, PROPOSED WSS multi-instance delivery and PROPOSED gift/balance/payout states. No picture introduces a CURRENT optional technology.

## Conflicts resolved and limits

- Architecture index incorrectly pointed at historical SQL as authority: aligned with Prisma schema/migrations and existing database docs.
- Media delete map/security text still described best-effort cleanup: aligned with file-first `MediaService.deleteProfilePhoto`; upload-failure cleanup remains best effort.
- Domain wording could imply a deployed object store or omit staged-chat metadata: clarified local adapter and metadata-only voice support.
- Security wording made Redis compulsory for production: retained the cross-instance anti-abuse invariant while leaving technology selection OPEN.
- AI context said frontend tests were absent: corrected static presence; no new test counts or test results are claimed.
- Historical task/state snapshots and audit conclusions are not revalidated wholesale. Current direct media URL policy is not “fixed” by target private-storage prose. No broad new findings or assurances are created.

## Gaps and recommended decisions

Owners still need deployment/DNS/TLS/trusted-proxy and availability targets; actual public/private IPv4/IPv6 inventory; upload/provider/CDN/private URL policy; WSS and session revocation semantics; measured Redis/queue need; whether finance belongs in product; ledger/accounting/provider/risk policy. Existing DEC-001–DEC-006 stay Pending or at their recorded status; this task does not decide them.

Potential ADRs, only after evidence and a real decision: deployment/edge, storage/upload, WSS transport, shared limiter/Redis introduction, identifier changes if needed, and financial ledger model. Kubernetes adoption is not a prerequisite. Legal/compliance and provider obligations require separate specialist review. New requirements should become separately scoped implementation tasks rather than changes to existing runtime during this integration.

## Validation

Required checks: `git diff --check`, changed/untracked allowlist, relative Markdown file-link validation for changed documents, independent blind review against task inputs and primary source, then staged scope check and commit/push to the working branch. Backend/frontend tests and Docker are not applicable to this docs-only change. Review issues must be addressed before publication; no runtime gate is reported as newly passing.

Results (2026-09-16): `git diff --check` PASS; all 13 changed/new files match the Markdown allowlist; relative file-link targets exist; strict UTF-8 decoding PASS; five Mermaid diagram blocks present. Independent blind reviewer `architecture_integration_blind_review` checked the diff against both task inputs, primary sources and ADR/DEC boundaries: **Approve**, no actionable issues. Review did not execute runtime checks or validate live network behavior. Diagram syntax/layout was inspected as Markdown; no graphical renderer was run.
