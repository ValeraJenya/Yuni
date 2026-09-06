# Wave 1 — Test Reliability

## Scope and result

Read-only primary pass по `prompts/wave-1/02-TEST-RELIABILITY.md`, repo-skill `yuni-audit`.
Checked commit: **fed276a97fd84f29032c5eac1b11447bb1f3ed4c**.
Статический анализ обязательной выборки завершён. Текущий test execution **BLOCKED**, не PASS.
Предложены четыре findings, все **Proposed**, без независимого подтверждения. Production defects и работоспособность PostgreSQL этим отчётом не подтверждаются.

Разрешённый output — только этот файл. Source/tests/configuration/registries не изменялись. Commit, mutation/fault injection, exploit tests, dev-серверы, установка пакетов и обращения к БД не выполнялись. Sibling Wave 1 reports/conclusions не читались; Synthesis не запускался.

## Fingerprint and preflight

| Parameter | Evidence |
| --- | --- |
| Date/timezone | 2026-09-06, Europe/Moscow, UTC+03:00; инструментальный timestamp 23:49:34 и повторная сверка 23:57:30 |
| Audit tag | `audit/yuni-2026-09-wave1` |
| EXPECTED_AUDIT_SHA | `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`, передан координатором через владельца |
| HEAD / tag commit | Оба равны EXPECTED_AUDIT_SHA |
| EXPECTED_WORKTREE_ROOT | `D:\Yuni-audit-testing`, передан координатором, не выведен из CWD |
| Actual root | `D:/Yuni-audit-testing`; `Get-Item` не показывает junction/symlink для root |
| Worktree | Git dir `D:/Yuni/.git/worktrees/Yuni-audit-testing`; выделенный linked worktree, не общий checkout |
| Branch | detached HEAD; `git branch --show-current` — пустой вывод |
| Initial status | `## HEAD (no branch)`; `git status --porcelain=v1` пуст |
| Existing output | `Test-Path` вернул False |
| OS | `Microsoft Windows 10.0.26200`, PowerShell |
| Node | `v24.19.0` |
| pnpm | **Unknown/BLOCKED**: `pnpm --version` завершился Corepack EPERM при чтении tooling metadata; окружение не исправлялось |
| Dependencies | `node_modules`, `apps/backend/node_modules`, `apps/frontend/node_modules` отсутствуют |
| CodeGraph | Symbol search доступен; version/profile/workspace context API не предоставлены доступным набором tools. **Binding BLOCKED**, graph evidence исключено |
| IDs | Владелец подтвердил `TEST-001–TEST-020` в этом conversation; использованы 001–004 |

Первый запуск был остановлен до анализа из-за отсутствующих expected values. После их явной передачи frozen-target проверки повторены и пройдены. Ошибка pnpm fingerprint блокирует получение версии и зависимые запуски, а не разрешённый статический аудит (§7, §17 specification).

Исторический baseline `02-BASELINE.md` проверял **80de2c161f58e821d28bf2eb1d0a6ff7fd6329aa**. `git diff --stat <baseline> HEAD`: 14 файлов, только audit documents/inputs/specifications и repo-skills; production code, tests, manifests и lockfiles не изменены. Исторические 20 suites / 220 backend tests и 8 suites / 60 frontend tests — результаты прежнего запуска, не текущего. Исторический Docker blocker не перепроверялся запуском Docker: подтверждённой отдельной БД для этого pass нет.

CodeGraph вызван с `query="AuthService", compact=true, limit=3`. Он вернул CodeFile `D:\Yuni-audit-testing\apps\backend\src\modules\auth\auth.service.ts` и module entries без пути; semantic embeddings ещё строились. Файл и `AuthService` проверены в локальном source. Одного совпадения пути недостаточно для workspace binding по §12: project/workspace context API отсутствует. Поэтому результаты поиска не использованы как доказательство связей. Fallback — `rg`, `git ls-files`, чтение source на frozen HEAD.

### Safety assessment before execution

- Прочитаны root/backend/frontend `package.json`, обе backend Jest configs, frontend Jest config, e2e bootstrap, `.husky/commit-msg`, quality-gates workflow и исторический baseline.
- Root `prepare` запускает Husky; install не разрешён. Backend test script — Jest `--runInBand`, frontend — Jest; отсутствующие зависимости не устанавливались.
- E2e globalSetup выполняет `prisma migrate deploy`, наследует env и выбирает `TEST_DATABASE_URL ?? DATABASE_URL`; suffix `_test`/`_ci` не доказывает изоляцию. Suites создают HTTP listener, DB fixtures, а две suites — файлы фото. **Не запускать в этом worktree**.
- Next typecheck включает `next typegen`; build/Prisma generate создают artifacts. Исторический baseline отмечает изменение `next-env.d.ts`. Эти команды не запускались.
- `.env`, реальные credentials, PII, uploads и dumps не открывались. Прочитанные fixtures — synthetic source. Полный environment не выводился.
- Неожиданных изменений по промежуточным Git checks не обнаружено. `AGENTS.md` не менялся: pass не меняет workflow, gates, security rules или документационную структуру проекта; его output прямо разрешён specification.

## Checklist coverage

Master input SHA256 по mapping: `44FD1F11FA3953AF03E51C8EFD6233996F1C51C58193ABC106BB252BEBF51B6E` (значение mapping, заново hash не вычислялся).
Прочитаны только sections **21, 35, 37, 62, 70, 73, 93, 94, 95, 96, 117**, каждое до следующего `# <number>.` heading. Дополнительные master sections не читались. Сначала использованный фильтр `##` не извлёк sections; после проверки heading format он исправлен на `#`. Полный master не выводился.

