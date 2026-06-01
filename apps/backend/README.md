# Backend Yuni

Это базовая основа backend-приложения Yuni на NestJS.

Сейчас здесь есть каркас модулей, подключение конфигурации, Prisma, базовые security-настройки, `GET /health`, auth/session flow и Profiles MVP. Полная бизнес-логика likes, matches, chat, media и moderation пока намеренно не реализована.

## Структура

- `src/main.ts` - запуск NestJS, CORS, Helmet, ValidationPipe и общий фильтр ошибок.
- `src/app.module.ts` - корневой модуль приложения.
- `src/config` - загрузка и проверка переменных окружения.
- `src/common` - общие инфраструктурные части, включая Prisma, error filter, security helpers, serializers и pagination helpers.
- `src/modules/health` - рабочий health endpoint.
- `src/modules/auth` - `register`, `login`, `refresh`, `logout`, `me`.
- `src/modules/profiles` - MVP endpoints `GET /profiles/me`, `PATCH /profiles/me`, `GET /profiles/:handle`.
- `src/modules/users`, `media`, `likes`, `matches`, `chat`, `moderation` - границы будущих доменных модулей.
- `prisma/schema.prisma` - ORM-модель для Prisma Client.
- `prisma/migrations` - основной способ применения greenfield PostgreSQL schema.

## Локальный запуск

Из корня репозитория:

```bash
corepack pnpm install --frozen-lockfile
copy .env.example .env
corepack pnpm prisma:migrate:dev
corepack pnpm prisma:generate
corepack pnpm dev:backend
```

Перед `prisma:migrate:dev` в PostgreSQL должна существовать новая пустая база из `DATABASE_URL`, например `yuni`.

Для применения migrations на сервере или в CI используйте:

```bash
corepack pnpm prisma:migrate:deploy
```

Для локального сброса greenfield базы используйте только осознанно:

```bash
corepack pnpm prisma:migrate:reset
```

Проверка:

```bash
curl http://localhost:4000/health
```

Минимальная auth-проверка:

```bash
curl -i -c cookies.txt -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"handle\":\"test_user\",\"displayName\":\"Тест\",\"birthDate\":\"2000-01-01\"}"
```

После register/login скопируйте `accessToken` из ответа:

```bash
curl -i http://localhost:4000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

Проверка refresh/logout с cookie jar:

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:4000/auth/refresh
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:4000/auth/logout
```

Минимальная profile-проверка:

```bash
curl -i http://localhost:4000/profiles/me \
  -H "Authorization: Bearer <accessToken>"

curl -i -X PATCH http://localhost:4000/profiles/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d "{\"displayName\":\"Alex\",\"bio\":\"Short bio\",\"city\":\"Almaty\",\"country\":\"KZ\",\"isDiscoverable\":true}"

curl -i http://localhost:4000/profiles/test_user \
  -H "Authorization: Bearer <accessToken>"
```

Для запуска напрямую из backend:

```bash
pnpm --dir apps/backend dev
```

## Важно

- Сырые пароли не хранятся: будущая реализация должна сохранять только `password_hash`.
- Сырые refresh tokens не хранятся: сохраняется только `token_hash`.
- Refresh token передается через HttpOnly cookie `yuni_refresh`; access token возвращается в JSON и используется как Bearer token.
- Prisma migrations являются основным workflow применения схемы. `prisma db push` не используется как основной путь.
- Проект стартует с новой пустой PostgreSQL БД; legacy data migration, перенос старых пользователей и cleanup старых данных не нужны.
- Доступ к приватным данным, чатам и профилям должен строиться вокруг `user_id`, membership checks и owner checks.
- Profile update endpoints должны брать owner identity только из `CurrentUser`, а не из body/query/path.
- Для будущих endpoints используйте `src/common/security`:
  - `assertOwner` / `assertSameUser` для owner-only действий;
  - `assertConversationMember` для chat reads/writes;
  - `assertMatchParticipant` для match-scoped действий;
  - `assertCanAccessProfile` / `assertCanAccessPhoto` для public/private visibility.
- Response shapes должны проходить через serializers из `src/common/serializers`: public profile не должен отдавать `email`, `passwordHash`, `birthDate`, refresh/session fields, deleted/internal moderation fields или private settings.
- List endpoints должны использовать cursor pagination из `src/common/pagination` с default limit `20` и max limit `50`. Unbounded lists запрещены.
- `database/schema/schema.sql` остается SQL-first reference/documentation. Реальный source of truth для применения схемы - `prisma/schema.prisma` вместе с `prisma/migrations`.
- PostgreSQL-specific expression/partial indexes и check constraints сохраняются в `migration.sql`.
