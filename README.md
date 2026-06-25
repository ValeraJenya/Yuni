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

Frontend auth flow использует backend API из `NEXT_PUBLIC_API_URL` и HttpOnly refresh cookie, которую выставляет backend. Access token хранится только в памяти React state и восстанавливается после reload через `POST /auth/refresh`; токены нельзя хранить в `localStorage` или `sessionStorage`.

## Backend

Backend находится в `apps/backend`. Сейчас реализованы foundation, Prisma schema, конфигурация, security baseline, `GET /health`, auth/session flow, Profiles MVP и Profile Photos / Media MVP. Полная бизнес-логика likes, matches, chat и moderation будет добавляться следующими шагами.

## Local Docker Workflow

Step 19 adds a local Docker workflow for running the monorepo with PostgreSQL, backend and frontend. It is for local development and production preparation only; it is not a server deployment, reverse proxy, HTTPS or cloud storage setup.

Start from a local env file:

```powershell
copy .env.example .env
```

The example values are safe development placeholders. Keep real secrets in `.env` only and do not commit them.

Build and start PostgreSQL:

```powershell
corepack pnpm docker:config
corepack pnpm docker:build
docker compose up -d postgres
docker compose ps
docker compose logs postgres --tail=100
```

Apply existing Prisma migrations explicitly. Backend startup does not run migrations automatically:

```powershell
corepack pnpm docker:migrate
```

Start backend and frontend:

```powershell
docker compose up -d backend frontend
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
```

Open:

- frontend: `http://localhost:3000`
- backend health: `http://localhost:4000/health`

PowerShell checks:

```powershell
Invoke-WebRequest http://localhost:4000/health
Invoke-WebRequest http://localhost:3000
```

Useful local commands:

```powershell
corepack pnpm docker:logs
corepack pnpm docker:down
corepack pnpm docker:build
```

To reset the local Docker database, use the explicit destructive dev command and then run migrations again:

```powershell
corepack pnpm docker:reset:dev
docker compose up -d postgres
corepack pnpm docker:migrate
docker compose up -d backend frontend
```

`NEXT_PUBLIC_API_URL` stays browser-facing, for example `http://localhost:4000`. Inside Docker, backend uses the PostgreSQL service name `postgres` in its `DATABASE_URL`.

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

Profile Photos / Media MVP использует `ProfilePhotoStorage` boundary. Текущий local adapter сохраняет uploaded files в `apps/backend/uploads/profile-photos`, эта папка не коммитится, а публичный контракт URL остается `/uploads/profile-photos/...`. Production S3/CDN/media pipeline будет отдельным шагом после базового upload/owner/visibility flow.

## Environment

Скопируйте `.env.example` в локальный `.env` и замените значения на реальные локальные. Настоящие секреты нельзя хранить в репозитории.

Для локальной связки frontend/backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Quality gates

Перед PR запускайте локальные проверки из корня проекта. Для Prisma validate нужен локальный или временный non-production `DATABASE_URL`:

```powershell
corepack pnpm install --frozen-lockfile
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yuni_ci?schema=public"
corepack pnpm check
```

`corepack pnpm check` выполняет backend Prisma validate/generate, backend tests, backend build/lint, frontend lint/typecheck/build. Frontend lint и backend tests являются обязательными проверками.

GitHub Actions workflow `quality-gates` запускается на `pull_request` и `push` в `main`. CI использует fake non-production `DATABASE_URL` только для Prisma validate/generate, backend tests не используют real DB, production secrets не используются и deploy не выполняется.

## Documentation

Ключевые architecture docs находятся в `docs/architecture`:

- `backend-structure.md`;
- `frontend-structure.md`;
- `module-boundaries.md`;
- `program-flow-map.md`;
- `scaling-roadmap.md`.

Правила выдачи данных зафиксированы в `docs/security/data-exposure-rules.md`.