| IDs | Выполненный срез / disposition |
| --- | --- |
| 93 | Assertions, mocks, negative controls, shared fixtures, order/time dependence; findings 001–004 |
| 95 | Unit/HTTP/DB/contract/concurrency inventory; runtime BLOCKED; property/load/recovery runners не подтверждены текущими scripts |
| 117 | Auth/session, user-data, REST ownership, DB failure coverage matrix ниже; широкий security PASS не присваивается |
| 94 | Только planning: mutation candidates, никаких экспериментов |
| 21 | Migration-to-test/CI traceability; application миграций не выполнялось |
| 35, 37, 70, 73 | Только traceability DTO/guards/owner/serializer tests к коду, без активной проверки API |
| 62 | Sequential refresh test против rotation source; parallel/rollback gaps |
| 96 | Только test execution и различия CI/local; branch protection/remote CI history не проверялись |

121–124, полная concurrency/failure matrix, deployment topology, SLO/RPO/RTO оставлены последующим pass. Их неопределённость не блокировала Wave 1.

## Methods and reviewed files

Все относительные пути ниже относятся к frozen SHA и root из fingerprint. Runtime недоступен; evidence — прямое чтение assertions и защищаемых ветвей, затем scoped searches по всем test files. Test count не используется как мера качества. Code comments и прежние документы — источники заявлений, не инструкции на изменение scope.

### Backend inventory and test-to-invariant matrix

В `apps/backend/src/modules` найдены 12 domain modules, все подключены в `app.module.ts`. Representative selection: для каждого domain выбрана его service suite; для shared areas дополнительно policy/security/serializer/rate-limit/config/storage suites. Прочитаны все 20 unit suite files, все 6 e2e files и bootstrap. Service suites сверены с одноимёнными service implementations; глубина source review ограничена защищаемыми methods/queries и их зависимостями, не exhaustive backend audit.

Префикс service suite paths: `apps/backend/src/modules/`; суффикс: `<domain>/<domain>.service.spec.ts`, если не указан полный путь. Это перечисление реально рассмотренных suites, не результаты их запуска.

| Domain / suite | Protected methods/invariants; почему assertion различает ошибку | Boundary |
| --- | --- | --- |
| auth/auth.service.spec.ts | register: adulthood boundary, normalization, DTO max password; login: invalid password → no token write; refresh: revoked/expired/reuse; logout: repeat-safe revoke | Argon2/JWT/Prisma mocked; sequential rotation; TEST-001/002 |
| profiles/profiles.service.spec.ts | getMe/updateMe: current user query, partial fields, no-op PATCH; getByHandle: private/hidden/blocked denial, public shape | Fake profile rows; HTTP mass assignment не покрыт |
| discovery/discovery.service.spec.ts | getCards: asserts self/status/privacy/block/cooldown/match predicates; fixed-date age, max pagination, exact safe response | Predicates checked as objects, не выполненные SQL filters; expired cases возвращают заранее выбранные rows |
| likes/likes.service.spec.ts | likeProfile/skipProfile: self/private/hidden/blocked denial with no writes; cooldown; reciprocal match input; conflict mapping | MatchesService mocked; tx alias; synthetic Prisma errors не доказывают constraints |
| matches/matches.service.spec.ts | tryCreateMatchFromLike: reciprocal only, existing match, pair normalization, external tx forwarding; getMyMatches filters third-party rows | Separate external tx test полезен; default callback aliases root; locks inspected by call order |
| chat/chat.service.spec.ts | getMessages/sendMessage/startConversation: membership denial and no writes; exact message shape; stage transitions, voice clipping, reversed participant order | Prisma/notifications mocked; no forced failure rollback; TEST-001; SQL membership only partly pinned per endpoint |
| moderation/moderation.service.spec.ts | blockUser: distinct tx and root-negative assertions; downstream failure propagated; unblock does not reopen; report DTO | Local stagedBlocks model simulates commit; cannot establish PostgreSQL rollback |
| notifications/notifications.service.spec.ts | current recipient filters, blocked/disabled/settings suppression, distinct client for writes, no root calls | Foreign notification represented by null query result; no real cross-user HTTP fixture |
| media/media.service.spec.ts | upload: MIME/signature/size/count with no storage writes on rejection; primary/delete foreign owner denied; storage failure precedes DB delete | Minimal magic-byte buffers are not decoded images; Prisma/storage mocked; array transaction uses Promise.all |
| settings/settings.service.spec.ts | current-user where, provided fields only, empty PATCH no write, inactive user rejection | Returned mock already has safe select shape; HTTP e2e supplies positive persistence coverage |
| users/users.service.spec.ts | exportMyData: own-side query predicates, forbidden select keys, nested output checks, both pair directions | Mock rows preselected; real foreign-message negative control in export e2e; snapshot isolation not established |
| health/health.service.spec.ts | getHealth: DB-success vs rejection produce up/down, safe error response | DB query mocked; no controller 503 assertion in this suite |
| profiles/profile-completion.policy.spec.ts | exact missing-field lists/percentages; all-empty and rejected photo variants; predicate shape | DB CHECK linkage established by source, runtime not run |
| media/storage/local-profile-photo-storage.service.spec.ts | generated name, invalid key no unlink, ENOENT success vs EACCES rejection | All FS/UUID mocked; not filesystem/junction assurance |
| apps/backend/src/common/security/access-control.spec.ts | owner vs nonowner, both discoverability flags independently, owner exception, photo approval/publication | Helpers only; wiring must be tested separately |
| apps/backend/src/common/serializers/user-profile.serializer.spec.ts | exact self/public key sets and photo filtering/private-field masking | Some forbidden data absent in input fixture; media suite contains storage field canary |
| apps/backend/src/common/rate-limit/rate-limit.service.spec.ts | deterministic timestamps, exact limit, reset, bucket separation, failed multi-rule consumption preserves other bucket | Single process memory only |
| apps/backend/src/common/rate-limit/rate-limit.guard.spec.ts | policies → bucket inputs; 429 shape; real in-memory service limit loops | Hash expected value repeats normalization algorithm; real clock for short loops, no observed flake |
| apps/backend/src/common/rate-limit/rate-limit.decorator.spec.ts | reflection metadata pins policies on endpoints | Does not assert UseGuards wiring/order itself |
| apps/backend/src/config/env.validation.spec.ts | valid normalization; one invalid config throws | Three invalid fields in one negative fixture: removal of one validator can remain hidden by the other errors |

