# Foundation Hardening Plan

## Цель

Yuni сейчас находится на стадии early-stage foundation: структура репозитория уже разделена на frontend, backend, database, docs и infra, но продуктовые модули ещё не готовы к активной разработке.

Главная задача ближайшего этапа - не наращивать UI поверх mock/demo flow, а закрыть database, auth, security и quality foundation. Если сначала закрепить эти правила, profiles, media, discover, likes, matches и chat можно будет развивать без дорогой переделки базовых контрактов.

Целевая архитектура на текущий этап - простой модульный монолит, не микросервисы. Backend должен оставаться понятным NestJS-приложением с явными domain modules, общими security patterns и PostgreSQL как единственным источником правды для критичных integrity rules.

Проект должен быть удобен для команды из 2 человек: быстрый локальный запуск, понятные docs, предсказуемые migrations, небольшие work packages и проверки, которые можно выполнять перед merge. При этом foundation должен выдерживать постепенный рост до MVP, closed testing и дальнейшего масштабирования.

## Текущий статус

- Frontend всё ещё частично является prototype/mock/demo flow. Auth и profile уже подключаются к backend API, но discover, matches и messages пока используют mock-data/demo state.
- Backend имеет NestJS foundation, health endpoint, auth/session flow, Profiles MVP и Profile Photos / Media MVP. Есть конфигурация, ValidationPipe, CORS, Helmet, throttling foundation, PrismaModule, CurrentUser decorator и JWT access guard.
- Database имеет Prisma schema в backend и SQL-first draft в `database/schema`. Эти схемы пока нужно синхронизировать через нормальный migration workflow.
- Product-модуль `profiles` имеет MVP controller/service/DTO для own profile read/update и public profile by handle. `media` имеет Profile Photos / Media MVP для local upload, own photos list, set primary и delete. `likes`, `matches`, `chat`, `moderation` пока только scaffold. Это полезные границы модульного монолита, но для них ещё нет controllers, services, DTO, owner checks, membership checks, serializers и tests.
- Docker/local infra пока не закреплена полностью. `infra` существует как зона ответственности, локальный PostgreSQL workflow ещё нужно оформить, а базовые quality gates уже фиксируются через local commands и GitHub Actions.

## Главные риски

### P0 - закрыть до активной разработки product-модулей

1. Database migrations workflow вместо `prisma db push` как основного пути.
   - Нужен воспроизводимый путь поднятия чистой базы и изменения схемы.
   - `prisma db push` можно оставить только как временный local-only инструмент, если это явно отмечено в docs.

2. Синхронизация Prisma schema и SQL-first constraints.
   - Prisma schema и SQL draft не должны жить как два независимых источника правды.
   - PostgreSQL-specific rules должны попасть в migrations, даже если Prisma не умеет выразить их декларативно.

3. PostgreSQL-specific constraints/indexes:
   - case-insensitive unique email;
   - case-insensitive unique handle;
   - self-like ban;
   - self-match ban;
   - self-block ban;
   - self-report ban;
   - unordered unique match pair;
   - partial indexes/constraints для primary/approved/published photos.

4. Backend age validation 18+.
   - Возраст должен проверяться на backend, а не только на frontend.
   - Нужно обработать invalid date, future date и edge case "ровно 18 лет".

5. Atomic refresh token rotation.
   - Refresh token rotation должна быть защищена от parallel refresh race condition.
   - Старый refresh token должен становиться недействительным ровно один раз.

6. Согласование frontend/backend auth contract.
   - Frontend и backend должны договориться о форме register/login/me/logout/refresh.
   - Birth date format, handle, password rules, cookie/session behavior и error format должны быть едиными.

### P1 - закрыть перед profiles/media/likes/chat

1. Единый pattern для CurrentUser.
   - Все authenticated endpoints должны получать пользователя одинаково.
   - Нельзя смешивать разные форматы user identity внутри modules.

2. Owner checks.
   - Profiles, media, likes, matches, blocks, reports и settings должны проверять authenticated `user_id` на backend.
   - Frontend checks не считаются security boundary.

3. Membership checks для conversations/chat.
   - Chat reads/writes должны проходить только через проверку membership в conversation.
   - Нельзя читать или писать conversation по одному только id.

