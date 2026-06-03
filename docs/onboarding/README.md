# Onboarding

Yuni организован как небольшой монорепозиторий. Начните с корневого `README.md`, затем переходите в нужную зону проекта.

- `apps/frontend` - текущий Next.js frontend.
- `apps/backend` - NestJS backend foundation.
- `apps/backend/prisma/schema.prisma` - ORM-модель для Prisma Client.
- `apps/backend/prisma/migrations` - основной migration workflow для greenfield PostgreSQL БД.
- `database/schema`, `database/migrations`, `database/seeds` - database reference, будущие вспомогательные материалы и seeds.
- `docs` - документация по архитектуре, security, onboarding и decisions.
- `infra` - будущие docker и operational scripts.

Backend сейчас находится на стадии foundation: есть структура, конфигурация, Prisma schema, health endpoint, auth/session flow, Profiles MVP и Profile Photos / Media MVP. Полной бизнес-логики likes, matches, chat и moderation пока нет.

## Быстрый локальный старт

1. Склонируйте репозиторий и установите зависимости:

```bash
corepack pnpm install --frozen-lockfile
```

2. Скопируйте локальные переменные окружения:

```bash
copy .env.example .env
```

Для локальной связки frontend/backend должны быть выставлены:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
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

## Проверки перед PR

Перед отправкой изменений запустите quality gates из корня репозитория:

```powershell
corepack pnpm install --frozen-lockfile
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yuni_ci?schema=public"
corepack pnpm check
```

Эта команда проверяет backend Prisma validate/generate, backend build/lint, frontend lint/typecheck/build. В CI используется только non-production `DATABASE_URL`; production secrets, deploy и подключение к real DB в quality workflow не используются.

Frontend auth использует реальный backend contract: register/login/refresh/logout/me. Refresh token остается в HttpOnly cookie, access token хранится только в memory state и восстанавливается через `POST /auth/refresh` после reload. Demo/mock state не является production auth source.

Profile Photos / Media MVP использует local uploads в `apps/backend/uploads/profile-photos`; эта папка ignored by git. Для production media storage, CDN, EXIF stripping и async moderation будет отдельный этап.

Yuni стартует с новой пустой БД. Legacy data migration, перенос старых пользователей, сохранение старых ID и cleanup старых данных не нужны.