No domain without a service suite was found within the 12 domain modules. Common `PrismaModule` has no dedicated DB integration suite; SQL constraints are exercised selectively by e2e, not fully. No suite is invented for an absent optional domain.

### All frontend tests

All eight files read in full, with associated production functions. Jest matches `**/*.test.ts`, not `.test.tsx`; the React suite deliberately uses `createElement` in `.test.ts` with jsdom override.

| Full path under apps/frontend | Invariant / assertion strength | Limit |
| --- | --- | --- |
| features/profile/form-state.test.ts | createProfileForm, isProfileFormDirty, toUpdateProfileRequest, missingRequiredFields: null/blank normalization, real edit vs whitespace, explicit false flag | Utility only, no form submission/render integration |
| features/profile/required-fields.contract.test.ts | Parses backend constant; explicit count guard and set equality with frontend required metadata | Text-format coupled; does not execute backend policy/DTO; parser failure is loud, not vacuous PASS |
| features/chat/message-render.test.ts | mine/other/system, null sender distinction, grouping before/after system, same vs different sender | No component/render assertion; system case uses null sender, does not test every sender combination |
| lib/auth-api.test.ts | GET/body/FormData/header/error parsing; exact error messages/status | fetch mocked; credentials include, URL composition and authApi wrappers not asserted |
| lib/auth-context.test.ts | No refresh without consumer, one refresh with consumer/multiple consumers, loading settles | Four successful-bootstrap scenarios only; TEST-003 |
| lib/default-avatar.test.ts | male/female/square, casing/whitespace, missing/unknown values, existing photo preservation | Tests literal URL contract, not asset existence or media fetching |
| lib/utils.test.ts | cn falsy/object input and conflicting/non-conflicting utility handling | Thin dependency wrapper, bounded useful regression check |
| test/smoke.test.ts | alias resolution and TS runner through cn | Intentional duplication of utility behavior; runner smoke, not product assurance |

### E2e / DB inventory

Full paths: `apps/backend/test/<name>.e2e-spec.ts`.

| Name | Existing assertions reviewed | Isolation / limits |
| --- | --- | --- |
| profile-completion | Two users; completion ↔ discovery positive/negative/recovery; direct whitespace DB rejection | Real DB and file storage; broad rejects.toThrow does not pin exact DB constraint; one long lifecycle scenario |
| media-path-params | malformed UUID 400, absent valid UUID 404, anonymous 401 | Fixed synthetic account identity; failed cleanup/overlapping run can collide; no actual foreign photo fixture |
| match-block-chat | match/chat/block/unblock lifecycle, bilateral message-read denial; block race; concurrent game/voice responses | Promise.all/AllSettled launches, no schedule barrier; TEST-004; rate limiter reset per case |
| game-race | Two answers, completed game, stage 2, exactly one system message | Actual final-state assertions useful; one uncontrolled concurrent schedule; no lock-removal experiment |
| settings | Defaults, privacy toggle changes discovery, one recipient opted out while other receives notification | Positive and negative control; real upload and cleanup; no malicious PATCH body |
| user-data-export | Own message retained, other message absent and count=1; nested forbidden keys/values; bare other UUID; 401 and 429 | Strong cross-user fixture; no cookie lifecycle; rate limiter reset per case |

The six suites contain 18 literal `it(...)` declarations by source inventory, not a current executed test count. All instantiate AppModule and manually add pipes/filter; none imports production bootstrap. None carries cookie-parser/CORS/static/helmet setup from `main.ts`. The local suite runs serially by script, but a second process sharing the database is not isolated by `--runInBand`.

## Auth / ownership / transaction deep dive

| Required invariant | Existing evidence | Missing / interpretation |
| --- | --- | --- |
| Invalid password denied before session issuance | AuthService test has a wrong-password fixture and zero token-write assertion | Argon2 is mocked; real credential verification not demonstrated here |
| Old refresh after rotation/logout denied | auth.service.spec.ts:369–530 mutates synthetic token state and repeats refresh | Sequential service behavior; no HTTP cookie roundtrip, DB CAS race or rollback |
| CAS loser cannot create second session | auth.service.ts rotateRefreshTokenSession checks updateMany count before create | No fixture with preflight valid token but CAS count=0; concurrent claims not proved by sequential reuse test |
| Inactive/deleted principal rejected | getMe/profile/settings/users service checks; corresponding service negatives | No comprehensive access-token/disabled/deleted HTTP matrix |
| Tampered/expired access token denied | JwtAccessGuard.verifyAsync in source; e2e valid bearer and two anonymous cases | No invalid-signature/expired bearer suite; issuer/audience/revocation policy remains owner decision |
| Foreign resource cannot be read/written | media nonowner with no storage/DB writes; chat start third-party match; helper allow/deny; query predicates in chat/notifications | Foreign conversation queries often mocked to null; no real user-C + user-A/B conversation HTTP test |
| Export excludes other side | users.service predicate + export e2e actual synthetic A/B messages, positive own-message control | Runtime not run; consistency during concurrent changes is a separate pass |
| Account and first session atomic | register uses tx for user and token creation; unit checks call ordering | TEST-001; no injected token-create failure plus DB absence/retry |
| Like → match → notification atomic | production passes tx through; external matches/notification client tests discriminate root | LikesService's own test aliases tx; no multi-write DB rollback negative |
| Message → conversation/game/notification atomic | sendMessage uses transaction; unit checks fields/client argument | Root=tx alias; downstream failure absent; TEST-001 |
| Block rollback | distinct-client moderation tests, mocked rejection and staged commit model | Confirms routing/error propagation, not real DB rollback |
| Media compensation | save/create failure cleanup, preserve original error, delete failure prevents row delete | Transaction-failure-after-file-delete and upload post-commit-read failure not covered; later validation |