4. Public/private serializers для profile responses.
   - Private profile mode должен enforced на backend serializers.
   - Public discover card, match profile, own profile и admin/moderation views должны иметь разные response shapes.

5. Pagination pattern.
   - Discover, likes, matches, messages и reports не должны отдавать unbounded lists.
   - Для chat/messages и feed-like flows предпочтителен cursor pagination.

6. Единый формат API errors.
   - Frontend должен получать предсказуемый error shape.
   - Backend не должен отдавать внутренние stack traces, raw Prisma errors или security-sensitive details.

7. Media/photo security foundation:
   - file type validation;
   - size limits;
   - EXIF/metadata stripping plan;
   - owner checks;
   - moderation status;
   - private/public visibility.

### P2 - закрыть до closed testing / production-readiness

1. Backend auth tests.
2. `docker-compose` для локального PostgreSQL.
3. Monitoring/logging/error tracking позже.
4. Email verification/reset password позже.
5. Admin/moderation tools позже.

## Рекомендуемый порядок исправлений

### 1. Database migrations and constraints

Что входит:
- выбрать основной migration workflow;
- создать первые migrations для текущей схемы;
- перенести PostgreSQL-specific constraints/indexes;
- документировать, что является source of truth для database schema;
- убрать `prisma db push` из роли основного процесса.

Acceptance criteria:
- чистая локальная база поднимается через migrations;
- Prisma schema и SQL constraints не конфликтуют;
- есть DB-level защита для email/handle uniqueness, self-actions, unordered matches и photo integrity;
- второй разработчик может поднять базу по README.

Docs:
- `README`;
- `docs/onboarding`;
- `docs/architecture`;
- `docs/decisions`, если выбранный workflow фиксируется как архитектурное решение.

Проверки:
- `prisma validate`;
- `prisma migrate dev` или выбранная equivalent-команда;
- clean database bootstrap;
- ручная проверка критичных constraints.

### 2. Backend age validation 18+

Что входит:
- backend validation для birthDate;
- единый формат даты, предпочтительно `YYYY-MM-DD`;
- проверка invalid/future dates;
- edge case "ровно 18 лет".

Acceptance criteria:
- нельзя зарегистрироваться младше 18 лет через API;
- frontend и backend используют один contract;
- ошибка понятна frontend и не раскрывает лишних деталей.

Docs:
- `docs/api`;
- `docs/security`.

Проверки:
- unit/e2e tests на valid adult, underage, future date, invalid date и ровно 18 лет.

### 3. Safe refresh token rotation

Что входит:
- atomic revoke старого refresh token;
- защита от parallel refresh;
- безопасная обработка reused/revoked token;
- проверка cookie lifetime и path/maxAge.

Acceptance criteria:
- один refresh token нельзя успешно использовать дважды;
- параллельные refresh-запросы не создают две валидные сессии;
- logout остаётся idempotent;
- raw refresh tokens не хранятся в базе и не логируются.

Docs:
- `docs/api`;
- `docs/security`.

Проверки:
- tests на normal refresh;
- tests на reused refresh;
- tests на parallel refresh race.

### 4. Frontend auth integration

Что входит:
- добавить frontend API client;
- ввести `NEXT_PUBLIC_API_URL`;
- подключить register, login, me, refresh/logout flow;
- разделить demo mode и real auth mode;
- добавить loading/error/unauthorized/expired session states.

Acceptance criteria:
- auth UI работает с backend API;
- frontend payloads совпадают с backend DTO;
- cookies используются как session boundary;
- токены не хранятся в `localStorage`.

Docs:
- `docs/api`;
- `docs/onboarding`;
- `README`, если меняются env-переменные.

Проверки:
- frontend typecheck;
- frontend build;
- manual auth smoke test;
- basic unauthorized/expired session scenarios.

### 5. Backend security patterns

Что входит:
- закрепить единый CurrentUser pattern;
- добавить owner check helpers/guards там, где они нужны;
- добавить conversation membership check pattern;
- ввести public/private serializers;
- ввести pagination DTO/pattern;
- привести error responses к единому виду.
- common helpers должны жить в backend foundation, например `apps/backend/src/common/security`, `apps/backend/src/common/serializers` и `apps/backend/src/common/pagination`.
- product modules не должны заново изобретать owner/membership/serializer/pagination rules.

