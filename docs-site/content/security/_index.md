---
title: "Безопасность"
weight: 70
---


Исходник: `docs/security/README.md`. Стартовые правила безопасности Yuni.

Подробные правила выдачи данных: [Data Exposure Rules]({{< relref "/security/data-exposure" >}}).

## Базовые правила

- Нельзя хранить реальные секреты в репозитории
- Сырые пароли не сохраняются — только `password_hash` (argon2)
- Сырые refresh tokens не сохраняются — только `token_hash` (argon2)
- Refresh token — HttpOnly cookie; в базе только argon2 hash
- Refresh token rotation: atomic, single-use
- Access token — только в memory state; нельзя в `localStorage`, `sessionStorage`, cookies, logs
- Frontend отправляет auth requests с `credentials: include`
- Access token передаётся как Bearer token; не логируется

## Frontend — не security boundary

Frontend validation используется только для UX.

Все критичные правила enforced на backend:
- Аутентификация и session rules
- Minimum age 18+
- Owner checks
- Conversation membership checks
- Media/photo ownership и visibility
- Likes/matches/block/report restrictions
- Public/private profile serialization

Backend не доверяет `birthDate`, `userId`, `profileId`, `conversationId`, `photoId`, `role`, `status`, `isAdult`, `isOwner`, `isMember`, `isAdmin` с frontend.

## Backend access-control patterns

Общие helpers в `apps/backend/src/common/security`:

| Helper | Назначение |
|---|---|
| `assertOwner(resourceOwnerId, currentUserId)` | Owner-only операции |
| `assertSameUser(targetUserId, currentUserId)` | Same-user операции |
| `assertConversationMember(membership, currentUserId)` | Chat reads/writes |
| `assertMatchParticipant(match, currentUserId)` | Match-scoped действия |
| `assertCanAccessProfile(profile, currentUserId)` | Own profile и public access |
| `assertCanAccessPhoto(photo, currentUserId)` | Own photos или approved+published |

Отсутствующий ресурс → `404`. Недостаточные права → `403`. Ошибки не раскрывают детали.

## Rate limiting

Endpoint-specific in-memory limiter (single-instance MVP). Production/multi-instance: заменить на Redis/Valkey-backed store без изменения API contract.

## Serializer rules

Response serializers в `apps/backend/src/common/serializers`. Public serializers не отдают:

- `email`
- `passwordHash`
- `birthDate`
- refresh/session fields
- `deletedAt`
- private settings
- internal moderation fields

## Ключевые правила по доменам

**Auth:** Email 18+ проверяется backend. `birthDate` — sensitive data, не логируется.

**Profiles:** `PATCH /profiles/me` принимает только whitelist полей. `GET /profiles/:handle` при block → not-found style.

**Media:** `storage_key` никогда не отдаётся клиенту. Storage filename — random UUID, не original filename.

**Discovery:** Backend-owned выдача. Unlimited lists запрещены.

**Chat:** Conversation ID сам по себе не является правом доступа — нужен membership check.

**Moderation:** Block влияет в обе стороны. Public report status — только `"received"`.

## Docker

- Docker не bypasses backend guards, owner checks, serializers, rate limits, Prisma migrations
- Docker logs не должны содержать access tokens, refresh tokens, cookies, message bodies, sensitive PII
- PostgreSQL host port — только для local development