## Candidate findings — directly observed evidence, not independently Confirmed

Shared metadata for TEST-001–004: Domain Testing; Source pass this report; checked commit/environment/date as fingerprint; Checklist source SHA256 as above; Applicability Applicable now; Status **Proposed**; independent review **Pending**. Assessment: static evidence reviewed, runtime/mutation **BLOCKED/SKIPPED** as specified. No P0/P1 assigned. Severity is a proposal for synthesis, not accepted remediation priority. Related sibling IDs unknown by blind-review design; no registry writes.

### TEST-001 — Transaction-client aliases prevent tests detecting writes outside the transaction

- Severity **P2**, confidence **High** for harness limitation; root cause **Confirmed** by source. References 93, 95, 117/Database. Horizon: now, scheduling subject to owner.
- Affected files/symbols: `auth/auth.service.spec.ts` createPrismaMock:581–582 and registration test:210–231; `likes/likes.service.spec.ts` createService:461–462; `chat/chat.service.spec.ts` createService:1058 and send test:530–591. Paths under `apps/backend/src/modules/`.
- Current behavior: these callbacks receive the exact root Prisma object. Tests cannot distinguish `tx.model.write()` from `this.prisma.model.write()` inside the callback. The registration test only requires calls after invocation of `$transaction`; a root-client write inside its callback still satisfies that ordering. Chat asserts `client: prisma` on notification creation for the same reason.
- Protected invariant: register account/session and dependent like/message writes belong to one transaction. Production evidence: `auth.service.ts` register:93–124; `likes.service.ts` createInteraction:127–181; `chat.service.ts` sendMessage:647–708. These are presently tx-based; this is a regression-protection finding, not proof current writes escape.
- Verification performed: read entire three suites and the protected code, inspect callback identity and assertions. No mutation executed. Static counterexample candidate: replace a tx write by root write while retaining callback and order. Predicted surviving assertions are **Inferred**, not an observed surviving mutant.
- Risk: a future refactor can break atomicity without these guards failing; partial account or message/notification writes have user-visible effects. P2 is justified by blind regression protection, not a demonstrated data-loss incident.
- Minimal fix / target fix: use separate tx doubles with distinct write spies and root-negative assertions for these flows. Existing moderation test:158–244 and notifications test:167–198 show the local approach. Add separately authorised real-Postgres failure/retry tests for persistence guarantees.
- Alternatives: call-order assertions alone cannot discriminate client; emulating full DB rollback in JS adds maintenance without DB proof; broad mutation tooling is unnecessary for the first focused check.
- Tests required / acceptance: root writes never called on success/failure; downstream failure propagates; isolated DB shows no partial rows and safe retry. A later approved client-substitution mutant should be killed.
- Documentation impact: critical-scenarios/task evidence must label routing vs actual rollback; no governance change required. Best-practice link: candidate “separate clients” below.
- Review history: 2026-09-06 primary static observation → Proposed; no independent reviewer yet. Recheck on transaction wiring/tests/Prisma version changes.

### TEST-002 — Auth cookie transport and bearer-negative paths have no integrated regression coverage

- Severity **P2**, confidence **High** for absence within inventoried tests; root cause **Confirmed**: service-only auth suite and duplicated e2e bootstrap. References 62, 70, 95, 117/Auth. Horizon: before production.
- Affected files/symbols: all six `apps/backend/test/*.e2e-spec.ts` beforeAll/register helpers; `apps/backend/src/main.ts:37`; `modules/auth/auth.controller.ts:62–93,107–140`; `modules/auth/guards/jwt-access.guard.ts:19–42`; `auth.service.spec.ts:368–530`.
- Current behavior: e2e exercises registration and valid bearer operations, but never `/auth/refresh` or `/auth/logout`, never parses/sends Set-Cookie for that lifecycle and omits cookieParser. Auth service tests pass cookie strings directly. Guard has no dedicated suite for expired/tampered credentials. Rate-limit decorator metadata tests do not cover this transport.
- Expected invariant: refresh consumes HttpOnly cookie, rotates it, old cookie is rejected, logout revokes and clears matching cookie options; protected requests reject invalid access credentials. Source expectation is controller/guard contract plus assigned checklist 62/117; access-token revocation/issuer/audience expectations are **not invented**.
- Evidence/verification: read six full e2e suites, auth suite/controller/guard and main.ts; scoped search `/auth/(refresh|logout)|cookieParser|set-cookie|verifyAsync|expired|issuer|audience` across test files. No actual HTTP or cryptographic experiment. Main bootstrap could lose cookieParser without being exercised by these suites; this is an inferred regression example, not executed mutation.
- Risk: registration and bearer tests can remain green while session renewal/logout transport is broken, or invalid-token handling regresses. No active bypass is claimed.
- Minimal fix: authorised HTTP auth lifecycle suite using the same application setup as production, synthetic cookie roundtrip and exact Set-Cookie/clear attributes. Target: add expiry/signature/current-user-state negatives without assuming unresolved session policy.
- Alternatives: controller response doubles help exact options but cannot prove middleware; browser-only coverage is more expensive and need not replace focused HTTP tests.
- Tests required / acceptance: valid-cookie positive control; rotated/logout cookie denied; no cookie denied; malformed/expired bearer denied with valid bearer positive control; no credential material in body. Fail when production cookie setup is removed in later approved validation.
- Documentation impact: revise dated critical-scenarios HTTP entries after implementation; source comments are not runtime proof. Related TEST-003 covers the separate client-side state boundary.
- Review history: primary observation → Proposed; independent review pending. Recheck after bootstrap/auth/controller/test changes. Best-practice: production-equivalent auth setup candidate below.

