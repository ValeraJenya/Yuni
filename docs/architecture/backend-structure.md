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
- domain modules: `AuthModule`, `UsersModule`, `ProfilesModule`, `MediaModule`, `LikesModule`, `MatchesModule`, `ChatModule`, `ModerationModule`;
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

Scaffold-only.

Future responsibility: like, dislike/pass and superlike actions.

### `matches`

Scaffold-only.

Future responsibility: match state and match participant operations.

### `chat`

Scaffold-only.

Future responsibility: conversations, participants, messages and membership checks.

### `moderation`

Scaffold-only.

Future responsibility: reports, blocks, abuse review and future admin moderation workflows.

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
