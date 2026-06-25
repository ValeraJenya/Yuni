# Backend Structure

Этот документ фиксирует текущую backend-структуру Yuni и правила, по которым новые NestJS-модули должны добавляться дальше.

## Current Structure

Backend находится в `apps/backend`.

```text
apps/backend/src/
  app.module.ts
  main.ts
  config/
  common/
  modules/
```

### `app.module.ts`

`app.module.ts` собирает корневое приложение:

- `ConfigModule` с env validation;
- global `ThrottlerGuard` fallback: `300` requests / `10 minutes` / IP;
- `RateLimitModule` для endpoint-specific anti-spam policies;
- `PrismaModule`;
- domain modules: `AuthModule`, `UsersModule`, `ProfilesModule`, `MediaModule`, `LikesModule`, `MatchesModule`, `DiscoveryModule`, `ChatModule`, `ModerationModule`, `NotificationsModule`;
- `HealthModule`.

### `main.ts`

`main.ts` отвечает за application bootstrap:

- Helmet;
- static serving for local profile photo adapter uploads;
- cookie parser;
- CORS with configured origins, not wildcard credentials;
- global `ValidationPipe` with whitelist, transform and forbid non-whitelisted fields;
- global exception filter.

### `config/`

`config/` содержит application config:

- `app.config.ts` - app environment, port, frontend URL and CORS origins;
- `auth.config.ts` - JWT and refresh cookie settings;
- `cors.ts` - allowed origins builder;
- `env.validation.ts` - required env validation.

### Local Docker runtime

Backend local Docker image is defined in `apps/backend/Dockerfile` and is wired by root `docker-compose.yml`.

Rules:

- Docker is a local development workflow, not production deployment.
- Backend container uses `PORT=4000` internally and publishes `${BACKEND_PORT:-4000}` on the host.
- Inside Compose, `DATABASE_URL` points to PostgreSQL by service name `postgres`.
- Prisma migrations are not run automatically when backend starts.
- `docker:migrate` explicitly runs `prisma migrate deploy`.
- Local profile photo adapter uploads are mounted at `apps/backend/uploads`, which remains ignored by git.
- Backend healthcheck uses `GET /health`.

### `common/`

`common/` содержит cross-cutting infrastructure, not product business logic.

- `common/prisma` - `PrismaModule` and `PrismaService`.
- `common/filters` - global error filtering.
- `common/security` - shared access-control helpers like `assertOwner`, `assertCanAccessProfile`, `assertConversationMember`.
- `common/serializers` - public/self response shapes such as `toSafeAuthUser`, `toSelfProfile`, `toPublicProfile`, `toPublicProfilePhotos`.
- `common/pagination` - cursor pagination DTO/helpers for future list endpoints.
- `common/rate-limit` - in-memory endpoint-specific anti-spam limiter, guard and decorator.

`common` не должен становиться свалкой бизнес-логики. Если правило относится к конкретному домену, оно должно жить в соответствующем module service.

`common/rate-limit` is cross-cutting infrastructure only. It owns counters, window calculation, safe `429` shaping and decorator metadata. It must not own auth decisions, block rules, profile visibility, conversation membership or product-specific state transitions.

## Standard Module Shape

Новый backend module должен стремиться к такому формату:

```text
modules/<feature>/
  dto/
  types/
  constants/
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.module.ts
```

Не каждый module обязан иметь все папки с первого дня. Если DTO/types/constants не нужны, их можно не создавать до появления реальной потребности.

## Layer Roles

- Controller принимает HTTP request, читает params/body/current user/cookies/files и вызывает service.
- DTO описывает и валидирует input contract.
- Service содержит business logic, authorization checks, Prisma calls and transactions.
- Prisma работает с PostgreSQL and migrations-backed schema.
- Serializer формирует public/self/admin response shape.
- Module собирает controller, service and imports.

Controller не должен содержать business logic. Service не должен отдавать raw Prisma object наружу без serializer or explicit response shape.

## Current Modules

### `health`

Implemented.

- `GET /health`
- Uses `HealthController` and `HealthService`.

### `auth`

Implemented foundation.

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Owns auth/session/token lifecycle:

- password hashing;
- backend 18+ age validation during register;
- refresh token hashing;
- atomic single-use refresh rotation;
- HttpOnly refresh cookie;
- safe auth user response;
- register/login/refresh/logout endpoint-specific anti-spam limits.

### `users`

Scaffold-only.

Future responsibility: account-level user operations that are not auth/session lifecycle and not profile questionnaire behavior.

### `profiles`

Implemented MVP.

- `GET /profiles/me`
- `PATCH /profiles/me`
- `GET /profiles/:handle`

Owns profile questionnaire data, public/private profile serialization and profile access behavior.

### `media`

Implemented Profile Photos / Media MVP.

- `GET /media/profile-photos/me`
- `POST /media/profile-photos`
- `PATCH /media/profile-photos/:photoId/primary`
- `DELETE /media/profile-photos/:photoId`

