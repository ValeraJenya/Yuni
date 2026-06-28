---
title: "Data Exposure Rules"
weight: 10
---


Исходник: `docs/security/data-exposure-rules.md`. Raw Prisma objects нельзя возвращать клиенту напрямую. Каждый response должен использовать serializer или explicit response shape.

## Public API не должен отдавать

- `passwordHash`, raw password
- access token (кроме auth endpoints, возвращающих новый токен текущему пользователю)
- refresh token, `tokenHash`, cookies
- `email` (кроме self/auth response)
- `birthDate` (кроме self profile)
- `deletedAt`
- internal moderation fields
- `storageKey`, local file path, original filename
- private settings
- reports или internal abuse data
- raw session records
- raw Prisma relation objects с internal fields

## Self API может отдавать

Только данные, принадлежащие аутентифицированному пользователю и нужные frontend:

- safe auth user fields
- own profile fields
- own `birthDate`
- own `moderationStatus` фото
- current access token только в auth/session responses

Self responses НЕ отдают: `passwordHash`, refresh token, `token_hash`, cookies, local file path, `storageKey`.

## Rate Limit Error Shape

```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "retryAfterSeconds": 60
}
```

Нельзя отдавать: raw email, IP, user id, token, cookie, password, limiter key, policy name.

## Profile Response Shapes

### Self Profile — может включать

`userId`, `handle`, `displayName`, `birthDate`, `bio`, `gender`, `lookingFor`, `city`, `country`, `isDiscoverable`, `completedAt`, own photos с `moderationStatus`.

**Нельзя:** email, password/session, refresh tokens, `storageKey`, local path, internal moderation notes.

### Public Profile — может включать

`userId`, `handle`, public `displayName`, public `bio`, location, approved/published public photos.

**Нельзя:** email, `birthDate`, private settings, `storageKey`, unpublished/unapproved photos.

## Discovery Response Shape

Можно включать: `userId`, `handle`, `displayName`, public `bio/gender/lookingFor/city/country`, computed `age`, `primaryPhotoUrl`, `photos[].publicUrl`, `nextCursor`.

**Нельзя:** raw `birthDate`, email, password, private settings, `storageKey`, block/report data, raw Prisma rows.

## Media Response Shapes

**Public photo:** `id`, `publicUrl`, `blurhash`, `isPrimary`, `position`.

**Self photo дополнительно:** `moderationStatus`, `publishedAt`.

**Нельзя:** `storageKey`, filesystem path, original filename.

## Likes Response Shape

Только: `interaction.targetProfileUserId`, `interaction.action`, `interaction.expiresAt`.

**Нельзя:** raw Prisma `Like` rows, `id`, `likerUserId`, `kind`, `createdAt`, email, `birthDate`.

## Matches Response Shape

Только: `match.id`, `match.matchedProfile` (userId, handle, displayName, primaryPhotoUrl), `match.matchedAt`, `match.expiresAt`, `match.status`, `match.conversationId`, `match.conversationStarted`.

**Нельзя:** `userAId`, `userBId`, raw relation objects, email, `birthDate`, `storageKey`.

## Chat Response Shapes

**Conversation list:** `conversationId`, `otherParticipant` (userId/handle/displayName/primaryPhotoUrl), `lastMessage`, `updatedAt`, `status`, `nextCursor`.

**Message:** `id`, `conversationId`, `senderUserId`, `text`, `status`, `createdAt`.

**Нельзя:** raw Prisma rows, `body` (DB field name), `lastReadMessageId`, `deletedAt`, `editedAt`, email, `birthDate`, `storageKey`.

## Notifications Response Shape

Только: `id`, `type`, `messageKey`, `createdAt`, `readAt`, `actor` (userId/handle/displayName/primaryPhotoUrl), nullable `matchId/conversationId/messageId`, `nextCursor`.

**Нельзя:** raw message body, email, `birthDate`, `storageKey`, private settings, raw Prisma rows.

## Blocks/Reports Response Shapes

**Block:** `block.blockedUserId`, `block.createdAt`, `block.status` (только `"blocked"`).

**Report:** `report.id`, `report.targetUserId`, `report.reason`, `report.createdAt`, public `report.status` (только `"received"`).

**Нельзя:** `blockerUserId`, `reporterUserId`, internal `ReportStatus`, moderation workflow, email, `birthDate`.

## Implementation Rules

- Public/self/admin serializers должны быть раздельными
- Текущие примеры: `toSafeAuthUser`, `toSelfProfile`, `toPublicProfile`, `toSelfProfilePhoto`, `toPublicProfilePhotos`
- Новые модули должны определять response shape до релиза endpoints
- Если service использует Prisma `include`, проверить что included relations не утекают в response
- Error responses не раскрывают security-sensitive details
- Logs не содержат access tokens, refresh tokens, cookies, passwords, birthDate, private profile fields, message bodies
