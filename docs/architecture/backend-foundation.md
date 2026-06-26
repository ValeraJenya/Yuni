# Backend Foundation

Backend Yuni строится на NestJS, Prisma и PostgreSQL. MVP реализован: все основные домены auth, profiles, media, likes, matches, discovery, chat, moderation и notifications работают как отдельные NestJS-модули.

## Цели

- Подготовить понятный NestJS-проект в `apps/backend`.
- Подключить Prisma как слой доступа к PostgreSQL.
- Сохранить соответствие финальной SQL-first доменной модели.
- Заранее заложить безопасные правила валидации, CORS и обработки ошибок.
- Разделить реализацию по доменным модулям.

## Модули

- `health` - рабочий `GET /health` для проверки запуска.
- `auth` - минимальный register/login/refresh/logout/me flow, password hashing и refresh token hashing.
- `users` - scaffold-only; account-level операции за пределами auth/session не реализованы.
- `profiles` - профиль, handle, privacy/visibility и discovery eligibility.
- `media` - фото, moderation status, primary photo и публикация.
- `likes` - Step 12 MVP for expiring `like` and `pass`/`skip`; `superlike` остается future work.
- `matches` - Step 13 MVP for mutual active LIKE matches with 7-day request-time expiration.
- `chat` - conversations, participants, messages и membership checks.
- `moderation` - blocks и reports.

## Prisma

`apps/backend/prisma/schema.prisma` отражает текущую SQL-first схему: users, refresh_tokens, profiles, profile_photos, interests, likes, matches, conversations, messages, blocks, reports, privacy_settings и notification_settings.

Некоторые PostgreSQL-ограничения не выражаются напрямую в Prisma schema: expression indexes вроде `lower(handle)` и partial indexes для primary approved photo. Их нужно сохранить на уровне SQL миграций, когда будет выбран migration workflow.

## Security Foundation

- `ValidationPipe` включен глобально.
- Включены `whitelist`, `forbidNonWhitelisted` и `transform`.
- Подключен Helmet.
- CORS работает только с `FRONTEND_URL` и `CORS_ALLOWED_ORIGINS`, без wildcard.
- Общий фильтр ошибок не возвращает stack trace клиенту.
- Env validation требует `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` и проверяет `PORT`.
