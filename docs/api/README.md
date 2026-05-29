# API

Это короткая API-документация для текущего backend foundation. Пока реализован только минимальный auth/session flow.

## Подготовка

Для ручной проверки нужен запущенный PostgreSQL и примененная Prisma-схема:

```bash
corepack pnpm install --frozen-lockfile
copy .env.example .env
corepack pnpm prisma:migrate:dev
corepack pnpm prisma:generate
corepack pnpm dev:backend
```

В `.env` должен быть корректный `DATABASE_URL`, например:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yuni
```

Если база `yuni` еще не создана, создайте новую пустую PostgreSQL базу до `prisma:migrate:dev`.

Проект стартует как greenfield: legacy DB migration, импорт старых пользователей и cleanup старых данных не нужны. Основной способ применения схемы - Prisma migrations. `prisma db push` не является основным workflow.

## Auth

Примеры ниже используют `cookies.txt`, чтобы curl сохранял и отправлял HttpOnly refresh cookie.

### Register

```bash
curl -i -c cookies.txt -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"handle\":\"test_user\",\"displayName\":\"Тест\",\"birthDate\":\"2000-01-01\"}"
```

Ответ содержит безопасный `user` и `accessToken`. Сырые пароль и refresh token не возвращаются. Refresh token устанавливается в HttpOnly cookie `yuni_refresh`.

### Login

```bash
curl -i -c cookies.txt -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

Если email или пароль неверны, API возвращает одинаковую безопасную ошибку `Invalid credentials`.

### Me

Подставьте `accessToken` из ответа register/login:

```bash
curl -i http://localhost:4000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### Refresh

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:4000/auth/refresh
```

Refresh проверяет cookie, сверяет raw token с `token_hash` в базе, отзывает старую refresh session и выдает новую пару токенов.

### Logout

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:4000/auth/logout
```

Logout отзывает текущую refresh session, если cookie присутствует, и очищает cookie.

## Cookie Behavior

Для local development:

- `httpOnly: true`
- `sameSite: lax`
- `secure: false`
- `path: /auth`

В production:

- `httpOnly: true`
- `sameSite: none`
- `secure: true`
- `path: /auth`

Access token передается как Bearer token. Его нельзя логировать или хранить в небезопасном месте.
