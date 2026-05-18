# Yuni

Yuni - dating app в общем репозитории. Проект постепенно переводится из frontend-прототипа в инженерную основу для разработки frontend, backend, базы данных, документации и инфраструктуры.

## Структура

- `apps/frontend` - текущий Next.js frontend.
- `apps/backend` - NestJS backend foundation.
- `database` - SQL-first схема, будущие миграции и seeds.
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
pnpm install
pnpm prisma:generate
pnpm dev:backend
```

Health endpoint:

```bash
curl http://localhost:4000/health
```

## Environment

Скопируйте `.env.example` в локальный `.env` и замените значения на реальные локальные. Настоящие секреты нельзя хранить в репозитории.