Acceptance criteria:
- новые product modules используют одинаковые security primitives;
- приватные данные не отдаются без backend authorization;
- списочные endpoints имеют limit/cursor или другой явный pagination contract;
- ошибки API предсказуемы для frontend.

Docs:
- `docs/security`;
- `docs/architecture`;
- `docs/api`.

Проверки:
- backend typecheck/build;
- tests на owner denied/allowed;
- tests на membership denied/allowed.

### 6. Quality gates

Что входит:
- поддерживать frontend lint/typecheck/build как обязательные gates;
- поддерживать backend Prisma validate/generate, build и lint как обязательные gates;
- держать local commands и CI workflow синхронизированными;
- не добавлять deploy/secrets в quality workflow.

Acceptance criteria:
- перед merge выполняются install, prisma validate/generate, backend lint/build, frontend lint/typecheck/build и будущие tests;
- CI падает при TypeScript errors;
- локальные команды совпадают с CI.

Docs:
- `README`;
- `docs/onboarding`.

Проверки:
- локальный запуск всех quality commands;
- успешный CI run.

### 7. Local Docker/PostgreSQL workflow

Что входит:
- добавить `docker-compose` для PostgreSQL;
- определить ports, env и volumes;
- добавить healthcheck/wait-for-db подход;
- описать clean setup.

Acceptance criteria:
- новый разработчик может поднять PostgreSQL без ручной установки;
- backend подключается к локальной базе через documented env;
- migrations применяются после старта DB.

Docs:
- `README`;
- `docs/onboarding`;
- `.env.example`, если появляются новые env-переменные.

Проверки:
- `docker compose up`;
- DB healthcheck;
- migrations on clean DB;
- backend health endpoint.

### 8. Profiles API

Что входит:
- own profile read/update;
- public/private profile response shapes;
- privacy mode handling;
- validation DTO;
- frontend profile page integration with backend profile API.

Acceptance criteria:
- пользователь может читать и обновлять только свой private profile data;
- discover/public response не отдаёт private fields;
- backend serializer enforced независимо от frontend;
- frontend не использует mock profile как production source of truth.

Docs:
- `docs/api`;
- `docs/security`.

Проверки:
- tests на owner checks;
- tests на serializer shapes.

### 9. Media/photos API

Что входит:
- local MVP upload flow;
- file type validation для JPEG/PNG/WebP;
- size limit `5 MB`;
- backend-generated storage key strategy;
- EXIF/metadata stripping plan;
- photo moderation and visibility states;
- primary photo rules.

Acceptance criteria:
- нельзя загрузить неподдерживаемый тип или слишком большой файл;
- нельзя менять чужие photos;
- private profile mode не отдаёт user-uploaded photos публично;
- primary photo integrity защищена на DB и service level.
- MVP frontend profile page использует backend media API, а не mock photos как production source of truth.

Docs:
- `docs/api`;
- `docs/security`;
- `docs/architecture`.

Проверки:
- tests на upload validation;
- owner denied/allowed tests;
- response serializer tests.
- manual API smoke на local uploads, public static URL и delete cleanup.

### 10. Discover API

Что входит:
- discover query contract;
- pagination/cursor;
- filtering by visibility, moderation status, blocks and self-exclusion;
- minimal response shape.

Acceptance criteria:
- endpoint не возвращает самого пользователя;
- endpoint учитывает blocks;
- endpoint возвращает только eligible profiles/photos;
- endpoint имеет limit/cursor.

Docs:
- `docs/api`;
- `docs/architecture`.

Проверки:
- tests на blocks;
- tests на pagination;
- tests на private/public visibility.

### 11. Likes/matches API

Что входит:
- like/pass endpoints;
- self-like prevention;
- block-aware behavior;
- atomic match creation;
- duplicate match prevention.

Acceptance criteria:
- нельзя лайкнуть себя;
- reversed match pair не создаёт duplicate;
- match creation атомарно;
- blocks исключают like/match flow.