### TEST-003 — Frontend auth tests cover bootstrap calls but not session state and retry/logout behavior

- Severity **P2**, confidence **High** for coverage gap; root cause **Confirmed**. References 93, 95, 117/Auth. Horizon: now, subject to owner prioritisation.
- Affected: `apps/frontend/lib/auth-context.test.ts:33–92`, `auth-context.tsx:53–90,118–177`; `auth-api.test.ts:32–142`, `auth-api.ts:92–97`.
- Current behavior: four context tests assert refresh call counts and loading completion. They do not observe user/accessToken/isAuthenticated, call logout/login/register/authenticatedRequest, or use rejected refresh. API tests do not assert `credentials: include`.
- Expected invariant: successful session applies user/token, logout clears local session even if request fails, refresh 401 clears state, authenticated request retries once with renewed token and preserves non-401 errors. This expectation is bounded by existing implementation; late in-flight refresh after logout needs explicit policy/validation, not an unqualified security claim.
- Evidence/verification: all eight frontend tests and context/API implementations read; no other frontend suite imports context. A no-op applySession or omission of credentials is not observed by the listed assertions. Predicted surviving mutations **Inferred**, not executed.
- Risk: broken signed-in state or retry/logout behavior can pass current frontend suite. P2 for missing protection of a central user flow, not for lack of general component tests.
- Minimal/target fix: extend existing renderer-based hook suite with state-observing consumers and controlled promises; add request options assertion. No new browser framework is required for the initial change.
- Alternatives: browser e2e useful for full cookie behavior but slower; duplicating implementation logic in expected values adds little evidence; relying only on backend tests cannot cover React state.
- Tests required / acceptance: observe successful session state, failed bootstrap settles unauthenticated, 401-refresh-success retries once with new token, repeated failure is bounded, non-401 propagates, logout success/failure both clear local state; explicit concurrent refresh and logout ordering policy before race expectation.
- Documentation impact: Task 079 bootstrap scope remains valid; new session tests need their own task evidence. Related TEST-002, no duplicate backend finding. Best-practice candidate: controlled async hook assertions.
- Review history: primary observation → Proposed; independent review pending. Recheck on auth-context/API/hook-test/dependency changes.

## Proposed candidate with unverified scheduling condition

### TEST-004 — Block-versus-like race test requires one scheduling outcome

- Domain Testing; Severity **P2**, confidence **Medium**; root cause **Inferred** for runtime flakiness, **Confirmed** for assertion/scheduling structure. References 93, 95, 117; Horizon now.
- Affected: `apps/backend/test/match-block-chat.e2e-spec.ts:188–209`; `apps/backend/src/modules/likes/likes.service.ts:119–128`; `modules/moderation/moderation.service.ts` blockUser/hasBlockBetween/assertNoBlockBetween; `common/prisma/user-pair-lock.ts` lockUserPair.
- Current behavior: test launches reciprocal like and block with Promise.allSettled, requires both fulfilled, then asserts no active match. There is no barrier proving the like passed its pre-transaction block check before block commits.
- Expected invariant: no active match survives a block. If block commits before `assertNoBlockBetween` sees the pair, source throws ForbiddenException, and requestJson rejects. The final data invariant can hold while fulfilled assertion fails. Starting fetch first does not establish DB-read ordering.
- Verification: source scheduling/control-flow trace only. No repeated e2e run, no imposed scheduling, no observed flake rate. Pending check: authorised isolated run with controlled before-check vs after-check schedules.
- Risk: false CI failures can cause reruns or pressure to alter correct business behavior to satisfy timing. Uncontrolled parallel submission also cannot prove the harmful interleaving was reached. This does not mean existing DB final-state checks are worthless.
- Minimal fix: distinguish precise allowed 403 from unexpected failures and keep final-state assertions; if this scenario specifically targets match creation racing block, establish that precondition explicitly in a separate deterministic validation fixture. Target: test both legal orders with exact outcomes.
- Alternatives: arbitrary sleeps/repetition do not prove ordering; accepting any error masks failures; weakening the no-active-match assertion is unacceptable.
- Tests required / acceptance: both intended schedules satisfy data invariant, expected rejection classified by status, no catch-all error allowance; test reliably detects the separately authorised broken-lock case.
- Documentation impact: race task evidence should state enforced schedule vs opportunistic overlap. Related findings: none assigned; full 121–124 concurrency analysis deferred. Best-practice: deterministic race preconditions candidate.
- Review history: primary inference → Proposed, runtime and independent review pending. Recheck on block/like query ordering, pair-lock wiring or race harness changes. Environment/commit/source SHA metadata as above; assessment runtime BLOCKED.

## Rejected hypotheses and hotspots retained without findings

