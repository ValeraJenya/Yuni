# Local Docker Workflow

This workflow runs Yuni locally with Docker Compose: PostgreSQL, NestJS backend and Next.js frontend.

It is a local development workflow only. It does not add production deployment, HTTPS, reverse proxy, Redis, queues, S3, realtime, email or push notifications.

## Setup

Copy the example environment file:

```powershell
copy .env.example .env
```

Keep `.env` local. The example values are development placeholders only.

Default URLs:

- frontend: `http://localhost:3000`
- backend: `http://localhost:4000`
- backend health: `http://localhost:4000/health`
- PostgreSQL host port: `localhost:5432`

If a port is busy, override `POSTGRES_PORT`, `BACKEND_PORT` or `FRONTEND_PORT` in `.env`.

## Start

Validate Compose and build images:

```powershell
corepack pnpm docker:config
corepack pnpm docker:build
```

Start PostgreSQL first:

```powershell
docker compose up -d postgres
docker compose ps
docker compose logs postgres --tail=100
```

Apply migrations explicitly:

```powershell
corepack pnpm docker:migrate
```

Start the apps:

```powershell
docker compose up -d backend frontend
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
```

Check health:

```powershell
Invoke-WebRequest http://localhost:4000/health
Invoke-WebRequest http://localhost:3000
```

## Day-to-day commands

```powershell
corepack pnpm docker:up
corepack pnpm docker:logs
corepack pnpm docker:down
corepack pnpm docker:build
```

`docker:up` starts all services. If the database volume is new, run `corepack pnpm docker:migrate` before using product flows.

## Database reset

This removes the local Docker PostgreSQL volume:

```powershell
corepack pnpm docker:reset:dev
```

After a reset, start services and apply migrations again:

```powershell
docker compose up -d postgres
corepack pnpm docker:migrate
docker compose up -d backend frontend
```

## Manual smoke checks

- `GET /health` returns `status: ok`.
- Frontend opens at `http://localhost:3000`.
- Register/login/refresh/logout work with browser cookies.
- Frontend API calls go to `http://localhost:4000`.
- Profile photo upload still persists under the backend uploads mount.
- Logout/refresh cookies are not blocked by CORS.

## Security notes

- Do not commit `.env`.
- Do not commit uploads, `.next`, dist, node_modules or generated artifacts.
- Do not put production secrets in `docker-compose.yml`, `.env.example`, docs or scripts.
- Do not log access tokens, refresh tokens, cookies, passwords, token hashes, message bodies or sensitive PII.
- PostgreSQL is published for local development only.
- Docker does not bypass backend auth guards, owner checks, serializers, rate limits or Prisma migrations.