Docs:
- `docs/api`;
- `docs/security`.

Проверки:
- tests на self-like;
- tests на duplicate/reversed match;
- transaction/concurrency scenario для match creation.

### 12. Basic chat API

Что входит:
- conversations list;
- messages list with cursor pagination;
- send message;
- membership checks for reads/writes.

Acceptance criteria:
- не-member не может читать conversation;
- не-member не может писать в conversation;
- messages не отдаются unbounded list;
- sender должен быть участником conversation.

Docs:
- `docs/api`;
- `docs/security`.

Проверки:
- membership allowed/denied tests;
- pagination tests;
- message ownership tests.

### 13. Blocks/reports API

Что входит:
- block/unblock;
- report user/profile/message;
- self-block/self-report prevention;
- report reason validation;
- moderation visibility around blocked users.

Acceptance criteria:
- нельзя block/report себя;
- blocks влияют на discover/likes/matches/chat;
- reports имеют валидные reason/status;
- приватные данные не раскрываются через moderation endpoints.

Docs:
- `docs/api`;
- `docs/security`;
- `docs/architecture`.

Проверки:
- tests на self-block/self-report;
- tests на block effects;
- tests на report validation.

### 14. MVP polish and closed testing

Что входит:
- закрыть UX gaps;
- проверить onboarding;
- проверить privacy/security flows;
- добавить минимальные operational notes;
- подготовить closed testing checklist.

Acceptance criteria:
- MVP можно протестировать end-to-end;
- критичные auth/media/chat/privacy flows покрыты проверками;
- docs позволяют поднять проект и понять текущие ограничения.

Docs:
- `README`;
- `docs/onboarding`;
- `docs/security`;
- `docs/api`.

Проверки:
- full local smoke test;
- CI green;
- manual privacy/security checklist.

## Что не трогать пока

Сейчас не нужно:

- микросервисы;
- Redis/event bus без реальной необходимости;
- сложная recommendation system;
- production CDN/media pipeline до базового upload flow;
- сложная admin panel до базовых moderation flows;
- ML moderation на старте;
- преждевременная оптимизация под огромные нагрузки без базовых indexes/pagination.

Эти темы можно вернуться обсуждать после того, как MVP foundation будет устойчивым: migrations, auth, owner checks, media rules, pagination, quality gates и local dev workflow.

## Security principles

- Не хранить raw passwords.
- Не хранить raw refresh tokens.
- Не логировать access tokens, refresh tokens, cookies, passwords, birthDate, private profile fields и messages.
- Все входные данные валидировать на backend.
- Доступ к приватным данным проверять на backend.
- Profiles, media, likes, matches, chat и moderation строить вокруг authenticated `user_id`.
- Chat reads/writes делать только через conversation membership.
- Private profile mode enforced на backend serializers, а не только на frontend.
- Media/photos должны иметь owner checks, moderation status и visibility rules.
- Frontend authorization checks можно использовать для UX, но не как security boundary.
- Database constraints должны защищать критичные invariants даже при ошибке в application code.

## Documentation rules

Документация обновляется вместе с кодом:

- `README` - если меняется запуск, env или структура проекта.
- `docs/api` - если меняются endpoints, contracts, errors или auth/session behavior.
- `docs/security` - если меняются права доступа, токены, cookies, PII, media, chat или auth rules.
- `docs/architecture` - если меняются модули, boundaries или общий pattern.
- `docs/onboarding` - если меняется локальный запуск.
- `docs/decisions` - если принято важное архитектурное решение.

Если изменение затрагивает database/auth/security boundary, docs update считается частью Definition of Done, а не отдельной задачей на потом.

## Definition of Done для этого шага

Документ считается готовым, если:

- создан `docs/architecture/foundation-hardening-plan.md`;
- есть P0/P1/P2 список;
- есть рекомендуемый порядок исправлений;
- есть список "не трогать пока";
- есть security principles;
- есть documentation rules;
- понятно, что дальше первым делом надо делать database migrations and constraints;
- application code не изменён.

Для этого шага не нужно менять runtime-код, Prisma schema, migrations, package scripts, Docker configs или frontend/backend implementation files.