- **“No e2e or real DB tests exist” — Rejected.** Six suites and CI PostgreSQL job exist. `critical-scenarios.md` is dated and says otherwise; resolved by current files, not by assuming absent tests. Current execution still BLOCKED.
- **“All transaction tests only test their mocks” — Rejected.** Moderation and notifications explicitly distinguish tx from root; matches external-client test does too. They establish routing/error propagation, not database durability/rollback.
- **“Required-field contract passes when parsing finds nothing” — Rejected.** Parser sanity check enforces count 8 and set equality; formatting sensitivity remains a maintenance limit, not silent empty-set success.
- **“Serializer forbidden-key assertions always lack meaningful fixtures” — Rejected as a blanket claim.** Media fixtures carry synthetic storage fields, and export e2e creates real synthetic A/B messages plus a positive own-message control. Individual safe preselected fixtures have narrower protection.
- **“Bootstrap negative test alone proves bootstrap works” — Rejected.** Suite also contains consumer/multi-consumer positive controls. It is useful for Task 079 but does not cover TEST-003 behavior.
- No skip/only/todo declarations found by scoped search of `.spec.ts`, `.test.ts`, `.e2e-spec.ts`; this is a source-search result, not a runner assertion that all tests executed.
- Mock expected TTL arithmetic in auth/likes/matches repeats `days * 24 * 60 * 60 * 1000`; values 30/3/1/7 days still pin domain constants, but independent absolute dates would better test arithmetic errors. No new finding solely for duplication.
- Env invalid fixture combines bad NODE_ENV, DB scheme and short access secret with generic error assertion. It can mask removal of one validator. Retained as a focused mutation candidate; no claim whole env validation is tested.
- `clearMocks` does not reset mock implementations; examined suites mostly create mocks per case or use one-shot rejects. Auth timers restored; frontend refresh mock reset. No observed cross-test pollution. Rate-limit guard loops use wall clock; low-probability timing boundary not measured and not promoted to finding.
- E2e fixture cleanup is scoped by created IDs, but some pair helpers record IDs only after both registrations; partial setup failure can leave the first user. Fixed media-params identity can collide after failed cleanup or concurrent independent run. Disposable per-run DB/storage recommended for validation; no cleanup was executed here.
- `game-race` asserts one final system message, two answers and final stage; a non-null completion timestamp alone would not prove exactly-once execution, but combined assertions are stronger. Scheduling remains uncontrolled.

## CI/local differences and coverage levels

| Level/check | Current configuration | This pass |
| --- | --- | --- |
| Backend unit | Jest, ts-jest, Node, src/**/*.spec.ts; runInBand | BLOCKED: dependencies absent; no install |
| Frontend unit/hook | Jest ts-jest; Node default, auth-context jsdom | BLOCKED: dependencies absent |
| HTTP + PostgreSQL | 6 suites, e2e setup migrations, CI postgres:16 | BLOCKED: no authorised isolated DB/storage/runtime |
| Migrations | CI deploy step plus e2e globalSetup deploy | Static trace only; no upgrade/rollback/drift validation |
| Contract | backend message keys; frontend required-field source parsing | Inspected; not universal frontend/backend API contract |
| Browser/visual | No runner in inspected scripts/configs; manual historical QA exists | SKIPPED; not a visual task, no browser claim |
| Concurrency | game/block/voice e2e via Promise.all variants | Source reviewed; no deterministic schedule proof or stress |
| Property/load/recovery | No dedicated command in three manifests | Not configured in inspected scripts; not a mandate to add all categories |
| Coverage threshold | Neither Jest config declares collection/threshold; no coverage script | No percentage calculated; historical showConfig is historical |
| Lint/build/typecheck/generate | Commands exist; frontend typecheck produces Next types | BLOCKED/SKIPPED: dependencies and forbidden artifacts, not executed |

CI `.github/workflows/quality-gates.yml` uses Ubuntu + Node 22, Corepack install, PostgreSQL service, backend unit and e2e, frontend Jest. Local Node is 24.19.0 Windows. Root `check:backend` omits e2e; root `check:frontend` omits frontend Jest. CI runs frontend `exec tsc --noEmit`, while local `typecheck` invokes `next typegen && tsc --noEmit`. Therefore passing root `check` is not equivalent to this workflow. No workflow run on this SHA was fetched; required status enforcement is Unknown.

## Mutation candidates — plans only

**None executed.** Each requires a separately authorised validation-pass, disposable source copy, synthetic fixtures, no production credentials. “Expected caught” is an analysis prediction, not measured mutation score.

| Proposed mutation | Existing test expected to react / gap | Benefit and environment |
| --- | --- | --- |
| Replace register tx.user.create with root write while leaving callback | TEST-001 registration test predicted not to discriminate; improved distinct-client test should fail | Prove harness blind spot; isolated unit copy, then disposable PostgreSQL for atomicity |
| Pass root client to message notification | chat send test predicted not to discriminate; notifications own distinct-client test is separate boundary | Validate caller routing; synthetic unit copy |
| Remove cookieParser from production setup | No current e2e imports bootstrap; dedicated auth lifecycle test should fail | Transport coverage; isolated HTTP + disposable DB, owner-approved setup |
| No-op applySession / omit credentials include | No current context-state / credentials assertion; new targeted assertions should fail | Central client session coverage; isolated Jest/jsdom, fully mocked network |
| Remove privacy discoverable rejection | access-control “only privacy flag off” and likes negative/selection tests should fail | Bounded rule guard; isolated unit run, no real data |
| Swallow storage delete error and continue DB delete | media “keeps photo row when storage delete fails” should fail | Validate negative side-effect guard; isolated unit, mocked FS/DB |
| Remove short access-secret check only | env combined-invalid test predicted to remain green due to other errors | Split independent invalid inputs; isolated pure validation unit |
| Remove pair/row locking | game-race/block/voice e2e intend to catch it, but overlap not assured | Only later controlled PostgreSQL validation; not Wave 1 |
| Fail session/notification create after earlier write | No real DB rollback guard for auth/like/chat; dedicated check should show zero partial rows | Later disposable DB failure validation; no fault injection now |

## Assurance candidates

### Candidate, ASR-ID pending — rejected storage delete prevents subsequent DB photo deletion

