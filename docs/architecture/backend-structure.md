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
- global `ThrottlerGuard`;
- `PrismaModule`;
- domain modules: `AuthModule`, `UsersModule`, `ProfilesModule`, `MediaModule`, `LikesModule`, `MatchesModule`, `DiscoveryModule`, `ChatModule`, `ModerationModule`;
- `HealthModule`.

### `main.ts`

`main.ts` отвечает за application bootstrap:

- Helmet;
- static serving for local profile photo MVP uploads;
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

### `common/`

`common/` содержит cross-cutting infrastructure, not product business logic.

- `common/prisma` - `PrismaModule` and `PrismaService`.
- `common/filters` - global error filtering.
- `common/security` - shared access-control helpers like `assertOwner`, `assertCanAccessProfile`, `assertConversationMember`.
- `common/serializers` - public/self response shapes such as `toSafeAuthUser`, `toSelfProfile`, `toPublicProfile`, `toPublicProfilePhotos`.
- `common/pagination` - cursor pagination DTO/helpers for future list endpoints.

`common` не должен становиться свалкой бизнес-логики. Если правило относится к конкретному домену, оно должно жить в соответствующем module service.

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
- safe auth user response.

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

Owns profile photos, local MVP storage, upload validation, owner checks and self photo response shape.

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

Chat, messages, notifications and unmatch flows are outside Step 13. Blocks/reports are handled by `moderation` in Step 14.

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

Realtime, typing indicators, read receipts, notifications, attachments/media messages, encryption, admin panel and complex chat search are outside Step 16.

### `moderation`

Implemented Step 14 MVP.

- `POST /blocks/:targetUserId`
- `DELETE /blocks/:targetUserId`
- `GET /blocks/me`
- `POST /reports`

Owns block/report API, self-block/self-report rejection, idempotent duplicate block/unblock behavior, ending active matches on block, safe public moderation response shapes and helper methods consumed by profiles/likes/matches. Future admin review workflow remains outside Step 14.

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
