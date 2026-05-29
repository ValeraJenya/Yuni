# Yuni

Yuni - dating app в общем репозитории. Проект постепенно переводится из frontend-прототипа в инженерную основу для разработки frontend, backend, базы данных, документации и инфраструктуры.

## Структура

- `apps/frontend` - текущий Next.js frontend.
- `apps/backend` - NestJS backend foundation.
- `database` - SQL-first reference, database documentation и будущие seeds.
- `docs` - архитектура, security, onboarding и decisions.
- `infra` - будущие docker/scripts материалы.

## Frontend

Запуск из корня:

```bash
pnpm dev
```

Или явно:

```bash
pnpm dev:frontend
```

## Backend

Backend находится в `apps/backend`. Сейчас реализованы foundation, Prisma schema, конфигурация, security baseline и `GET /health`. Полная бизнес-логика auth/profiles/likes/matches/chat/media/moderation будет добавляться следующими шагами.

Минимальная проверка:

```bash
corepack pnpm install --frozen-lockfile
copy .env.example .env
corepack pnpm prisma:migrate:dev
corepack pnpm prisma:generate
corepack pnpm dev:backend
```

Health endpoint:

```bash
curl http://localhost:4000/health
```

Auth foundation:

```bash
curl -i -c cookies.txt -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"handle\":\"test_user\",\"displayName\":\"Тест\",\"birthDate\":\"2000-01-01\"}"
```

Для migrations нужна новая пустая PostgreSQL база из `DATABASE_URL`, например `yuni`. Проект стартует как greenfield: legacy DB migration, перенос старых пользователей, сохранение старых ID и cleanup старых данных не нужны и не планируются.

Основной database workflow:

```bash
corepack pnpm prisma:migrate:dev
corepack pnpm prisma:generate
```

Для server/CI применяется:

```bash
corepack pnpm prisma:migrate:deploy
```

`prisma db push` не является основным workflow проекта. PostgreSQL-specific constraints и indexes хранятся в Prisma migrations.

## Environment

Скопируйте `.env.example` в локальный `.env` и замените значения на реальные локальные. Настоящие секреты нельзя хранить в репозитории.
