# Backend Yuni

Это базовая основа backend-приложения Yuni на NestJS.

Сейчас здесь есть каркас модулей, подключение конфигурации, Prisma, базовые security-настройки, `GET /health` и минимальный auth/session flow. Полная бизнес-логика profiles, likes, matches, chat, media и moderation пока намеренно не реализована.

## Структура

- `src/main.ts` - запуск NestJS, CORS, Helmet, ValidationPipe и общий фильтр ошибок.
- `src/app.module.ts` - корневой модуль приложения.
- `src/config` - загрузка и проверка переменных окружения.
- `src/common` - общие инфраструктурные части, включая Prisma и error filter.
- `src/modules/health` - рабочий health endpoint.
- `src/modules/auth` - минимальные `register`, `login`, `refresh`, `logout`, `me`.
- `src/modules/users`, `profiles`, `media`, `likes`, `matches`, `chat`, `moderation` - границы будущих доменных модулей.
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
- `database/schema/schema.sql` остается SQL-first reference/documentation. Реальный source of truth для применения схемы - `prisma/schema.prisma` вместе с `prisma/migrations`.
- PostgreSQL-specific expression/partial indexes и check constraints сохраняются в `migration.sql`.
