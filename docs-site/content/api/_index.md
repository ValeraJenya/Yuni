---
title: "API"
weight: 50
---


Исходник: `docs/api/README.md`. Реализованы: auth/session, Profiles MVP, Profile Photos / Media MVP, Likes MVP, Matches MVP, Blocks/Reports MVP, Discovery MVP, Chat MVP, Notifications MVP.

## Подготовка к ручной проверке

```bash
corepack pnpm install --frozen-lockfile
copy .env.example .env
corepack pnpm prisma:migrate:dev
corepack pnpm prisma:generate
corepack pnpm dev:backend
```

В `.env` нужен корректный `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yuni
```

## Error и access-control conventions

| Код | Значение |
|---|---|
| `400` | Request validation error |
| `401` | Не аутентифицирован или session/token invalid |
| `403` | Аутентифицирован, но нет доступа к ресурсу |
| `404` | Ресурс отсутствует |
| `409` | Конфликт уникальности или доменного состояния |
| `429` | Rate limit exceeded |

Backend не раскрывает security-sensitive details в ошибках.

## Rate Limits / Anti-Spam MVP

Два слоя:

1. Coarse global fallback (`@nestjs/throttler`): 300 req / 10 мин / IP
2. Endpoint-specific in-memory limiter (single-instance MVP)

`429` response shape:

```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "retryAfterSeconds": 60
}
```

### Таблица endpoint-specific лимитов

| Endpoint | Ключ | Лимит |
|---|---|---|
| `POST /auth/register` | IP | 3 / час |
| `POST /auth/login` | IP | 20 / 10 мин |
| `POST /auth/login` | IP + email hash | 5 / 10 мин |
| `POST /auth/refresh` | IP | 30 / 10 мин |
| `POST /auth/logout` | IP | 30 / 10 мин |
| `POST /likes/:targetProfileUserId` | user | 60 / час (shared с SKIP) |
| `POST /likes/:targetProfileUserId/skip` | user | 60 / час (shared с LIKE) |
| `POST /chat/conversations/:conversationId/messages` | user | 30 / мин + 120 / 10 мин |
| `POST /reports` | user | 10 / час |
| `GET /discovery/cards` | user | 120 / 10 мин |
| `GET /profiles/:handle` | user | 120 / 10 мин |
| `GET /notifications` | user | 120 / 10 мин |
| `GET /notifications/unread-count` | user | 240 / 10 мин |
| `POST /notifications/:notificationId/read` | user | 120 / 10 мин |
| `POST /notifications/read-all` | user | 120 / 10 мин |

## Pagination Conventions

- Default `limit`: 20
- Max `limit`: 50 (для discovery cards — max 20)
- `cursor` — продолжение списка
- Unlimited lists запрещены

## Cookie Behavior

| Параметр | Local dev | Production |
|---|---|---|
| `httpOnly` | true | true |
| `sameSite` | lax | none |
| `secure` | false | true |
| `path` | /auth | /auth |

## Auth flow

- `POST /auth/register` и `POST /auth/login` → safe `user` + `accessToken`; refresh cookie выставляет backend
- `POST /auth/refresh` — с `credentials: include`; single-use rotation
- Access token — только в memory state; нельзя в `localStorage`/`sessionStorage`
- Refresh token — только в HttpOnly cookie; не читается JS

## Быстрые примеры

**Register:**
```bash
curl -i -c cookies.txt -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","handle":"test_user","displayName":"Тест","birthDate":"2000-01-01"}'
```

**Login:**
```bash
curl -i -c cookies.txt -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Me:**
```bash
curl -i http://localhost:4000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

**Discovery cards:**
```bash
curl -i "http://localhost:4000/discovery/cards?limit=20" \
  -H "Authorization: Bearer <accessToken>"
```

Полная API документация с примерами для всех endpoints: `docs/api/README.md`.
