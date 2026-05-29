# Onboarding

Yuni организован как небольшой монорепозиторий. Начните с корневого `README.md`, затем переходите в нужную зону проекта.

- `apps/frontend` - текущий Next.js frontend.
- `apps/backend` - NestJS backend foundation.
- `apps/backend/prisma/schema.prisma` - ORM-модель для Prisma Client.
- `apps/backend/prisma/migrations` - основной migration workflow для greenfield PostgreSQL БД.
- `database/schema`, `database/migrations`, `database/seeds` - database reference, будущие вспомогательные материалы и seeds.
- `docs` - документация по архитектуре, security, onboarding и decisions.
- `infra` - будущие docker и operational scripts.

Backend сейчас находится на стадии foundation: есть структура, конфигурация, Prisma schema и health endpoint, но полной бизнес-логики auth, profiles, likes, matches, chat, media и moderation пока нет.

## Быстрый локальный старт

1. Склонируйте репозиторий и установите зависимости:

```bash
corepack pnpm install --frozen-lockfile
```

2. Скопируйте локальные переменные окружения:

```bash
copy .env.example .env
```

3. Создайте или поднимите новую пустую PostgreSQL базу из `DATABASE_URL`.

4. Примените migrations и сгенерируйте Prisma Client:

```bash
corepack pnpm prisma:migrate:dev
corepack pnpm prisma:generate
```

5. Запустите backend и frontend:

```bash
corepack pnpm dev:backend
corepack pnpm dev:frontend
```

Yuni стартует с новой пустой БД. Legacy data migration, перенос старых пользователей, сохранение старых ID и cleanup старых данных не нужны.
