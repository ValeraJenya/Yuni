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
- `prisma/schema.prisma` - Prisma-модель, выровненная с SQL-first схемой.

## Локальный запуск

Из корня репозитория:

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:push
pnpm dev:backend
```

Перед `prisma:push` в PostgreSQL должна существовать база из `DATABASE_URL`, например `yuni`.

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
- Для локальной проверки Prisma schema можно применить через `pnpm prisma:push`. Полный migration workflow будет добавлен отдельно.
- Доступ к приватным данным, чатам и профилям должен строиться вокруг `user_id`, membership checks и owner checks.
- Prisma schema не заменяет SQL-first решения для PostgreSQL expression/partial indexes; такие ограничения нужно сохранить в миграциях.