Owns profile photos, upload validation, owner checks, self photo response shape and the `ProfilePhotoStorage` boundary. The current implementation uses a local adapter behind that boundary.

### `likes`

Implemented Step 12 MVP.

- `POST /likes/:targetProfileUserId`
- `POST /likes/:targetProfileUserId/skip`

Owns expiring LIKE/SKIP interactions:

- actor identity from `CurrentUser`;
- `targetProfileUserId` equals `profiles.user_id`;
- self-like/self-skip rejection;
- target active/not deleted and profile access checks;
- LIKE cooldown of 3 days;
- SKIP/PASS cooldown of 1 day;
- active duplicate conflict handling;
- block-aware rejection through `ModerationService`;
- safe response shape.
- shared LIKE/SKIP anti-spam limit of `60 / hour / user`.

Superlike and chat effects are outside Step 12. Matches are delegated to `MatchesService`; block effects are enforced by Step 14.

### `matches`

Implemented Step 13 MVP.

- `GET /matches/me`

Owns mutual active LIKE matches:

- match creation after successful LIKE via `MatchesService`;
- reciprocal active LIKE detection;
- canonical `userAId/userBId` pair normalization;
- 7-day active window;
- active filtering by `status=active` and `expiresAt > now`;
- block-aware creation/list filtering through `ModerationService`;
- safe active match list response.

Chat and unmatch flows are outside Step 13. Blocks/reports are handled by `moderation` in Step 14. In-app notifications are handled by `NotificationsModule` in Step 18.

### `discovery`

Implemented Step 15 MVP.

- `GET /discovery/cards`

Owns backend discovery card listing:

- actor identity from `CurrentUser`;
- cursor pagination with max `20`;
- stable ordering by profile creation and user id;
- filtering out self, inactive/deleted users, incomplete/non-discoverable/private profiles, blocked pairs, active LIKE/SKIP cooldowns and active matches;
- allowing rediscovery after LIKE/SKIP or match expiration;
- safe public card response with computed age and public photo URLs only.
- discovery cards anti-scraping limit of `120 / 10 minutes / user`.

Ranking, random ordering, geolocation/radius, premium filters, chat/messages, notifications and admin/moderation panel behavior are outside Step 15.

### `chat`

Implemented Step 16 MVP.

- `GET /chat/conversations`
- `GET /chat/conversations/:conversationId/messages`
- `POST /chat/conversations/:conversationId/messages`
- `POST /matches/:matchId/conversation`

Owns conversations, participants, messages and membership checks:

- actor/sender identity from `CurrentUser`;
- start conversation only from an existing match;
- idempotent existing conversation return;
- transaction for conversation plus participant rows;
- active participant checks for list/read/send;
- block-aware list/read/send behavior through `ModerationService`;
- plain text message validation and safe response shapes.
- send-message anti-spam limits of `30 / minute / user` and `120 / 10 minutes / user`.

Realtime, typing indicators, read receipts, attachments/media messages, encryption, admin panel and complex chat search are outside Step 16. In-app message notifications are handled by Step 18.

### `moderation`

Implemented Step 14 MVP.

- `POST /blocks/:targetUserId`
- `DELETE /blocks/:targetUserId`
- `GET /blocks/me`
- `POST /reports`

Owns block/report API, self-block/self-report rejection, idempotent duplicate block/unblock behavior, ending active matches on block, safe public moderation response shapes and helper methods consumed by profiles/likes/matches. Future admin review workflow remains outside Step 14.

Report creation has an endpoint-specific anti-spam limit of `10 / hour / user`.

### `notifications`

Implemented Step 18 MVP.

- `GET /notifications`
- `GET /notifications/unread-count`
- `POST /notifications/:notificationId/read`
- `POST /notifications/read-all`

Owns in-app notification events and lifecycle:

- actor/recipient identity from backend domain events and `CurrentUser`;
- match-created notifications for both match participants after a new match row is created;
- message-received notifications for the other active conversation participant after successful send;
- unread/read state through `readAt`;
- cursor pagination and unread count scoped to current user;
- block-aware creation and visibility;
- safe response shape without message body, raw Prisma rows or private profile/media fields.

Push/email notifications, WebSocket/realtime, queues/workers, Redis/Valkey, notification preferences UI and admin notification tools are outside Step 18.

## Adding New Backend Work

For each new backend feature:

1. Start in the owning module.
2. Define request DTOs before accepting body data.
3. Use `CurrentUser` for authenticated identity.
4. Do not trust `userId`, `profileId`, `photoId`, `conversationId`, `isOwner`, `isMember`, `isAdmin` or similar frontend fields as proof of access.
5. Put owner/membership checks in service logic.
6. Use transactions where a domain state change must be atomic.
7. Return serializers or explicit response shapes, not raw Prisma objects.
8. Update `docs/api`, `docs/security` and architecture docs when contracts or boundaries change.
