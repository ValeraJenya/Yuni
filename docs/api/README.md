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

Frontend использует тот же contract через `NEXT_PUBLIC_API_URL`:

- `POST /auth/register` и `POST /auth/login` возвращают безопасный `user` и `accessToken`, а refresh cookie выставляет backend.
- `POST /auth/refresh` вызывается с `credentials: include` при bootstrap после reload и при одном retry после `401`.
- `GET /auth/me` вызывается с `Authorization: Bearer <accessToken>`.
- `POST /auth/logout` отзывает refresh session и очищает cookie на backend; frontend после этого очищает memory state.
- Access token хранится только в memory state. Refresh token не читается JavaScript-кодом и не хранится во frontend storage.
- Frontend validation нужна только для UX; backend остается security boundary.

## Error and Access-Control Conventions

Будущие endpoints должны использовать единые security/error conventions:

- `401` - пользователь не аутентифицирован или session/token invalid.
- `403` - пользователь аутентифицирован, но не имеет доступа к ресурсу.
- `404` - ресурс отсутствует.
- `409` - конфликт уникальности или доменного состояния.
- `400` - request validation error.

Backend не должен раскрывать security-sensitive details в ошибках. Например, публичный ответ не должен объяснять, что "user exists but you are not owner".

Owner checks, conversation membership checks, match participant checks и profile/photo visibility checks должны выполняться на backend через common security helpers. Frontend flags не считаются доказательством доступа.

## Pagination Conventions

Будущие list endpoints должны использовать cursor pagination:

- default `limit`: `20`;
- max `limit`: `50`;
- `cursor` указывает продолжение списка;
- unlimited lists запрещены.

Это важно для dating app anti-scraping: discover, likes, matches, messages и reports не должны отдавать большие списки без server-side limit.

### Register

`birthDate` принимает только календарную дату в формате `YYYY-MM-DD`. Datetime strings, `DD.MM.YYYY`, `YYYY/MM/DD` и несуществующие даты не являются валидным API contract.

Backend самостоятельно проверяет minimum age 18+. Frontend validation используется только для UX и не считается security boundary. Если пользователь младше 18 лет, дата рождения в будущем или формат даты неверный, API возвращает 400-level ошибку.

Valid adult example:

```bash
curl -i -c cookies.txt -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"handle\":\"test_user\",\"displayName\":\"Тест\",\"birthDate\":\"2000-01-01\"}"
```

Invalid date format example:

```bash
curl -i -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"format@example.com\",\"password\":\"password123\",\"handle\":\"format_user\",\"displayName\":\"Format\",\"birthDate\":\"01.01.2000\"}"
```

Underage example:

```bash
curl -i -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"underage@example.com\",\"password\":\"password123\",\"handle\":\"underage_user\",\"displayName\":\"Underage\",\"birthDate\":\"2010-01-01\"}"
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

Refresh token rotation is single-use. Successful refresh atomically revokes the old refresh session and issues a new access token plus a new HttpOnly refresh cookie.

Reused, expired, revoked or invalid refresh tokens return `401 Authentication required`. The response does not reveal which token failure case happened.

Clients must use the newest cookie from the latest successful refresh response. Clients should avoid parallel refresh retries with the same old cookie: if two refresh requests use the same cookie, only one can succeed.

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
