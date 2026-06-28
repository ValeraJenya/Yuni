---
title: "Онбординг"
weight: 90
---


## Что установить

| Инструмент | Версия | Зачем |
|---|---|---|
| Node.js | 20+ | Backend и frontend |
| pnpm (через Corepack) | latest | Менеджер пакетов |
| Docker Desktop | latest | Локальный запуск БД, backend, frontend |
| Git | latest | Клонирование и работа с репозиторием |

Включить Corepack (устанавливает нужную версию pnpm автоматически):

```powershell
corepack enable
```

## Клонирование репозитория

```bash
git clone <repo-url>
cd yuni
```

## Настройка .env

Скопировать `.env.example` в `.env`:

```powershell
copy .env.example .env
```

`.env` содержит только development placeholders. Никогда не коммитить `.env` с реальными секретами.

Для локальной связки frontend/backend нужны:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yuni
```

Переменные, которые должны быть выставлены в `.env`:

- `DATABASE_URL` — строка подключения к PostgreSQL
- `JWT_ACCESS_SECRET` — секрет для подписи JWT access tokens
- `JWT_REFRESH_SECRET` — секрет для подписи JWT refresh tokens
- `NEXT_PUBLIC_API_URL` — URL backend API для браузера
- `FRONTEND_URL` — URL frontend для CORS
- `CORS_ALLOWED_ORIGINS` — разрешённые CORS origins

## Рекомендуемый способ: Docker Compose

Самый воспроизводимый путь. Подробности: [Docker workflow]({{< relref "/onboarding/docker" >}}).

```powershell
copy .env.example .env

# Собрать образы
corepack pnpm docker:config
corepack pnpm docker:build

# Запустить PostgreSQL
docker compose up -d postgres
docker compose ps
docker compose logs postgres --tail=100

# Применить миграции (обязательно перед первым запуском)
corepack pnpm docker:migrate

# Запустить backend и frontend
docker compose up -d backend frontend
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
```

Проверить работоспособность:

```powershell
Invoke-WebRequest http://localhost:4000/health
Invoke-WebRequest http://localhost:3000
```

| Сервис | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:4000` |
| Backend health | `http://localhost:4000/health` |
| PostgreSQL | `localhost:5432` |

## Ручной запуск без Docker

### 1. Установить зависимости

```bash
corepack pnpm install --frozen-lockfile
```

### 2. Настроить .env

```bash
copy .env.example .env
```

Убедитесь что `DATABASE_URL` указывает на запущенную пустую PostgreSQL базу.

### 3. Создать PostgreSQL базу

Создайте новую пустую базу данных (например, `yuni`) до применения миграций.

### 4. Применить миграции и сгенерировать Prisma Client

```bash
corepack pnpm prisma:migrate:dev
corepack pnpm prisma:generate
```

### 5. Запустить backend и frontend

В двух отдельных терминалах:

```bash
# Терминал 1: Backend
corepack pnpm dev:backend

# Терминал 2: Frontend
corepack pnpm dev:frontend
```

## Как запустить тесты

```powershell
# Все backend тесты
corepack pnpm --filter backend test

# Backend build
corepack pnpm --filter backend build

# Backend lint
corepack pnpm --filter backend lint

# Полный check (backend + frontend lint/typecheck/build)
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yuni_ci?schema=public"
corepack pnpm check
```

Для Prisma validate/generate нужен `DATABASE_URL`. Backend tests не используют real DB — они работают с mock Prisma.

## Day-to-day команды (Docker)

```powershell
corepack pnpm docker:up      # Запустить все сервисы
corepack pnpm docker:logs    # Логи всех сервисов
corepack pnpm docker:down    # Остановить все сервисы
corepack pnpm docker:build   # Пересобрать образы
```

## Частые проблемы

### Порты заняты

Если 3000/4000/5432 заняты, переопределить в `.env`:

```env
POSTGRES_PORT=5433
BACKEND_PORT=4001
FRONTEND_PORT=3001
```

### Migrations не применились

После `docker compose up -d postgres` нужно явно запустить:

```powershell
corepack pnpm docker:migrate
```

Migrations не применяются автоматически при старте backend.

### Сбросить локальную БД

```powershell
corepack pnpm docker:reset:dev
docker compose up -d postgres
corepack pnpm docker:migrate
docker compose up -d backend frontend
```

**Внимание:** Команда удаляет локальный Docker PostgreSQL volume.

### Ошибка CORS

Проверить что в `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000   # не http://backend:4000
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

`NEXT_PUBLIC_API_URL` должен быть browser-facing URL — браузер не находится внутри Docker network.

### Refresh cookie не отправляется

В dev-режиме: `sameSite=lax`. Убедитесь что frontend и backend на одном хосте (`localhost`).

## Что не делать

- Не коммитить `.env` — он в `.gitignore`
- Не использовать `prisma db push` как основной workflow — только `prisma migrate dev`
- Не запускать `git add .` — добавлять файлы явно
- Не хранить access token в `localStorage` / `sessionStorage`