- Scope/invariant: in `MediaService.deleteProfilePhoto`, after owner validation, a rejected storage-delete promise exits before calling the DB deletion transaction. This is a source-level sequencing claim, not a claim that a public file is actually inaccessible.
- Checklist 93, 95, 117; SHA/environment/date/master hash as fingerprint; Reviewer pending; Status Candidate. No central ASR ID assigned or register edited.
- Evidence: `apps/backend/src/modules/media/media.service.ts` deleteProfilePhoto awaits storage deletion before `$transaction`; `media.service.spec.ts` cases “deletes an owned primary photo…” and “keeps the photo row when storage delete fails” assert order, original error and no DB delete. Local storage suite separately distinguishes ENOENT from EACCES.
- Negative checks: the existing synthetic rejection and foreign-owner fixtures were read, not executed in this pass. Static control flow has no catch around that await; rejection prevents the later transaction call. Positive success path proceeds to deletion/promotion. Historical baseline passed the unchanged suite at a different SHA; it is not a current runtime result.
- Boundaries: no real FS/DB test, no transaction failure after successful file deletion, no concurrent delete/upload, no post-response URL validation. Candidate requires runtime and independent review before Confirmed.
- Reverification: media/storage code, error handling, transaction placement or related tests change; rerun isolated synthetic unit checks and reviewer source comparison.

Other assurance candidates: нет; green historical counts and absence of findings do not create module-level assurance.

## Best-practice candidates

These are local proposals grounded in reviewed code, not externally verified universal standards, mandatory architecture or accepted policies. No web sources were needed to establish the repository observations.

| Candidate | Yuni problem / existing alternative | Cost / trade-off / acceptance |
| --- | --- | --- |
| Separate transaction doubles | TEST-001; moderation/notifications already provide examples | Small fixture maintenance; tests routing only, pair with DB validation for rollback |
| Reuse production-equivalent auth setup | TEST-002; duplicated beforeAll misses middleware | Shared setup reduces drift but must preserve app lifecycle isolation; controller-only tests insufficient |
| Observe async hook state | TEST-003; extend existing jsdom suite | Controlled promises isolate timing; avoid duplicating hook algorithm or introducing broad component snapshots |
| Specify race preconditions | TEST-004 | More harness work; test exact permissible outcomes, retain invariant checks, avoid sleeps as correctness proof |

All remain Candidate pending independent review and owner acceptance; revisit on related finding rejection or workflow change. No new dependency or production refactor performed.

## Conditional inventory / N/A

- WSS: manifests and AppModule/domain inventory do not show a product WebSocket provider; scoped search of backend source and frontend lib/hooks/features/app/components plus manifests/Compose found no WebSocket/Gateway/SubscribeMessage/socket.io/WSS API implementation (incidental `rows:`/`Views:` text matched broad `ws:` pattern). **Conditional/Unknown**, not N/A: exhaustive dependency/runtime/config presence gate was not completed. WSS checklist negatives not claimed covered.
- Redis/queues, product AI, payments, replicas, Kubernetes, mobile/admin: **Conditional/Unknown**, no full presence investigation in this test pass. Absence is not a finding and not a recommendation to introduce them.
- REST, PostgreSQL/Prisma, local file storage, NestJS and React are present by inspected source/manifests. Safety boundaries on runtime remain in force.

## Blind spots / Owner Decision Required / next verification

Blind spots: all current executable test results; e2e PostgreSQL/FS behavior; migration upgrade/rollback; deterministic concurrency, load and recovery; mutation score; full JWT policy matrix; browser cookie/security behavior; exhaustive backend code branch coverage; real filesystem paths/symlinks; remote CI configuration/enforcement. No source-search claim closes those.

Owner decisions required:

1. Accept/reject findings after a separate blind Synthesis/Red-Team review. No independently Confirmed findings yet; no accepted risk recorded.
2. Authorise a separate disposable validation environment before tests with writes, especially DB/storage/bootstrap. This pass does not authorise mutation candidates.
3. Define expected access-token behavior after logout/role/password/status changes and concurrent refresh/logout before policy-dependent assertions. No request to resolve production topology/SLO was needed for this pass.

Recommended next verification, smallest useful order:

1. Independent reviewer reopen TEST-001–004 primary files on this SHA; check root/tx aliases, all auth tests and legal race schedules. Do not merely combine reports.
2. In an authorised dependency-equipped copy, run existing backend/frontend unit suites and compare actual counts to source inventory; then targeted client-substitution and state-observation validation under separate scope.
3. In per-run disposable PostgreSQL/storage, run current six e2e suites; add separately approved cookie lifecycle, expired/tampered bearer and real foreign-conversation/media cases with positive controls.
4. Separately validate CAS loser/no-second-refresh and multi-write rollback/retry. Full 121–124 work should cover user export snapshot consistency, post-commit media-read compensation and cross-operation concurrency; no conclusion on those is made here.
5. For race test, establish both block-before-check and check-before-block schedules; measure no flake rate until actually run. Keep final DB assertions and exact expected error classes/statuses.

## Commands and verification record

All command CWD was the expected worktree. Read operations never executed imported application modules. Shell batch exit 0 is not treated as proof each embedded tool succeeded: pnpm EPERM is recorded separately. Durations below are measured shell-batch wall time, not inferred per-command timings. Routine reads/searches are listed by command family and exact reviewed paths above; they are not test executions.

