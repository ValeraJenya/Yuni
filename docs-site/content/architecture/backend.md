---
title: "Backend"
weight: 10
---


Исходник: `docs/architecture/backend-structure.md`. Backend находится в `apps/backend`.

## Структура

```text
apps/backend/src/
  app.module.ts
  main.ts
  config/
  common/
  modules/
```

## `app.module.ts`

Собирает корневое приложение:

- `ConfigModule` с env validation
- Global `ThrottlerGuard` fallback: 300 req / 10 min / IP
- `RateLimitModule` для endpoint-specific anti-spam
- `PrismaModule`
- Domain modules: Auth, Users, Profiles, Media, Likes, Matches, Discovery, Chat, Moderation, Notifications
- `HealthModule`

## `main.ts`

Application bootstrap:

- Helmet
- Static serving для local profile photo uploads
- Cookie parser
- CORS с configured origins (не wildcard)
- Global `ValidationPipe` (whitelist, transform, forbid non-whitelisted)
- Global exception filter

## `config/`

- `app.config.ts` — environment, port, frontend URL, CORS origins
- `auth.config.ts` — JWT и refresh cookie settings
- `cors.ts` — allowed origins builder
- `env.validation.ts` — required env validation

## `common/`

Cross-cutting infrastructure:

| Папка | Назначение |
|---|---|
| `common/prisma` | `PrismaModule` и `PrismaService` |
| `common/filters` | Global error filtering |
| `common/security` | `assertOwner`, `assertCanAccessProfile`, `assertConversationMember` и др. |
| `common/serializers` | `toSafeAuthUser`, `toSelfProfile`, `toPublicProfile`, `toPublicProfilePhotos` |
| `common/pagination` | Cursor pagination DTO/helpers |
| `common/rate-limit` | In-memory endpoint-specific anti-spam limiter |

`common` не должен содержать бизнес-логику доменов.

## Стандартная форма модуля

```text
modules/<feature>/
  dto/
  types/
  constants/
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.module.ts
```

## Роли слоёв

| Слой | Роль |
|---|---|
| Controller | Принимает HTTP request, читает params/body/user, вызывает service |
| DTO | Описывает и валидирует input contract |
| Service | Business logic, authorization checks, Prisma calls, transactions |
| Prisma | Работает с PostgreSQL через migrations-backed schema |
| Serializer | Формирует public/self/admin response shape |
| Module | Собирает controller, service, imports |

Controller не содержит business logic. Service не отдаёт raw Prisma objects без serializer.

## Local Docker runtime

- Backend контейнер: `PORT=4000`
- `DATABASE_URL` указывает на PostgreSQL по service name `postgres`
- Prisma migrations не запускаются автоматически при старте
- `docker:migrate` явно запускает `prisma migrate deploy`
- Backend healthcheck: `GET /health`

## Реализованные модули

| Модуль | Endpoints |
|---|---|
| health | `GET /health` |
| auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| users | scaffold only |
| profiles | `GET /profiles/me`, `PATCH /profiles/me`, `GET /profiles/:handle` |
| media | `GET /media/profile-photos/me`, `POST /media/profile-photos`, `PATCH /media/profile-photos/:photoId/primary`, `DELETE /media/profile-photos/:photoId` |
| likes | `POST /likes/:targetProfileUserId`, `POST /likes/:targetProfileUserId/skip` |
| matches | `GET /matches/me` |
| discovery | `GET /discovery/cards` |
| chat | `GET /chat/conversations`, `GET /chat/conversations/:conversationId/messages`, `POST /chat/conversations/:conversationId/messages`, `POST /matches/:matchId/conversation` |
| moderation | `POST /blocks/:targetUserId`, `DELETE /blocks/:targetUserId`, `GET /blocks/me`, `POST /reports` |
| notifications | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:notificationId/read`, `POST /notifications/read-all` |
