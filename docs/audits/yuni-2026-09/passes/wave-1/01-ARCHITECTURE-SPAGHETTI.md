# Wave 1 — Architecture and Spaghetti Code

## 1. Scope, status and frozen target

Primary static audit-pass по `prompts/wave-1/01-ARCHITECTURE-SPAGHETTI.md`. Анализ завершён в разрешённых статических границах; runtime/DB/browser validation не выполнялась. Четыре Candidate Findings, все **Proposed / P2**, независимых Confirmed findings **нет**. Severity не окончательная.

Общая metadata **E0** применяется ко всем evidence, findings, inventory и assurance ниже:

| Field | Value |
| --- | --- |
| Audit tag | `audit/yuni-2026-09-wave1` |
| Checked HEAD = tag = coordinator EXPECTED_AUDIT_SHA | `fed276a97fd84f29032c5eac1b11447bb1f3ed4c` |
| Coordinator EXPECTED_WORKTREE_ROOT | `D:\Yuni-audit-architecture` |
| Canonical actual root | `D:\Yuni-audit-architecture`; Node `fs.realpathSync(".")` |
| Branch | detached HEAD; `git branch --show-current` пуст |
| Initial status | `## HEAD (no branch)`; porcelain пуст |
| Output at start | отсутствовал |
| Worktree isolation | Git worktree inventory подтвердил отдельный architecture worktree; security/testing worktrees имеют тот же SHA; их содержимое не читалось |
| Date / timezone | 2026-09-06, Europe/Moscow, UTC+03:00; повторный preflight 23:47:36; конец основного чтения 23:58:28 |
| OS | Windows_NT 10.0.26200, x64 |
| Node | v24.19.0 |
| pnpm | **BLOCKED/Unknown**: `pnpm --version` → exit 1, Corepack EPERM при чтении своей local metadata; обход, установка или изменение config не выполнялись |
| CodeGraph | **BLOCKED — binding not proven**; version/profile Unknown |
| Runtime | не запускался; DB/network/real credentials не использовались |
| Allowed write | только этот файл; без commit, staging, push, PR, cleanup |

Первый запуск остановлен до анализа из-за отсутствия двух EXPECTED-параметров. После явной передачи координатором оба проверены повторно. Первоначальная остановка не подменяется PASS. Frozen-target проверки теперь PASS; pnpm и CodeGraph — ограниченные tooling blockers, разрешающие source fallback по specification §§7,12,17.

CodeGraph discovery обнаружил 8 read tools, но ни project/workspace context, ни version/profile API. `codegraph_symbol_search({query:"AuthService",compact:true,limit:3})` вернул абсолютный путь внутри architecture worktree и символ AuthService, который отдельно прочитан в source. Однако совпадение пути не заменяет обязательный workspace context. Graph relations не запрашивались и не использовались как evidence. Семантические embeddings также были недоступны (building). Конфигурация MCP не менялась.

Baseline `02-BASELINE.md` относится к **80de2c161f58e821d28bf2eb1d0a6ff7fd6329aa**, а не E0. `git diff --stat <baseline> HEAD`: 14 docs/skills/input/specification файлов. Дополнительный `git diff --exit-code <baseline> HEAD -- apps package.json pnpm-workspace.yaml pnpm-lock.yaml docker-compose.yml .github .husky` пуст. Это подтверждает отсутствие изменений выбранного app/config scope между commits, но не переносит исторический runtime PASS в текущую среду. Charter «Audit commit Pending» разрешён переданным frozen target; старые PROJECT_STATE/ROADMAP использованы только как исторические claims.

Новые sibling reports/conclusions, их registry entries не читались. В registries прочитаны protocol/template; master tables пропущены. Master checklist извлечён только по назначенным headings; строки вне выбранных sections не выводились. Repository comments/fixtures/Markdown не исполнялись как инструкции. AGENTS.md не менялся: аудит не изменяет project workflow/quality gates/security rules; scope разрешает только этот output.

**ID coordination:** 2026-09-07 координатор подтвердил диапазон ARCH-001–ARCH-020. Четырём существующим кандидатам присвоены ARCH-001–ARCH-004 в исходном порядке появления; ARCH-005–ARCH-020 не использованы. Изменены только ID и отметки о согласовании: findings, severity, confidence и evidence сохранены. Статус всех кандидатов остаётся Proposed; registry не изменён.

## 2. Checklist and coverage

Immutable checklist SHA256: `44FD1F11FA3953AF03E51C8EFD6233996F1C51C58193ABC106BB252BEBF51B6E`; повторно проверен Get-FileHash.

Прочитанные IDs: **2, 92** полностью; **15** только структура FK/ownership, **30** ресурсные маршруты, **98** assets/entry points/trust boundaries, **104** связь lifecycle и операций, **115** ограничения обязательности технологий, **119** reference vs фактическая topology. Дополнительных IDs нет; 0 и 121–124 не читались. Mapping interpretation, соответствующее распределение и safety §31–80 Wave 1 plan прочитаны; mapping не редактировался.

| Mandatory coverage | Result |
| --- | --- |
| Workspace/backend/frontend map | выполнена по manifests, entry points, всем Nest modules, route/import inventory |
| Key data flows/trust boundaries | выполнена в §3; security controls описаны статически, не сертифицированы |
| Conditional component inventory | выполнен bounded multi-channel search (§5) |
| Auth/session → profile/ownership hotspot | source/callers/DTO boundary/serializer/selected tests прочитаны |
| Media/storage/data access hotspot | upload/delete/primary, adapter, caller, selected tests прочитаны |
| Cycles/shared state/impact radius | локальный import graph, module wiring, state ownership и async continuations; §4 |
| Full API/DB/browser/performance/topology/all paths | вне scope; конкретные пробелы §9 |

## 3. Actual architecture

### System context and deployment containers

```text
Browser (untrusted input and local presentation state)
  ├─ HTTP → Next.js frontend (app routes/layout, static assets)
  ├─ fetch with credentials + optional Bearer → NestJS REST backend
  └─ public image URL → Nest/Express static uploads (separate path from REST guards)

NestJS modular monolith
  ├─ controllers / JWT + rate-limit guards / DTO validation
  ├─ application services + access helpers + explicit serializers
  ├─ PrismaService → PostgreSQL (single configured datasource)
  └─ ProfilePhotoStorage port → local filesystem adapter

Declared local Compose:
  frontend dev process :3000
  backend dev process :4000 + mounted uploads
  postgres:16-alpine + named data volume
```