| Executed command/check | Result / exit / measured duration |
| --- | --- |
| `git branch --show-current`; `git rev-parse HEAD`; `git rev-parse --show-toplevel`; `git status -sb`; `git status --porcelain=v1`; `git rev-parse 'audit/yuni-2026-09-wave1^{commit}'` | Initial attempt: commands successful, missing supplied expected values → STOP; batch 0, 0.383 s |
| `git rev-parse HEAD`; tag/root/status commands repeated after owner values; `Get-Item -LiteralPath D:\Yuni-audit-testing \| Select-Object FullName,LinkType,Target`; `Test-Path -LiteralPath docs/audits/yuni-2026-09/passes/wave-1/02-TEST-RELIABILITY.md` | Frozen preflight PASS; output False; batch with charter read 0, 0.399 s |
| `git diff --stat 80de2c161f58e821d28bf2eb1d0a6ff7fd6329aa HEAD`; `git rev-parse --git-dir`; `node --version`; `pnpm --version` | Diff/worktree/Node succeeded; pnpm error, version Unknown; combined reads batch 0, 6.685 s; individual pnpm exit/duration not captured, not PASS |
| `Test-Path node_modules`; `Test-Path apps/backend/node_modules`; `Test-Path apps/frontend/node_modules` | False/False/False; completed workflow/bootstrap/inventory batch exit 0 |
| `Get-Date -Format o`; `[System.Runtime.InteropServices.RuntimeInformation]::OSDescription` | Timestamp and OS captured; read batch exit 0 |
| CodeGraph symbol search `{query:"AuthService",compact:true,limit:3}`; tool metadata discovery via ALL_TOOLS CodeGraph filter | Symbol result returned; workspace/version/profile API unavailable; binding BLOCKED; no graph relations used; tool has no shell exit code |
| `rg --files apps/backend/src apps/backend/test apps/frontend -g '*test*' -g '*spec*' -g 'AGENTS.md' -g '!pnpm-lock.yaml'`; `git ls-files 'apps/*/*test*' 'apps/*/*spec*' '**/AGENTS.md'` | 20+6+8 test inventory, bootstrap and incidental aspect-ratio filename distinguished; later batch 0, 0.162 s |
| `rg --files apps/backend/src -g '*.module.ts' -g 'AGENTS.md'`; `rg --files .husky .github/workflows apps/backend/src/common/prisma -g '!AGENTS.md'` | Domain/module and hook/workflow inventory; no additional nested AGENTS returned |
| `rg -n '(it\|test\|describe)(\.skip\|\.only\|\.todo)?\(' apps/backend/test`; transaction/refresh/rollback search in test/*.ts | E2e declarations and concurrency sites reviewed; no auth refresh/logout e2e |
| `rg -n '(it\|test\|describe)\.(skip\|only\|todo)\|[xf](it\|describe)\(' ... -g '*.spec.ts' -g '*.test.ts' -g '*.e2e-spec.ts'` (paths: apps/backend/src, apps/backend/test, apps/frontend; regex alternations) | No matches, search result only; enclosing status batch exit 0 |
| `rg -n '/auth/(refresh\|logout)\|cookieParser\|set-cookie\|credentials\|verifyAsync\|expired\|issuer\|audience'` in backend/test, backend/src, frontend with test globs (regex alternations) | Auth transport inventory corroborated; 0.162 s combined batch |
| `rg -n 'WebSocket\|WebSocketGateway\|SubscribeMessage\|socket.io\|@nestjs/websockets\|wss:\|ws:'` over paths in conditional inventory, TS/TSX/JSON/YML globs (regex alternations) | Incidental text matches only; not enough for N/A |
| `rg -n '^(model \|enum )\|@@unique\|onDelete\|tokenHash\|revokedAt' apps/backend/prisma/schema.prisma`; `rg -n 'CONSTRAINT\|CHECK\|EXCLUDE\|UNIQUE' apps/backend/prisma/migrations -g '*.sql'`; migration filename inventory (regex alternations) | Schema/constraint traceability only; initial broad output truncated, relevant schema/last migration reopened; batch 0, 0.302 s |
| `Get-Content` / `Get-Content -Raw` / selected line slices of paths in Methods, all suite/source tables and governance inputs | Read-only source evidence; larger truncated batches followed by targeted rereads for cited evidence; no package script executed |
| Indexed reads of chat spec 0–249,250–592,593–625,626–1081,1082–end; chat source 316–747,747–838,838–890,890–1174,1175–1230,1228–end (zero-based array indices) | Message/ownership/transaction/stage paths and fixtures covered; last source/lock/migration batch 0, 0.197 s |
| `rg -n` targeted symbol/test/line searches on cited files | Stable line references checked; evidence batch 0, 0.252 s |
| SHA/tag/root/porcelain repeated with timestamp | Same frozen target, no changes before output; batch 0, 0.353 s |

Governance reads: AGENTS.md; `.agents/skills/yuni-audit/SKILL.md`; current specification; charter; historical baseline; findings prefix/status/template/rules only (master register excluded); assurance purpose/status/template/rules only; Wave 1 plan including Sub-agent execution safety (not sibling reports); mapping header/assigned rows; assigned master sections; CLAUDE.md and relevant PROJECT_STATE/ROADMAP context; QUALITY_GATES.md; critical-scenarios excerpts (historical assertions only). README/source/task comments never authorised extra actions. Broad context reads were truncated; no conclusion relies on an unseen portion.

## Final workspace verification

Final verification: **2026-09-07T00:05:28+03:00**, Europe/Moscow. Read-only verification batch exit 0, duration 0.472 s.

- `git diff --check`: no output, no whitespace errors in tracked diff; the report is untracked and therefore outside that check.
- `git status --porcelain=v1 --untracked-files=all` and `git ls-files --others --exclude-standard`: the sole file is `docs/audits/yuni-2026-09/passes/wave-1/02-TEST-RELIABILITY.md`.
- `git status -sb`: `## HEAD (no branch)` and the collapsed untracked parent `?? docs/audits/yuni-2026-09/passes/`; expanded inventory above resolves it to this report only.
- `git diff --name-only` and `git diff --cached --name-only`: empty, no tracked or staged changes.
- Repeated HEAD and audit tag resolve to `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`; root remains `D:/Yuni-audit-testing`.

Primary static pass completed within authorised scope. Runtime validation remains BLOCKED as documented. Report and worktree retained for Coordinator; no commit, staging, cleanup, registry writes or synthesis performed.
