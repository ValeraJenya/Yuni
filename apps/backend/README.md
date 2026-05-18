# Backend Yuni

Это базовая основа backend-приложения Yuni на NestJS.

Сейчас здесь есть каркас модулей, подключение конфигурации, Prisma, базовые security-настройки и `GET /health`. Полная бизнес-логика auth, profiles, likes, matches, chat, media и moderation пока намеренно не реализована.

## Структура

- `src/main.ts` - запуск NestJS, CORS, Helmet, ValidationPipe и общий фильтр ошибок.
- `src/app.module.ts` - корневой модуль приложения.
- `src/config` - загрузка и проверка переменных окружения.
- `src/common` - общие инфраструктурные части, включая Prisma и error filter.
- `src/modules/health` - рабочий health endpoint.
- `src/modules/auth` - foundation для будущей авторизации.
- `src/modules/users`, `profiles`, `media`, `likes`, `matches`, `chat`, `moderation` - границы будущих доменных модулей.
- `prisma/schema.prisma` - Prisma-модель, выровненная с SQL-first схемой.

## Локальный запуск

Из корня репозитория:

```bash
pnpm install
pnpm prisma:generate
pnpm dev:backend
```

Проверка:

```bash
curl http://localhost:4000/health
```

Для запуска напрямую из backend:

```bash
pnpm --dir apps/backend dev
```

## Важно

- Сырые пароли не хранятся: будущая реализация должна сохранять только `password_hash`.
- Сырые refresh tokens не хранятся: будущая реализация должна сохранять только `token_hash`.
- Доступ к приватным данным, чатам и профилям должен строиться вокруг `user_id`, membership checks и owner checks.
- Prisma schema не заменяет SQL-first решения для PostgreSQL expression/partial indexes; такие ограничения нужно сохранить в миграциях.
