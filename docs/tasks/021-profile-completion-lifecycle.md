# Task 021 — Profile completion lifecycle

## ID

021

## Название

Profile completion lifecycle

## Статус

done

## Приоритет

P0

## Owner

Project owner

## Executor

Codex

## Reviewer

Independent blind AI reviewer before merge

## Создана

2026-07-20

## Последнее обновление

2026-07-20

## Связанный audit finding / ADR / PR

- Task 000 / PR #24 established the documentation and review workflow.
- Diagnostic finding: `profiles.completed_at` has no writer while Discovery requires it.

## Проблема

`Profile.completedAt` is nullable, has no default and has no writer in registration,
profile updates or media mutations. Discovery requires a non-null value, so otherwise
valid users cannot enter discovery. The frontend independently reports completion from
a different set of fields and any photo, creating a second source of truth.

## Цель

Make profile completion a computed backend state shared by self-profile responses and
Discovery, remove the unused stored gate, and prove the complete lifecycle against a
real PostgreSQL database.

## Зависимости

- Task 000 — done.

## Блокирует

- Reliable Discovery onboarding behavior.

## Затрагиваемые модули

- profiles;
- discovery;
- media;
- Prisma migrations;
- self-profile API and frontend progress UI;
- backend unit and PostgreSQL e2e tests.

## Разрешённый scope

- A single profile-completion policy for seven required fields and one qualifying photo.
- Computed `completion` in self-profile responses.
- Replacement of the Discovery `completedAt` gate.
- Removal of `profiles.completed_at` and addition of nullable-string invariants.
- Frontend consumption of the server percentage.
- Task-specific real-PostgreSQL e2e coverage and related documentation.

## Явно запрещённый scope

- Canonical enums or backfill for `gender` and `lookingFor`.
- Changes to visibility, privacy, owner checks, blocks, reports or rate limits.
- Pending media moderation, image processing, storage/CDN changes.
- Docker, CI/CD or production deployment changes.
- Changes to `ChatGame.completedAt`.

## Факты

- Registration writes `displayName` and `birthDate` but not `completedAt`.
- Profile and media writes do not write `completedAt`.
- Current Discovery requires `completedAt: { not: null }`.
- Current upload auto-approves and publishes photos; delete reassigns primary.
- Production deployment is not implemented.

## Принятые решения

- Completion has eight equal gates in stable order: `displayName`, `birthDate`,
  `bio`, `gender`, `lookingFor`, `city`, `country`, `photo`.
- Percentage is `Math.round(completed / 8 * 100)`.
- Required strings use a trimmed non-empty predicate.
- A qualifying photo has non-null `publicUrl`, approved moderation and non-null
  `publishedAt`; primary status is not a gate.
- `isDiscoverable` and privacy settings are visibility gates, not completion gates.
- `profiles.completed_at` is dropped rather than renamed because it has no historical
  consumer or writer.
- PostgreSQL e2e remains a task-local gate; CI orchestration remains Task 026.
- Temporarily, any non-empty `gender`/`lookingFor` string is accepted. Canonical enums,
  migration/backfill and fixed frontend selects require a separate task.

## Открытые вопросы

None for implementation.

## Инварианты

- TypeScript calculation and Prisma filtering express the same completion rule.
- Nullable required strings are null or trimmed-non-empty at the database boundary.
- Completion is never persisted and needs no mutation-time recalculation.
- Safe serializers never expose raw Prisma rows or media storage internals.

## Security checks

- Preserve `CurrentUser` ownership and all existing owner checks.
- Preserve privacy, block/report filters and rate limits.
- Use only synthetic users/photos in tests.
- Do not expose `storageKey`, filesystem paths, secrets or PII.

## Scope-check

This task touches profiles, discovery, media, database/migrations and API behavior and
therefore requires the full process.

## Подтверждение scope-check

Кто подтвердил: project owner

Дата: 2026-07-20

Формат подтверждения: explicit confirmation in the implementation request.

## План реализации

1. Add the shared policy and database migration.
2. Return computed completion from profile/media self responses and consume the shared
   query fragment in Discovery.
3. Replace frontend local calculation with the backend contract.
4. Add unit and guarded real-PostgreSQL e2e coverage.
5. Synchronize related project, API, database, security and testing documentation.
6. Run quality gates and independent blind review.

## План проверки

- `corepack pnpm check:backend`
- `corepack pnpm --filter backend test:e2e` with a guarded `TEST_DATABASE_URL`
- `corepack pnpm check:frontend`
- `git diff --check`
- expected changed/untracked file checks from `docs/QUALITY_GATES.md`

## Ручные проверки

- Inspect self response and profile progress bar at incomplete and complete states.
- Inspect the generated Discovery Prisma predicate for preserved visibility/security gates.

## Definition of Done

- No profile-level `completedAt` reference remains.
- Self-profile and media profile responses return the computed contract.
- Discovery uses the shared predicate and supports complete→incomplete→complete transitions.
- Unit and real-PostgreSQL e2e tests pass.
- Backend/frontend checks pass and blind review has no unresolved findings.
- Documentation reflects actual behavior.

## Документация для обновления

- `AI_CONTEXT.md`, `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/FEATURES.md`;
- API, architecture, database, security and testing documentation listed in the task plan.

## Evidence после выполнения

- Backend unit: 18 suites / 183 tests passed.
- Backend build and TypeScript lint passed.
- Prisma generate passed; all migrations deployed to a disposable PostgreSQL 16 test database.
- Real-PostgreSQL HTTP e2e lifecycle passed.
- Frontend lint/typecheck/build passed with pre-existing warnings and no errors.
- `git diff --check` passed.
- `AGENTS.md` and `docs/QUALITY_GATES.md` are unchanged because Task 021 does not change global workflow, security rules, documentation structure or global gates; its PostgreSQL e2e command is task-specific.
- Independent blind review completed: T021-01 (medium), T021-02 (low) and T021-03 (low) were fixed in `852c67f`, confirmed `resolved`, with no new findings.

## Не проверялось

- Production rollout and production data migration.
- CI-hosted PostgreSQL integration checks (Task 026).

## Known limitations

- `gender` and `lookingFor` remain free text until a separate canonical-enum task.
- Media upload remains immediate approve/publish until Task 023.

## История статуса

- 2026-07-20: created and moved to `in_progress` after owner scope confirmation.
- 2026-07-20: implementation and required checks completed; moved to `review`.
- 2026-07-20: all blind-review findings resolved and rechecked; moved to `done`.
