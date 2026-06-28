---
title: "Local Docker Workflow"
weight: 10
---


Исходник: `docs/onboarding/local-docker-workflow.md`. Запуск Yuni локально через Docker Compose: PostgreSQL, NestJS backend и Next.js frontend.

Это **local development workflow**. Не добавляет production deployment, HTTPS, reverse proxy, Redis, queues, S3, realtime, email или push notifications.

## Setup

```powershell
copy .env.example .env
```

Держи `.env` локально. Example values — только development placeholders.

**Default URLs:**

| Сервис | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:4000` |
| Backend health | `http://localhost:4000/health` |
| PostgreSQL | `localhost:5432` |

Если порт занят — переопределить в `.env`: `POSTGRES_PORT`, `BACKEND_PORT` или `FRONTEND_PORT`.

## Start

Validate Compose и собрать образы:

```powershell
corepack pnpm docker:config
corepack pnpm docker:build
```

Запустить PostgreSQL первым:

```powershell
docker compose up -d postgres
docker compose ps
docker compose logs postgres --tail=100
```

Применить migrations явно:

```powershell
corepack pnpm docker:migrate
```

Запустить apps:

```powershell
docker compose up -d backend frontend
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
```

Проверить health:

```powershell
Invoke-WebRequest http://localhost:4000/health
Invoke-WebRequest http://localhost:3000
```

## Day-to-day команды

```powershell
corepack pnpm docker:up      # Запустить все сервисы
corepack pnpm docker:logs    # Логи всех сервисов
corepack pnpm docker:down    # Остановить все сервисы
corepack pnpm docker:build   # Пересобрать образы
```

`docker:up` запускает все сервисы. Если volume базы новый — запустить `docker:migrate` перед использованием.

## Database reset

Удаляет локальный Docker PostgreSQL volume:

```powershell
corepack pnpm docker:reset:dev
```

После reset — запустить сервисы и применить migrations снова:

```powershell
docker compose up -d postgres
corepack pnpm docker:migrate
docker compose up -d backend frontend
```

## Manual smoke checks

- `GET /health` возвращает `status: ok`
- Frontend открывается на `http://localhost:3000`
- Register/login/refresh/logout работают с browser cookies
- Frontend API calls идут на `http://localhost:4000`
- Profile photo upload persist через local storage adapter
- Logout/refresh cookies не заблокированы CORS

## Security notes

- Не коммитить `.env`
- Не коммитить uploads, `.next`, dist, node_modules или generated artifacts
- Не хранить production secrets в `docker-compose.yml`, `.env.example`, docs или scripts
- Не логировать access tokens, refresh tokens, cookies, passwords, token hashes, message bodies или sensitive PII
- PostgreSQL host port — только для local development
- Docker не bypasses backend auth guards, owner checks, serializers, rate limits или Prisma migrations