Sources: `pnpm-workspace.yaml:1–2` включает только apps/*; app manifests — ровно backend/frontend; `apps/backend/src/app.module.ts:23–58`, `main.ts:17–67`; `docker-compose.yml` services; оба `apps/*/Dockerfile` CMD — dev processes. Нет production topology assurance: запуск Compose не выполнялся. GHCR workflow публикует application images, не deploy приложения. Отдельный Hugo/GitHub Pages pipeline относится к документации, а не дополнительному backend сервису. Root scripts по умолчанию build/start/lint ориентированы на frontend; backend имеет свои scripts. Shared workspace package не обнаружен.

Frontend: Next 16.2.0 / React 19.2.4 по manifest, App Router; auth/session client state — `lib/auth-context.tsx`; transport — `lib/auth-api.ts`; domain request wrappers — `lib/*-api.ts`; presentational/features folders — app-shell, auth, chat, discover, legal, profile, settings. Root layout содержит один AuthProvider и LangProvider. `(app)/layout.tsx` делегирует AppContent: клиентский loading/redirect, не серверная авторизация. Ни route handler/BFF, ни server-side Prisma frontend import в проверенном app/import inventory нет. Отдельные типы API поддерживаются вручную; JSON transport использует generic cast, не runtime schema validation.

### Backend modules, entities and ownership

Все modules ниже прочитаны как wiring, service глубина приведена в §8. Общие PrismaModule и RateLimitModule — @Global, ConfigModule — isGlobal. Это явные composition dependencies, не runtime isolation доменов.

| Module | Primary entity/operation owner | Direct service/domain edges and shared data |
| --- | --- | --- |
| Auth | User credential/session lifecycle, RefreshToken; initial Profile/settings creation | Prisma, JWT, Config, safe auth serializer; initial dependent rows создаёт nested write |
| Profiles | Profile read/update, computed completion | ModerationService; shared serializer; completion policy |
| Media | ProfilePhoto lifecycle + filesystem | Prisma + ProfilePhotoStorage; completion policy; заново собирает SelfProfile |
| Discovery | Eligibility/read projection | Prisma читает Profile/User/Photo/Privacy/Block/Like/Match; completion predicate |
| Likes | expiring Like/pass | MatchesService, ModerationService; pair lock + shared transaction |
| Matches | mutual-like detection, Match creation/list | ModerationService + NotificationsService; Like/Profile/User reads |
| Chat | Conversation, participants, Message, ChatGame/GameAnswer/Starter | ModerationService + NotificationsService; direct Match reads; stage/game/voice orchestration |
| Moderation | Block, Report | прямо меняет Match.status и Conversation.status при block |
| Notifications | notification creation/read visibility | ModerationService, user/preferences/profile reads; принимает transaction client |
| Settings | PrivacySettings, NotificationSettings updates | Prisma; Auth регистрирует начальные строки; policies читают другие modules |
| Users | self export projection, не отдельный credential owner | broad allowlisted reads 15 sections через Prisma; export serializers |
| Health | DB readiness response | Prisma SELECT probe; не отдельный domain lifecycle |

Nest dependency edges: Likes → Matches/Moderation; Matches → Notifications/Moderation; Chat → Notifications/Moderation; Notifications → Moderation; Profiles → Moderation. Прочие domain modules не импортируют друг друга через Nest. AuthModule **не экспортирует** guard/service; feature modules повторно импортируют JwtModule.register({}), controllers ссылаются на JwtAccessGuard. Source type imports в auth/types не означают вызов AuthService.

Ownership здесь частично shared по данным: Auth создаёт Profile/settings, Media читает Profile, Moderation закрывает Match/Conversation, Users собирает export. Эти связи скрыты от одного Nest import graph, но явны в Prisma calls. Прямой read в сервисах разрешён текущим module-boundaries document; сам по себе общий Prisma не finding.

### Schema boundaries

`apps/backend/prisma/schema.prisma`: User — корень для Profile, RefreshToken, settings, interactions. Profile.userId одновременно PK/FK; ProfilePhoto ссылается на Profile, уникальны userId/position. Match принадлежит паре User; Conversation.matchId nullable unique + SetNull при удалении Match. Participant имеет составной PK (conversationId,userId); Message.senderMember ссылается на него, а Participant.lastReadMessage — обратно на Message с SetNull. Это **подтверждённая relational cycle**, но не доказанный defect: обратная ссылка nullable, семантика «last read» обоснована; cascade behavior/deletion всех путей не проверены. ChatGame/GameAnswer находятся под Conversation, answer unique(gameId,userId). Notification имеет recipient и optional references на actor/match/conversation/message; ссылки не означают ownership чужого объекта.

Миграции содержат дополнительные constraints вне Prisma model; выборочно проверены profile-completion nonblank CHECK и system-message sender CHECK. Полный SQL/constraint audit не выполнен; нельзя выводить валидность DB инвариантов из одного schema файла.

### Key flows and trust boundaries

| Flow | Observed chain / controls | Boundary and residual uncertainty |
| --- | --- | --- |
| register/login/refresh/logout | authApi → AuthController → AuthService → Prisma/argon2/JWT; controller отделяет refresh cookie от JSON; registration user/profile/settings/session в tx; refresh revoke/create в tx | Client не доверенный credential source; bearer guard проверяет JWT, services отдельно проверяют user state. Instant access revocation policy Unknown; не объявляется обходом |
| authenticated profile | useAuth → profileApi → JwtAccessGuard/CurrentUser → ProfilesService.assertActiveUser → Prisma current-user scoped query → explicit serializer/completion | Client flags/IDs не owner proof; byHandle дополнительно проверяет block и visibility. Полный matrix deleted target/privacy не исследован |
| photo upload | FileInterceptor size limit → MediaService active user + MIME/signature/count → storage save → DB tx → reread self profile → serializer | Filesystem и DB — разные atomic domains; post-commit read входит в cleanup catch (кандидат ниже). Оригинальные media не открывались |
| photo delete/primary | authenticated actor → load photo → assertFound/assertOwner → file removal/tx or primary tx | IDs из URL лишь locator; REST ownership не распространяется на static public image route |
| discover/like/match | backend eligibility query → card JSON → like API → pair lock → Like create → MatchesService(tx) → NotificationsService(tx) | UI reveal/filters — presentation; match status authoritative на backend. Полная retry/race matrix отложена |
| block | ModerationService → pair lock → Block + Match.blocked + Conversation.closed | Lifecycle impact охватывает три таблицы и read paths разных modules; runtime races не проверены |
| chat/game | participant/status checks → Message + conversation update + game rules + notification(tx); answerGame locks game row → stage advancement/system message | SQL locking и stale snapshots требуют отдельного consistency pass. VoiceDurationSec — client metadata; backend path не является загрузкой/валидацией аудио |
| notifications | same-DB writes → REST list/unread/read → browser event → AppNav reload unread count | `yuni:notifications-updated` — событие внутри browser, не server push/WSS |
| export | UsersService.exportMyData → self filters + select allowlists → export serializers | Broad data read; единая tx без явного isolationLevel не доказывает единый repeatable snapshot; consistency review отдельно |
| public images | main.ts.useStaticAssets → filesystem | DB visibility не проверяется при прямом URL read; policy revocation/private lifecycle требует отдельной security/product проверки |
| external browser dependencies | root layout next/font + production-only Analytics | dependency/wiring присутствуют; фактический external delivery и processors/runtime не проверены |

## 4. Cohesion, coupling, cycles and shared state

**Local source graph:** выполнен read-only Node script (§11) по 224 tracked production TS/TSX файлов backend/src и frontend, исключая *.spec.*, *.test.*, next-env. Разрешает relative и @/ imports/re-exports, string-literal dynamic import/require; найденные локальные edges разрешились без unresolved paths. SCC >1: **0** как для all edges, так и после исключения syntactic `import type`. Отдельный source search не нашёл forwardRef/ModuleRef/LazyModuleLoader в backend/src.

Ограничения: regex, не TypeScript compiler; side-effect imports, computed paths, runtime DI, inline type specifiers, generated/dependency code и JS config graph полноценно не моделируются. Route files — framework roots, даже если fan-in 0. «Нет SCC» не доказывает отсутствие spaghetti или всего dead code. Проверенные Nest wiring edges выше также ацикличны.

| File | Local import fan-in | Interpretation |
| --- | ---: | --- |
| frontend/lib/utils.ts | 51 | cn utility, высокая повторная используемость сама по себе не риск |
| backend/auth/types/authenticated-user.ts | 24 | type coupling; не 24 runtime callers AuthService |
| frontend/lib/lang-context.tsx | 22 | общий language store; изменение уведомлений влияет на экраны |
| frontend/lib/auth-api.ts | 18 | transport/error/request types shared |
| backend/common/prisma/prisma.service.ts | 14 | infrastructure access shared |
| frontend/lib/auth-context.tsx | 14 | session/request behavior затрагивает все authenticated consumers |
| backend/auth/guards/jwt-access.guard.ts | 13 | common transport auth boundary |
| backend/moderation/moderation.service.ts | 7 | service/module imports; дополнительно data coupling с Chat/Matches |

Fan-out: AppModule 17 (composition root, ожидаемо); discover page 12, matches page 11, profile page 10, media service 8. Counts — локальные file edges, не complexity или severity score.

Hotspots:
- **AuthContext:** centralized state и refresh single-flight, но разные async writers (refresh/login/register/logout) не имеют общей generation/ordering проверки. Это конкретная причина кандидата session ниже.
- **MediaService:** storage, DB и self-profile response lifecycle в одном catch; business DTO response зависит от последующего query другого entity.
- **Active-user rule:** 10 дословных копий одного helper; normalized body SHA256 у всех `17bf0429626a378444138223333d91709ac2cb330887053553c64c0abaae4009`. Явный change radius при изменении eligibility.
- **MatchesService:** две реализации block/reciprocal-like/existing-match/create алгоритма: standalone tx (221–278) и helper (300–356); caller-provided tx ветка (191–215) полагается на lock, взятый LikesService:127–129. Текущий production caller передаёт tx и берёт lock. Дублирование — локальный cleanup/verification candidate, не доказанная текущая race. Не назначается отдельный высокий finding только из-за размера.
- **ChatService:** объединяет membership, list projection, send/voice accounting, game scheduling, stage advancement. Изменение message weights затрагивает createGameIfNeeded; изменение stage — voice rules и system messages. Однако это один Conversation aggregate; разделение на микросервисы не обосновано. Selected send/game paths просмотрены, полная game state machine не закрыта.
- **Frontend Messages:** один messages[] обслуживает выбранный activeId, но async send continuation живёт дольше выбранного диалога; конкретный кандидат ниже.
- **Profile/onboarding:** shared form-state/fields — реальное переиспользование. Profile.applyProfile сбрасывает и server record, и form, включая photo response; onboarding.uploadPhoto намеренно обновляет только server record. Возможную потерю draft при profile media action передать FE pass: доступность полного UI состояния не проверена, отдельный finding не назначен.
- **Common serializer:** type import ProfileCompletionResult из profiles — обратная layer dependency, не runtime cycle; не требует общего shared package без доказанной задачи.

Shared mutable state inventory: Prisma provider/client; process-local Map в RateLimitService:14 (prune/consume/reset); React auth refs/state; module-level language cache/listeners + localStorage через useSyncExternalStore; browser notifications event. Rate-limit reset production caller не доказан. In-memory limiter не является distributed limiter; отсутствие multi-instance requirement не позволяет объявить это текущим incident. No global singleton state «без хозяина» доказан не был.

## 5. Conditional components / presence gates

Поиск **231** safe tracked files: production backend/src; frontend app/lib/features/hooks/components/types; root/app manifests, workspace, next config, Compose, .github workflows. Отдельно прочитаны все Nest modules, API route decorators, client wrappers, оба Dockerfiles, datasource и package dependency names. Поиск paths охватывает tracked apps/infra/deploy/helm/k8s/terraform. Tests, seed, uploads, .env, user data, sibling reports исключены.

Disposition ограничена **реализацией в этом repository на E0**, не внешними системами без конфигурации. Ни один отсутствующий компонент не finding и не рекомендация внедрения.

| Component | Disposition | Evidence / limits |
| --- | --- | --- |
| WSS/WebSocket/SSE | N/A — absence verified в app code/config | zero WebSocket/WebSocketGateway/socket.io/@nestjs-websockets/ws URL/EventSource matches; Nest modules без gateway; manifests без direct client/server dependency; frontend только REST wrappers; Compose без WSS |
| Redis/Valkey | N/A — absence verified | zero redis/valkey/ioredis; memory Map limiter прочитан; Compose/db provider без Redis |
| Queues/workers/message broker | N/A — absence verified | zero bullmq/amqp/kafka/rabbitmq/@nestjs-microservices; нет worker path/module/dependency; notifications синхронно пишутся в ту же БД |
| Product AI | N/A — absence verified | zero openai/anthropic/langchain/ollama в product corpus, нет AI module/API/dependency; ChatGame использует локальные вопросы, не provider. Audit MCP не product AI |
| Payments/provider webhooks | N/A — absence verified | no payment SDK/module/API/route/model/wiring; stripe matches в veil-overlay — рисунок ткани, не платежи |
| Outgoing email/push | N/A — absence verified | no nodemailer/sendgrid/resend/firebase/web-push dependency/calls; notifications — DB + REST. Наличие email field не email delivery |
| Object storage adapter | N/A — absence verified | port связан с LocalProfilePhotoStorageService; save/unlink local fs; нет SDK/config. Слово bucket встречается только в rate limiter |
| DB read replicas | N/A — absence verified в checked config | один PostgreSQL datasource, один Compose postgres, no replica router/client/config; external DB topology Unknown |
| Kubernetes/service mesh | N/A — absence verified в tracked deployment | no manifests/charts/paths; local Compose. Production desired topology Unknown |
| Native mobile app | N/A — absence verified | apps manifests только backend/frontend; нет expo/react-native/native app tree; use-mobile hooks — responsive web |
| Admin app/review API | N/A — absence verified в exposed app inventory | no admin module/controller/frontend route/provider; Report schema/status — не admin UI. Operational manual tools за пределами repo Unknown |
| Browser analytics/fonts | Present (conditional execution) | layout.tsx:2–3,65; @vercel/analytics/next + next/font/google. Runtime sending не проверено |
| Photo moderation states | Present in schema; current upload auto-approves | schema pending/approved/rejected; MediaService:111–113 пишет approved/published; workflow moderator не доказан |
| Audio | Partial API metadata only | ChatService voice limits/voiceDurationSec есть, frontend chatApi.sendMessage отправляет text; media port profile-photo only; реального audio upload нет в route inventory |
| Interests | Schema/read projection only | ProfileInterest/Interest schema и Users export; отдельного write API в controllers нет |
| CDN/WAF/LB/TLS/backups/observability platform | Conditional/Unknown | reference §119 не deployment evidence; внешние service configs/runtime не проверялись. Не закрывать широко как N/A |

## 6. Candidate Findings (Proposed, independent review pending)

Общие поля всех четырёх: ID **ARCH-001–ARCH-004**, указан в заголовке каждого кандидата; Source pass — этот файл/E0; Domain Architecture (смежные FE/BE); Checklist 2,92,98,104; Checklist source SHA256/E0 — §1–2; Applicability Applicable now; Verification environment static Windows/Node; Verification date 2026-09-06; Status Proposed; Related findings: sibling duplicate check pending synthesis; Best-practice candidate: нет; Decision owner: Coordinator/owners после independent review. Никакого accepted-risk решения нет.

### ARCH-001 — Candidate: upload cleanup удаляет файл после успешного DB commit при сбое response read

- Severity: **P2**, Confidence **High** для control flow; частота сбоя Unknown.
- Affected files/symbols: backend `modules/media/media.service.ts:62–129,311–324` (uploadProfilePhoto/getSelfProfileView); `storage/local-profile-photo-storage.service.ts:39–58`; `media.controller.ts:32–44`.
- Assessment result: **FAIL (static invariant)**; runtime reproduction BLOCKED.
- Reverification trigger: изменение upload transaction/catch/response hydration/storage adapter.
- Remediation horizon: now, после подтверждения.

**Current behavior / invariant.** Компенсация не должна удалять успешно сохранённый файл только из-за ошибки формирования ответа после DB commit. Реальная граница rollback — transaction create. Но try охватывает и `await getSelfProfileView` после неё.

**Evidence.** save в 78–82; tx завершается в 116; следующий awaited profile read в 119; catch 122–128 вызывает deleteProfilePhoto для того же объекта. getSelfProfileView:312 делает новый Prisma query и 317 assertFound. Local adapter выполняет unlink; нет обратного удаления committed photo row в catch. REST caller делегирует напрямую. Read/trace выполнены на E0, без вызовов приложения.

**Reproduction / verification.** Прочитан полный путь и selected media tests. Предлагаемая последующая проверка: valid synthetic upload, successful tx create, затем отказ profile read; ожидать отсутствие storage delete и сохранённую согласованность ранее committed результата. Реальный fault experiment не запускался. Существующие tests:361–391 моделируют failure самой create/cleanup; createService:583–593 просто исполняет callback, не симулирует DB commit. Happy path:275–331 не проверяет post-commit read failure.

**Risk.** При transient DB read error успешная загрузка превращается в photo row с несуществующим файлом; она продолжает учитываться completion/count/primary. Риск локален к загрузке и дополнительному отказу; поэтому P2, без заявления массовой потери данных/P1.

**Root cause — Confirmed:** catch смешивает компенсацию persistence failure и ошибки response hydration.

**Recommended solution.** Minimal fix: ограничить компенсационный catch стадией до успешного commit; post-commit hydration вынести за него. Target fix: явная граница persisted result и response read, определить recovery/response semantics. Не внедрять outbox/object storage ради этого дефекта.

**Alternatives.** Оставить как есть — сохраняет доказанный failure path. Собрать response внутри tx — возможно, но увеличивает tx scope и требует согласования; не делает filesystem транзакционным. «Удалить row после read error» разрушает уже committed операцию и не выбран.

**Tests required.** Unit controlled rejection после успешного tx; negative create failure по-прежнему очищает файл; cleanup failure не маскирует original error; happy path сохраняет файл. DB/filesystem validation — только отдельно согласованная среда.

**Documentation impact.** Media flow/Task 047-related explanation: явно описать commit boundary и сохранность данных при ошибке ответа.
**Acceptance criteria.** Post-commit read failure не удаляет committed photo; прежний cleanup до commit остаётся; safe serializer не меняется.
**Review history.** 2026-09-06: первичный автор → Proposed; independent review отсутствует.

### ARCH-002 — Candidate: async refresh может перезаписать более новую session intent

- Severity **P2**, Confidence **High** для unconditional continuations; observed runtime **Unknown**.
- Affected files: frontend `lib/auth-context.tsx:46–90,118–139,142–176`; `features/auth/components/sign-in-form.tsx:63–95,186`; `features/app-shell/components/app-nav.tsx:54–81`; `app/layout.tsx:62–64`.
- Assessment: **FAIL (static ordering invariant)**; runtime BLOCKED.
- Trigger: session lifecycle, refresh retry, provider remount strategy; horizon now.

**Current behavior / invariant.** После более нового login/logout старый async refresh не должен безусловно менять current session. refresh single-flight защищает только refresh vs refresh. Его success всегда applySession, failure всегда clearSession; login/logout не отменяют и не инвалидируют старую continuation.

**Evidence / scenario.** (A) useAuth mount запускает refresh; SignInForm читает login, не auth loading, submit disabled только formState=loading. Login может завершиться раньше старого refresh failure; затем catch:77 очищает уже успешную сессию. (B) authenticatedRequest начинает refresh; пользователь нажимает AppNav logout; logout очищает состояние; поздний refresh success снова applySession. Provider живёт в root layout и не размонтируется при переходе между route groups. Эти control flows подтверждены чтением, сетевой порядок не воспроизводился.

**Risk.** Зависимость результата login/logout от порядка HTTP completion: неожиданный выход после входа или возврат старого client state. P2 за session correctness и fan-in 14; это не подтверждённый bypass server auth и не требование instant token revocation. Backend policy и cookie races отдельно.

**Root cause — Confirmed:** несколько async writers одного auth state не имеют общей generation/intent границы.

**Recommended solution.** Minimal: при явном login/register/logout менять generation и принимать refresh result/error только для актуальной generation; определить обработку waiters старого refresh. Target: компактный session coordinator с явными transitions, сохранить lazy bootstrap/single-flight. Abort как дополнение, не единственная защита late completion.

**Alternatives.** Только disable login во время bootstrap — не закрывает logout overlap. Только clearSession — уже есть и недостаточно. Полная новая state library не требуется.

**Tests required.** Existing AuthProvider hook tests расширить deferred promises для обоих порядков refresh/login и refresh/logout; negative refresh-only и concurrent consumer single-flight остаются. Текущий `auth-context.test.ts:33–93` проверяет четыре bootstrap сценария с немедленным resolved mock, не lifecycle overlap; не запускался.

**Documentation impact.** Auth frontend flow/session lifecycle; отдельно согласовать server revoke policy.
**Acceptance criteria.** Старый refresh не меняет новую intent, stale failure не очищает новый login; обычный bootstrap и 401 retry сохраняются.
**Review history.** 2026-09-06: Proposed; independent/browser verification pending.

### ARCH-003 — Candidate: завершение отправки добавляет сообщение в другой выбранный диалог

- Severity **P2**, Confidence **High** по state/control flow; browser occurrence Unknown.
- Affected file/symbol: frontend `app/(app)/messages/page.tsx:110–129,178–209,236–275,379–398` (Messages page/sendMessage); `lib/chat-api.ts:93–107`.
- Assessment **FAIL (static state ownership invariant)**; runtime BLOCKED.
- Trigger: active conversation/message state/send completion; horizon now.

**Current behavior / invariant.** messages[] должен принадлежать выбранному activeId. sendMessage захватывает activeId для request, но continuation:252 безусловно append в текущий общий messages[]. Conversation list остаётся clickable во время isSending.

**Evidence / verification.** Статически прослежен порядок: отправить в A → выбрать B (384, без disabled=isSending) → getMessages(B) обновляет общий массив (189) → поздний send(A) делает append (252) в B. `setConversations` отдельно корректно использует captured A (256), но messages[] не ключуется. Эффект GET использует active cleanup (183,206–208), однако он не защищает send continuation. Нет отмены send при смене activeId.

**Risk.** Сообщение из A показывается под заголовком B до следующего refresh; поздний setInput("") может удалить новый draft. Серверный recipient остаётся A — утечка собеседнику B этим evidence не доказана. P2 за misleading conversation state, не security P0.

**Root cause — Confirmed:** state нескольких ресурсов свёрнут в один массив без проверки identity на completion.

**Recommended solution.** Minimal: сохранить target conversation ID и обновлять visible messages/input только если всё ещё выбран этот ресурс; корректно обновить conversation summary независимо. Target: keyed per-conversation state или hook, владеющий request generation и draft отдельно.

**Alternatives.** Запрет переключения во время send меняет UX и не решает остальные late reads; global cache library необязательна. Оставить state — сохраняет конкретный race path.

**Tests required.** Отдельно согласовать FE test scope: deferred send A, switch B, resolve GET B, resolve send A; B не содержит message A и draft B сохранён. Контроль без switch: message A появляется один раз. Browser validation synthetic only. Новые component tests сейчас не добавлялись (AGENTS renderer restriction).
**Documentation impact.** Chat frontend data flow, ownership of request results.
**Acceptance criteria.** Late send не меняет выбранный чужой conversation buffer/draft; summary A обновляется, обычный send сохраняется.
**Review history.** 2026-09-06: Proposed; independent review pending.

### ARCH-004 — Candidate: active-user eligibility продублирована в десяти domain services

- Severity **P2**, Confidence **High** (exact normalized source duplicates).
- Affected helpers: `chat.service.ts:839`, `discovery.service.ts:124`, `likes.service.ts:186`, `matches.service.ts:371`, `media.service.ts:290`, `moderation.service.ts:370`, `notifications.service.ts:348`, `profiles.service.ts:131`, `settings.service.ts:123`, `users.service.ts:368`, все под backend/src/modules соответствующего domain.
- Assessment **FAIL (maintainability/change-radius)**; текущий access bypass **не установлен**.
- Trigger: user status/soft deletion/eligibility changes; horizon now (при следующем изменении policy).

**Current behavior / expected invariant.** Каждый helper делает одинаковый Prisma user lookup status/deletedAt и бросает UnauthorizedException при !user / status!=active / deletedAt. Один бизнес-критичный actor predicate имеет десять владельцев копии. Ожидание — общая проверка повторяемого access invariant: AGENTS owner checks и module-boundaries shared-access guidance; не требование переносить всю авторизацию в JWT guard.

**Evidence.** Read-only extraction всех production *.service.ts и SHA256 whitespace-normalized helper bodies: десять одинаковых hashes, §4. Caller search показывает применение в read/write endpoints. AuthService имеет собственные lifecycle checks; они не включены в число идентичных helpers. JwtAccessGuard DB status не проверяет.

**Risk.** Изменение eligibility (новый status/soft-delete condition) требует согласованной правки десяти services и их tests; пропуск одного оставит endpoint с прежней policy. Это доказанная высокая стоимость изменения/возможность drift, не уже обнаруженное расхождение. Likelihood runtime issue Unknown; P2 за cross-domain change radius, без P1.

**Root cause — Confirmed:** повторная локальная реализация общей actor policy при разделении transport guard и domain checks.

**Recommended solution.** Minimal: единый небольшой active-actor checker/predicate с явным Prisma dependency и прежней error semantics, сохранить вызовы в application services. Target такой же; не смешивать actor/target/recipient rules (у них разные ошибки и skip semantics), не строить universal authorization framework.

**Alternatives.** Оставить копии с contract checks — дешевле разово, но всё равно десять правок. Только JWT guard — не защищает direct service consumers и меняет существующую границу; без owner решения не выбран.
**Tests required.** Active/missing/disabled/deleted actor cases для общего helper и wiring выборки current endpoints; до первого protected write/read. Target/notification behavior не менять. Тесты не исполнялись.
**Documentation impact.** Backend/module boundaries: назвать владельца общего predicate; API responses должны остаться прежними.
**Acceptance criteria.** Одно определение actor eligibility, сохранённые owner/membership проверки и 401 semantics; нет generic policy расширения.
**Review history.** 2026-09-06: Proposed; independent validation pending. 2026-09-07: ID ARCH-004 присвоен из подтверждённого координатором диапазона; finding и его статус не изменены.

## 7. Rejected hypotheses, assurances, best practices

### Rejected / not promoted

- «Большие ChatService/profile/discover pages автоматически god objects/P1» — отклонено: size не evidence. Выявлены отдельные concrete ownership/ordering проблемы, без требования полного переписывания.
- «Module cycle Notifications → Moderation → Matches → Notifications» — отклонено для Nest/source imports: Moderation не импортирует MatchesService/Module, а пишет таблицы напрямую. Data coupling сохранён в карте, runtime cycle не придуман.
- «Нужно Redis/queues/microservices/Kubernetes, иначе architecture defect» — отклонено: presence gates/локальная topology не создают такую потребность.
- «Storage port — premature abstraction, потому что один adapter» — не подтверждено: он реально отделяет fs и подменяется media tests; удалять его оснований нет.
- «Frontend имеет runtime dependency на backend completion source» — отклонено в production graph; source text read находится в `required-fields.contract.test.ts:13–33`, это test coupling. Parser guard/контракт явно ограничены.
- «Match/message notifications пишутся после commit» — отклонено на E0: MatchesService:269–275 и provided-client branch:205–211 передают tx; ChatService:700–706 тоже tx. Исторический PROJECT_STATE claim не переносится автоматически.
- «Существующий match tx caller не берёт pair lock» — отклонено для production LikesService:127–129; helper сам lock не берёт, новый caller требует проверки контракта.
- «Auth single-flight решает все session races» — отклонено: ограничен refresh vs refresh; см. session candidate.
- «Всякий async response в Messages не защищён» — отклонено: GET effect имеет active cleanup. Defect narrowed до send continuation.
- «Нет static importer → файл/зависимость dead» — не использовалось. Dead/unreachable/unused dependency removals: **нет доказанных кандидатов**.
- «БД содержит FK cycle → обязательно ошибка» — отклонено как автоматический вывод; Message/lastRead relation требует отдельного deletion validation.

Rejected hypotheses не registry Rejected findings; ID не присваивались, история чужих выводов не менялась.

### Assurance candidate — REST media owner check precedes mutations

- Assurance ID: Pending (не выделялся); Status **Candidate**, reviewer Pending.
- Invariant: в прочитанных `setProfilePhotoPrimary` и `deleteProfilePhoto` при missing photo или owner mismatch управление не достигает DB mutations/storage deletion.
- E0 / checklist 2,92,98; environment/date/hash §1–2.
- Evidence: MediaService:138–144 и 179–200; `assertFound`/`assertOwner` в access-control.ts:34–49 бросают до side effects; MediaController:22,46–61 передаёт CurrentUser и parsed photo ID.
- Negative checks **выполнены как source trace**, не runtime: missing → assertFound throw; other owner → assertOwner throw. Selected existing tests:394–414 и 456–474 содержат rejects и absence-of-write/storage assertions; tests не запускались.
- Boundaries: предполагается корректный trusted currentUser аргумент и прочитанный ресурс; не доказывает JWT verification, TOCTOU, DB isolation, static URL privacy, storage path/symlink behavior или весь MediaModule.
- Recheck: изменение controller/guard/helper/операций или actor trust model; минимум повторить ordering trace и выбранные negative tests в разрешённой среде.
- Related findings: upload cleanup — другая стадия lifecycle; candidate её не опровергает.
- Review history: 2026-09-06, primary static candidate; независимого подтверждения нет.

Best-practice candidates: **нет отдельных записей**. Локальные remediation alternatives приведены в findings; официальные внешние рекомендации/версии не исследовались, generic architecture стандарты не объявлялись Accepted. Принятие нового guideline требует отдельного review.

## 8. Files / symbols actually reviewed

Пути ниже относительно root E0. «Inventory» означает имена/import/regex, не полное содержательное ревью каждого файла.

- Governance: AGENTS.md, yuni-audit/SKILL.md, current specification; charter, historical baseline, findings/assurance protocol/templates, Wave 1 safety, mapping; CLAUDE.md; PROJECT_STATE/ROADMAP исторический обзор (большие aggregate outputs частично truncated — не используются как primary implementation evidence).
- Architecture docs: module-boundaries.md прочитан; backend-structure/frontend-structure/program-flow-map частичный контекст, не authoritative runtime evidence. Другие historical audits/tasks не читались.
- Workspace/config: root/app package.json, pnpm-workspace.yaml; Compose, оба Dockerfiles, Next config; backend tsconfig/Jest configs, frontend Jest config, .husky/commit-msg. Workflows по names/run/uses и presence scan; удалённые run results не проверялись.
- Backend full wiring: app.module.ts, main.ts, все *.module.ts; все controllers — route/guard inventory; Auth/Profiles/Media controllers содержательно.
- Full service reads: AuthService (1–526), ProfilesService, MediaService, LocalProfilePhotoStorageService/port; LikesService, MatchesService, ModerationService, DiscoveryService, NotificationsService, SettingsService. UsersService — allowlist/export transaction и actor helper, отдельные sections были truncated; не объявляется полный export audit.
- Shared: access-control.ts; user-profile serializer relevant types/functions; profile-completion.policy.ts; Prisma service/module/user-pair-lock; RateLimitService; other common files import inventory only.
- ChatService deep slices: 316–451,470–716,748–890,994–1175; declaration/method inventory. 1–315,717–747,891–993,1176–end не полностью прочитаны (известны imports/объявления/выбранные matches).
- Frontend: AuthContext/AuthApi, AppContent/root/(app) layouts; ProfileApi/ChatApi/NotificationsApi; LangContext (store behavior), AppNav:50–81; Messages:104–280,370–402,500–518 плюс state/render searches; Profile:351–391,514–614 и hooks/actions inventory; Onboarding:108–217/field/finish UI; SignInForm:1–110,186. Discover/Matches pages — imports and action/state inventory, не полный layout audit; remaining features wrappers — dependency/presence search.
- Tests: auth-context.test.ts полный; required-fields.contract.test.ts полный; MediaService spec names + 275–334,361–393,394–414,456–474,551–595 (selected negative sections дополнительно перечитаны в финальной QA); Matches spec names/transaction branches sampled. Остальные tests — inventory only.
- DB: schema models/enums/relations inventory; полные slices 1–183,229–350,408–465; profile-completion/system-message migration CHECK выборка. Seed/data/dumps/uploads не открывались.

## 9. Blind spots, blocked checks and owner decisions

| Check / area | Disposition and reason |
| --- | --- |
| Unit/lint/typecheck/build/Prisma | BLOCKED для исполнения здесь: no node_modules во всех трёх местах; install запрещён. Builds/generate/Next typegen создают artifacts; backend tsc incremental может писать tsbuildinfo. Jest cache также не следует считать read-only по baseline |
| pnpm fingerprint | BLOCKED EPERM Corepack metadata; version не угадана по историческому baseline |
| CodeGraph graph/profile/version/workspace | BLOCKED binding, источник не использован; source graph fallback ограничен regex |
| DB e2e/migrations/transaction rollback/concurrency | BLOCKED, нет подтверждённой среды/credentials/synthetic isolation; никаких запросов к БД |
| Fault injection / mutation tests | SKIPPED, прямо запрещены Wave 1; proposed sequences выше не запускались даже во временной копии |
| Browser/visual/network/cookies | SKIPPED, dev server не создавался, active security testing не выполнялось |
| Full API / serializer / DTO matrix | не покрыта; кроме выбранных flows не доказана корректность всех route guards и contract shapes |
| Full DB/index/cascade/lifecycle | не покрыта; current deployment migrations и query plans Unknown |
| Performance/load/capacity | не измерены; fan-in не performance benchmark |
| Production topology/SLO/RPO/RTO | Unknown, не блокирует статический Wave 1 |
| Full ChatGame/voice/read-stage paths, admin ops, onboarding/profile draft interactions | выбранные связанные paths только; validation отдельным pass |
| Dependency reachability/dead code/package necessity | import scan не доказывает absence of dynamic entry points; deletions не предлагаются |
| Independent review / cross-pass duplicate resolution | pending отдельный Synthesis conversation после всех primary analyses; не запускался |

**Owner Decision Required**
1. ID coordination закрыта 2026-09-07: диапазон ARCH-001–ARCH-020 подтверждён, назначены ARCH-001–ARCH-004. Нового решения по диапазону не требуется.
2. Определить session intent ordering expectation и отдельно logout/access-token revocation policy; данные этого pass не требуют instant server revoke.
3. Согласовать отдельную synthetic validation среду для post-commit media failure и frontend deferred-request scenarios. Текущий отчёт не разрешает fault experiments.
4. Scope на любую remediation — отдельно, с acceptance criteria и blind review; сейчас изменений продукта нет.

**Recommended next verification**
- Independent reviewer повторно открывает первичное evidence четырёх P2, особенно ordering prerequisites; сравнивает с другими passes только после завершения primary analyses.
- Минимальные deferred hook/UI проверки session и chat; browser evidence на synthetic users; новое component testing согласовать по AGENTS.
- Media post-commit response read failure: scoped test и DB/filesystem validation; отдельно проверить retry после ambiguous response.
- Consistency/Idempotency pass: provided tx/lock contract Matches, block vs startConversation/send/game/voice, media count/primary concurrency, export snapshot isolation. Только направления; вся матрица 121–124 здесь не исследована.
- FE pass: profile draft vs photo response (onboarding уже показывает разделение server record/form), settings concurrent saves и data identity при смене session.
- Backend pass: actor predicate extraction применимость, target/recipient distinctions; не переносить authorization blindly в guard.
- DevOps pass: source-verified ConfigModule CWD/default env loading и deployment choice; прежний baseline probe не повторялся.
- До production отдельно решить static public-media lifecycle/privacy и runtime telemetry processors; отсутствие conditional technologies не remediation backlog.

## 10. Safety / completion

Все evidence относятся к E0. Production code, tests, configuration, package/lockfiles, input/templates/specification и registries не менялись; commit/staging/push/PR отсутствуют. Sibling reports не читались, conclusions не передавались. Worktree сохранён. Единственный разрешённый output — этот отчёт.

### Final verification — 2026-09-07, Europe/Moscow

Первичная post-write проверка в 00:15:02: HEAD/tag/root совпали; porcelain --untracked-files=all показал ровно этот output. Source/config/test changes и staged changes отсутствовали. Дополнительно перечитаны media negative tests:394–414,456–474; assertions подтвердили описанные source-trace boundaries.

Первый git diff --no-index --check выявил только лишнюю пустую строку на EOF этого output; она исправлена в разрешённом файле. Итоговые diff checks выполнены повторно после исправления. По итоговой проверке:
- git diff --check: exit 0, diagnostics нет.
- git diff --no-index --check -- /dev/null <output>: exit 1, stdout/stderr пусты (новый файл отличается от /dev/null); whitespace diagnostics нет. Exit 1 не назван exit 0/PASS команды.
- git status --porcelain=v1 --untracked-files=all: только ?? docs/audits/yuni-2026-09/passes/wave-1/01-ARCHITECTURE-SPAGHETTI.md.
- git status -sb: ## HEAD (no branch), untracked passes directory (единственный файл раскрыт porcelain выше).
- git rev-parse HEAD и tag: fed276a97fd84f29032c5eac1b11447bb1f3ed4c.
- git root / fs.realpathSync: D:/Yuni-audit-architecture / D:\Yuni-audit-architecture.
- Чтение/negative-test review + первая QA batch: exit 0 как shell batch, 0.494 s; whitespace warning относится к отдельному no-index check, а не к исходникам.
- QA с отдельным exit каждого Git check: 0.322 s, batch exit 1 из-за no-index comparison; все status/rev-parse и tracked diff checks exit 0. Результаты сохранены в conversation tool evidence; 2026-09-07 00:16:17 +03:00. После уточнения этого пояснения checks повторены.
- Дата primary source analysis: 2026-09-06; запись/финальная QA завершены 2026-09-07. Между ними checked SHA не менялся.

Независимое подтверждение остаётся Pending. Номерные IDs ARCH-001–ARCH-004 присвоены 2026-09-07 после подтверждения координатора. Это завершённый primary static analysis с перечисленными validation/coordination ограничениями, не завершённый audit synthesis.


## 11. Commands and reproducibility

Все команды — из checked root; приложение не импортировалось/не исполнялось. Source-reader Node использовал только built-ins fs/path/child_process/crypto/os; inline scripts не создавали файлов. Во время чтения terminal output некоторых больших batches был truncated; критичные source slices перечитаны отдельно, ограничения документов/Users/Chat явно сохранены. Длительности — tool wall time, не application timings; individual subcommand timing в compound read batches не измерялся.

| Executed command/group | Exit/result | Recorded duration |
| --- | --- | --- |
| Get-Content skill + AGENTS + pass spec (первый запуск) | 0, instructions; затем spec first 38 lines перечитан | 0.269 s |
| git branch --show-current; rev-parse HEAD/tag/root; status -sb/porcelain; Test-Path output | 0, первоначальный STOP missing EXPECTED; target clean | 0.389 s |
| Повтор тех же frozen checks + Get-Item root + git worktree list --porcelain + Get-Date -Format o + node --version + pnpm --version | batch 1 из-за pnpm; frozen commands outputs совпали, no link target; pnpm BLOCKED | tool wall 0 s (не надёжный тайминг), per-command Unknown |
| CodeGraph symbol_search AuthService compact limit 3; tool metadata discovery | success response, workspace API unavailable → BLOCKED evidence | query_time_ms 0, transport duration Unknown |
| Get-Content CLAUDE/PROJECT_STATE/ROADMAP | 0, historical context; partial truncation | 0.270 s |
| Get-Content charter/baseline; charter отдельно | 0, method/historical baseline, не runtime E0 | charter repeat 2.707 s |
| rg headings findings/assurance/plan; Get-Content protocol/template slices; mapping | 0; master registry tables excluded | metadata/baseline/diff batch 7.391 s; streamed template read duration not fully measured |
| Checklist section-filter (IDs 2,92,15,30,98,104,115,119); Get-FileHash SHA256 | 0, only selected sections printed, hash match | streamed >10 s; exact total Unknown |
| git diff --stat 80de2c161f58e821d28bf2eb1d0a6ff7fd6329aa HEAD | 0, 14 docs/skills files | included above |
| Get-Content package manifests/workspace/app/main; rg --files targeted dirs | batch 0, rg reported missing optional packages directory (exit 2 inside batch), not evidence of code absence | streamed >10 s |
| git ls-files apps/backend/src apps/frontend/app apps/frontend/features apps/frontend/lib apps/frontend/hooks packages .github .husky; git status --porcelain=v1 | 0; no tracked packages, clean | 7.287 s |
| Node numbered readers for files/ranges §8 | 0; no code execution | auth entry/context 7.817 s; auth/profiles/shared 6.302 s; media/profiles 9.042 s; likes/matches/moderation 6.879 s; discovery/notifications 4.204 s; chat slices 2.772 s; frontend boundary batch 2.866 s |
| Node local graph script (below) | 0; 224 files, no SCC>1, no unresolved captured edges; modules printed | 5.897 s |
| rg declarations/transaction/helper patterns Chat; Node settings/users/prisma/limiter | 0, selected content/truncation noted | 3.133 s |
| git ls-files configs/migrations/architecture; rg conditional keywords/schema/active-user helpers | 0 batch; initial unbounded expo matched export; rerun bounded pattern | 3.966 s |
| Corrected rg conditional keywords + Node Compose/Dockerfiles/Next/Jest/tsconfig/hook | 0, only stripe visual false positives | 6.542 s |
| Node architecture docs reader | 0, partial output; docs not primary proof | 2.902 s |
| rg test names/media failure mocks + Node selected controllers/fs.existsSync/os/realpath | 0; deps absent, canonical root correct | 1.003 s |
| rg frontend hooks/actions + Node auth-context/required-fields tests and notifications API | 0 | 0.122 s |
| Node Messages/Profile/Onboarding/AppNav/media-test slices | 0 | 0.105 s |
| Node schema slices + rg CHECK and Messages state selectors | 0 | 0.173 s |
| Node multi-channel inventory script (below) | 0, 231 files scanned; dispositions §5 | 0.254 s |
| rg controllers guards/routes/Prisma; rg transport/storage/dynamic graph markers | 0, REST routes + explicit fetch/localStorage evidence | 0.097 s |
| Node final Messages/Auth/SignIn/Lang/serializer slices; rg signin disabled and workflow run/uses | 0 | 0.125 s |
| Node normalized assertActiveUser extraction/hash; git diff --exit-code baseline HEAD -- apps/manifests/config; final prewrite status/tag/HEAD/realpath/date | 0; 10 identical bodies; clean; frozen target unchanged | 0.415 s |

Reader reproduction: `node -e 'const fs=require("fs"); for(const p of process.argv.slice(1)) console.log(p+"\\n"+fs.readFileSync(p,"utf8").split("\\n").map((s,i)=>(i+1)+":"+s).join("\\n"));' <paths>`. Для slices тот же reader с `a.slice(start-1,end)`; фактические paths/ranges перечислены §8 и evidence. PowerShell single-quote escaping применялось при передаче inline Node, без environment interpolation.

Ниже точные source-analysis программы, выполненные через `node -e` (повторять только после frozen/safety checks). Они не являются новыми repo tooling/config файлами.

### Local import graph program

```javascript
const fs=require('fs'),p=require('path'),cp=require('child_process');const files=cp.execFileSync('git',['ls-files','apps/backend/src','apps/frontend'],{encoding:'utf8'}).trim().split('\n').filter(f=>/\.tsx?$/.test(f)&&!/(\.spec\.|\.test\.|next-env)/.test(f));const set=new Set(files),edges=new Map(),unresolved=[];for(const f of files){const s=fs.readFileSync(f,'utf8');const es=[];for(const m of s.matchAll(/(?:import|export)\s+(type\s+)?[^;'"]*?\bfrom\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g)){const q=m[2]||m[3]||m[4];if(!q.startsWith('.')&&!q.startsWith('@/'))continue;const b=q.startsWith('@/')?'apps/frontend/'+q.slice(2):p.posix.normalize(p.posix.join(p.posix.dirname(f),q));const t=[b,b+'.ts',b+'.tsx',b+'/index.ts',b+'/index.tsx'].find(x=>set.has(x));if(t)es.push({t,type:!!m[1]});else unresolved.push([f,q]);}edges.set(f,es);}for(const mode of ['all','runtime-syntax']){let n=0;const ix=new Map(),lo=new Map(),st=[],on=new Set(),scc=[];function visit(v){ix.set(v,n);lo.set(v,n++);st.push(v);on.add(v);for(const e of edges.get(v)||[]){if(mode==='runtime-syntax'&&e.type)continue;const w=e.t;if(!ix.has(w)){visit(w);lo.set(v,Math.min(lo.get(v),lo.get(w)));}else if(on.has(w))lo.set(v,Math.min(lo.get(v),ix.get(w)));}if(lo.get(v)===ix.get(v)){let w,c=[];do{w=st.pop();on.delete(w);c.push(w)}while(w!==v);if(c.length>1)scc.push(c)}}files.forEach(f=>{if(!ix.has(f))visit(f)});console.log(JSON.stringify({mode,files:files.length,cycles:scc}));}const fan=files.map(f=>({f,in:[...edges].filter(([x,es])=>es.some(e=>e.t===f)).length,out:edges.get(f).length}));console.log(JSON.stringify({fanIn:fan.sort((a,b)=>b.in-a.in).slice(0,15),fanOut:fan.sort((a,b)=>b.out-a.out).slice(0,10),unresolved}));for(const f of files.filter(f=>f.endsWith('.module.ts')))console.log(f+'\n'+fs.readFileSync(f,'utf8'));
```

### Conditional inventory program

```javascript
const fs=require('fs'),cp=require('child_process');const all=cp.execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n');const files=all.filter(f=>((/^apps\/(backend\/src|frontend\/(app|lib|features|hooks|components|types))\//.test(f)&&/\.(ts|tsx|js|mjs|cjs)$/.test(f)&&!/(\.spec\.|\.test\.)/.test(f))||['package.json','pnpm-workspace.yaml','apps/backend/package.json','apps/frontend/package.json','docker-compose.yml','apps/frontend/next.config.mjs'].includes(f)||/^\.github\/workflows\/.*\.yml$/.test(f)));const rules={WSS:/WebSocket|WebSocketGateway|socket\.io|@nestjs\/websockets|\bwss?:\/\/|EventSource/,Redis:/\b(redis|valkey|ioredis)\b/i,Queues:/\b(bullmq|amqp|kafka|rabbitmq)\b|@nestjs\/(bull|microservices)/i,AI:/\b(openai|anthropic|langchain|ollama)\b/i,Payments:/stripe\(|from ['"]stripe|\b(paypal|checkoutSession|paymentIntent)\b/i,EmailPush:/\b(nodemailer|sendgrid|resend|firebase|web-push)\b/i,ObjectStorage:/\b(S3Client|s3|cloudinary|supabase|bucket)\b|aws-sdk/i,Replicas:/readReplica|read_replic|replica(s|tion)?\b/i,Telemetry:/opentelemetry|sentry|prometheus|Analytics|next\/font/};for(const [k,re] of Object.entries(rules)){const hits=[];for(const f of files)fs.readFileSync(f,'utf8').split('\n').forEach((s,i)=>{if(re.test(s))hits.push(f+':'+(i+1))});console.log(JSON.stringify({category:k,hits}));}console.log(JSON.stringify({filesScanned:files.length,appManifests:all.filter(f=>/^apps\/[^/]+\/package.json$/.test(f)),conditionalPaths:all.filter(f=>/^(apps|infra|deploy|helm|k8s|terraform)\//.test(f)&&/(admin|mobile|gateway|worker|queue|k8s|kubernetes|terraform|helm)/i.test(f)),routes:all.filter(f=>/^apps\/frontend\/app\//.test(f)&&/(route\.|page\.)/.test(f))}));
```
