# Security

Это стартовые правила безопасности для Yuni.

Подробные правила выдачи данных описаны отдельно: [Data Exposure Rules](./data-exposure-rules.md).

- Нельзя хранить реальные секреты в репозитории.
- Нельзя коммитить production credentials, API keys, токены, private certificates или пароли.
- Сырые пароли никогда не сохраняются: в базе должен быть только `password_hash`.
- Сырые refresh tokens никогда не сохраняются: в базе должен быть только `token_hash`.
- Password hashing реализуется через argon2.
- Refresh token хранится у клиента в HttpOnly cookie, а в базе хранится только argon2 hash.
- Cookie содержит `refreshTokenId.rawToken`: id нужен только для поиска строки сессии, raw token проверяется через argon2 и не сохраняется в базе.
- Refresh token rotation должна быть atomic и single-use: один refresh token может успешно использоваться только один раз.
- Параллельные refresh-запросы с одной cookie не должны создавать несколько валидных refresh sessions.
- Frontend хранит access token только в memory state. Access token нельзя сохранять в `localStorage`, `sessionStorage`, cookies или logs.
- Refresh token хранится только в HttpOnly cookie, выставленной backend. JavaScript не должен читать, копировать или сохранять refresh token.
- Frontend должен отправлять auth requests с `credentials: include`, чтобы browser сам отправлял HttpOnly cookie на `/auth/*`.
- При `401` frontend может один раз выполнить refresh retry через shared refresh promise, чтобы параллельные requests не создавали refresh storm.
- Access token передается как Bearer token и не должен логироваться.
- Нельзя логировать access tokens, refresh tokens, cookies, token hashes, пароли, session values и лишние персональные данные.
- Локальные значения окружения должны храниться в `.env`, а в `.env.example` должны быть только безопасные примеры.
- Docker Compose and Dockerfiles must not contain production secrets. Local Compose values are development placeholders only.
- `.env` is ignored by git and must stay local. Do not copy production credentials into docs, scripts or compose files.
- PostgreSQL host port in Docker is for local development only; server deployment must define separate network exposure rules later.
- Docker logs must not contain access tokens, refresh tokens, cookies, token hashes, passwords, message bodies or sensitive PII.
- Docker workflow must not bypass backend guards, owner checks, serializers, rate limits or Prisma migrations.
- Доступ к чатам должен проверяться через membership в `conversation_participants`; `conversationId` сам по себе не является правом доступа.
- Доступ к профилям, фото, discovery, лайкам, матчам, чатам, уведомлениям, блокировкам и жалобам должен строиться вокруг authenticated `user_id` и owner checks.
- Likes MVP принимает target profile только как `targetProfileUserId`, то есть `profiles.user_id`. У профиля нет отдельного публичного id.
- Private mode не должен отдавать user-uploaded photos; вместо них используется системный anonymous avatar.
- Anti-spam limits не должны раскрывать raw email, IP, user id, token, cookie, password или internal limiter key в response или logs.

## Frontend is not a security boundary

Frontend validation используется только для UX. Browser-side checks можно обойти через DevTools, curl, Postman или прямые HTTP-запросы.

Все критичные правила должны enforced на backend:

- authentication and session rules;
- minimum age 18+;
- owner checks;
- conversation membership checks;
- media/photo ownership and visibility;
- likes/matches/block/report restrictions;
- public/private profile serialization.

Backend не должен доверять `birthDate`, `userId`, `profileId`, `conversationId`, `photoId`, `role`, `status`, `isAdult`, `isAgeConfirmed`, `isOwner`, `isMember` или `isAdmin`, пришедшим с frontend.

Возраст 18+ enforced на backend: backend сам вычисляет возраст по `birthDate` и не принимает `isAdult` или `isAgeConfirmed` как доказательство возраста. `birthDate` считается sensitive data и не должна логироваться.

Database constraints должны защищать критичные invariants там, где это возможно.

Mock/demo flow не является production auth source. Product UI может временно использовать mock-data для еще не подключенных областей, но discovery cards, доступ к protected routes и состояние авторизации должны зависеть от backend session/API response, а не от frontend flag в storage.

## Backend access-control patterns

Backend security boundary для будущих product modules строится вокруг authenticated `user_id` из `CurrentUser`. Frontend значения `userId`, `profileId`, `photoId`, `conversationId`, `isOwner`, `isMember` и `isAdmin` считаются untrusted input и всегда проверяются на backend.

Общие helpers находятся в `apps/backend/src/common/security`:

- `assertOwner(resourceOwnerId, currentUserId)` и `assertSameUser(targetUserId, currentUserId)` - для owner-only операций.
- `assertConversationMember(membership, currentUserId)` - для chat reads/writes. Conversation id сам по себе не даёт доступ.
- `assertMatchParticipant(match, currentUserId)` - для match-scoped действий.
- `assertCanAccessProfile(profile, currentUserId)` - для own profile и public discover/profile access с учетом private mode.
- `assertCanAccessPhoto(photo, currentUserId)` - для own photos или approved+published public photos.

Отсутствующий ресурс возвращает `404 Resource not found`. Недостаточные права возвращают `403 Forbidden`. Ошибки не должны раскрывать детали вроде "user exists but you are not owner".

## Rate limiting and anti-spam

Step 17 добавляет anti-spam слой поверх существующих service-level checks:

- global fallback через `@nestjs/throttler`: `300` requests / `10 minutes` / IP;
- endpoint-specific in-memory limiter в `apps/backend/src/common/rate-limit`.

Endpoint-specific limits:

- register: `3 / hour / IP`;
- login: `20 / 10 minutes / IP` plus `5 / 10 minutes / IP + normalizedEmailHash`;
- refresh: `30 / 10 minutes / IP`;
- logout: `30 / 10 minutes / IP`;
- LIKE/SKIP combined: `60 / hour / authenticated user`;
- chat send: `30 / minute / authenticated user` and `120 / 10 minutes / authenticated user`;
- report create: `10 / hour / authenticated user`;
- discovery cards: `120 / 10 minutes / authenticated user`;
- public profile lookup: `120 / 10 minutes / authenticated user`;
- notifications list: `120 / 10 minutes / authenticated user`;
- notifications unread count: `240 / 10 minutes / authenticated user`;
- notifications mark read/read all: `120 / 10 minutes / authenticated user`.

Authenticated policies must use `CurrentUser` populated by `JwtAccessGuard`; actor identity never comes from body, query, params or frontend state. Login's composite key uses a normalized email hash, not raw email. `429` responses return only:

```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "retryAfterSeconds": 60
}
```

Limiter keys, policy names, raw email, IP, user id, token and cookie values must not be exposed in responses or logs.

The current endpoint-specific limiter is local in-memory and single-instance only. Production or multi-instance deployments must use a shared Redis/Valkey-backed store to avoid per-instance bypass. Rate limiting is an anti-abuse layer only; it does not replace authentication, owner checks, block checks, profile visibility checks, conversation membership checks or database constraints.

## Serializer rules

Response serializers находятся в `apps/backend/src/common/serializers`. Public serializers не должны отдавать:

- `email`;
- `passwordHash`;
- `birthDate`;
- refresh/session fields;
- `deletedAt`;
- private settings;
- internal moderation fields.

Self/private serializers могут отдавать больше данных владельцу, но всё равно не должны отдавать password/session/token fields. Private profile mode enforced на backend serializer, а не только на frontend.

## Profiles MVP security rules

Profiles MVP использует backend как источник истины для profile data:

- `GET /profiles/me` и `PATCH /profiles/me` работают только с authenticated `CurrentUser`.
- `PATCH /profiles/me` берет `userId` только из access token, а не из request body.
- Через self-update можно менять только `displayName`, `bio`, `gender`, `lookingFor`, `city`, `country` и `isDiscoverable`.
- `userId`, `email`, `password`, `birthDate`, `handle`, `status`, `role`, `photos`, moderation fields и direct `privacySettings` не принимаются в profile update payload.
- `GET /profiles/:handle` использует case-insensitive lookup и public serializer.
- Public profile response не содержит `email`, `birthDate`, private settings, refresh/session fields, raw tokens или internal moderation fields.
- Недоступный чужой profile с `isDiscoverable=false` или private visibility mode возвращает `403 Forbidden`.
- Если viewer и target связаны block в любую сторону, `GET /profiles/:handle` возвращает not-found style response и не раскрывает факт блокировки.
- Frontend profile page не хранит private profile data, access token или refresh token в `localStorage`/`sessionStorage`; profile data загружается через authenticated backend API.

## Profile Photos / Media MVP security rules

Profile Photos / Media MVP использует `ProfilePhotoStorage` boundary. Текущая реализация - local adapter для development/MVP, а production S3/CDN/media pipeline, async moderation и metadata processing будут отдельными задачами.

Security rules:

- Все endpoints `GET /media/profile-photos/me`, `POST /media/profile-photos`, `PATCH /media/profile-photos/:photoId/primary` и `DELETE /media/profile-photos/:photoId` требуют authenticated `CurrentUser`.
- Backend берет owner identity только из access token, а не из `userId`, `profileId`, `photoId`, `isOwner` или любых frontend flags в body/query/path.
- Upload принимает только multipart field `file`.
- Разрешены только `image/jpeg`, `image/png` и `image/webp`.
- Максимальный размер файла - `5 MB`.
- Storage filename генерируется backend через storage adapter random UUID; original filename не используется как имя файла в storage и не возвращается клиенту.
- Local adapter path `apps/backend/uploads/profile-photos` не коммитится в репозиторий.
- Path traversal protection for local deletes lives in `LocalProfilePhotoStorageService`; `MediaService` owns best-effort cleanup policy, not filesystem path construction.
- Public responses не должны отдавать `storageKey`, filesystem path, original filename или moderation internals.
- Self response может видеть `moderationStatus`, но всё равно не должен видеть filesystem/storage internals.
- Public profile serializers отдают только photos с `publicUrl`, `moderationStatus=approved` и `publishedAt`.
- Owner checks mandatory для set primary и delete.
- DB constraints остаются последним слоем защиты для one-primary-per-user и запрета published photo без approved state.

Known MVP limitations:

- EXIF/metadata stripping пока не реализован и должен быть добавлен перед production media pipeline.
- Image dimension validation, malware scanning, perceptual hashing и async moderation не входят в этот MVP шаг.
- Локальное хранение подходит для development/early MVP, но не для production scale.

## Discovery MVP security rules

Discovery MVP реализует `GET /discovery/cards` как backend-owned выдачу анкет. Frontend не является источником истины для доступности карточек.

Security rules:

- Endpoint требует authenticated `CurrentUser` через `JwtAccessGuard`.
- Actor identity берется только из access token, не из body/query/frontend state.
- Response uses explicit safe card shape, not raw Prisma `Profile`, `User`, `ProfilePhoto`, `Like`, `Match` or `Block` rows.
- Discovery excludes current user, inactive/deleted users, incomplete profiles, non-discoverable profiles and profiles without an explicit open/discoverable `PrivacySettings` row.
- Public photos in cards require `publicUrl`, `moderationStatus=approved` and `publishedAt`.
- Cards require at least one approved, published public photo for MVP.
- Blocks apply in both directions and hide both users from each other.
- Active LIKE/SKIP cooldown from the current user hides the target until `expiresAt`.
- Expired LIKE/SKIP does not hide the target.
- Active match hides the matched user while `status=active` and `expiresAt > now`.
- Expired match does not hide the user, preserving future rediscovery/rematch.
- `limit` is server-clamped to max `20`; unlimited lists are forbidden.
- Sorting is stable and non-random for MVP.

Discovery responses must not expose raw `birthDate`, email, password/passwordHash, refresh/session fields, `storageKey`, local paths, original filenames, private profile/privacy fields, block/report/moderation internals or raw Prisma rows.

Known MVP limitations:

- Ranking, random ordering, geolocation/radius, premium filters, notifications, chat/messages and admin/moderation panels are outside Step 15.
- Race behavior around likes/matches database constraints should be covered by integration/e2e tests with a test database later.

## Likes MVP security rules

Likes MVP реализует только `LIKE` и `SKIP/PASS`. Superlike не входит в Step 12. Matches реализуются отдельно в Step 13 через `MatchesService`; Step 14 добавляет block-aware enforcement; Step 15 подключает backend discovery feed; Step 16 добавляет chat только между участниками match.

Security rules:

- Все endpoints `POST /likes/:targetProfileUserId` и `POST /likes/:targetProfileUserId/skip` требуют authenticated `CurrentUser`.
- `targetProfileUserId` означает `profiles.user_id`; backend не вводит отдельный profile id.
- Backend берет actor identity только из access token, а не из body/query/path или frontend state.
- Self-like и self-skip запрещены.
- Actor должен быть active и not deleted.
- Target user должен быть active и not deleted.
- Target profile должен быть доступен по текущим profile access rules: discoverable/open для другого пользователя.
- Active block в любую сторону между actor и target запрещает LIKE/SKIP.
- `like` сохраняется как `LikeKind.like`, `skip`/`pass` сохраняется как `LikeKind.pass`.
- LIKE cooldown - 3 days; SKIP/PASS cooldown - 1 day.
- Active interaction blocks another LIKE/SKIP for the same actor/target until `expiresAt`.
- Expired interaction does not block a new LIKE/SKIP.
- Duplicate active interaction returns safe `409 Active interaction already exists`.
- DB overlap constraint conflicts are mapped to the same safe `409`, without leaking constraint details.
- Response shape is explicit and safe: `interaction.targetProfileUserId`, `interaction.action`, `interaction.expiresAt`; raw Prisma `Like` rows are never returned.

Known MVP limitations:

- Race/exclusion constraint behavior should be covered by integration/e2e tests with a test database in a later step.
- Superlike rules are intentionally outside Step 12; block effects are enforced by Step 14 in likes/matches/profile reads and by Step 15 in discovery.

## Matches MVP security rules

Matches MVP реализует mutual matches from active LIKE interactions. Chat creation and messages are owned by Step 16 `ChatModule`; notifications and moderation review remain outside Step 13.

Security rules:

- `GET /matches/me` requires authenticated `CurrentUser`.
- Match creation is owned by `MatchesService`; `LikesService` delegates after successful LIKE.
- A match can be created only when the new LIKE has a reciprocal active `LikeKind.like`.
- Active LIKE means `kind=like` and `expiresAt > now`.
- SKIP/PASS never creates a match.
- Self-match is rejected.
- Match pairs are normalized by stable user id order before write, so `A-B` and `B-A` cannot create separate active pairs.
- Active match means `status=active` and `expiresAt > now`.
- Active duplicate match is not created.
- Blocked pairs in either direction cannot create a new match.
- Expired match does not block future rematch.
- DB overlap constraint conflicts are mapped to the existing active match or a safe conflict.
- `/matches/me` returns only matches where the current user is a participant and filters out blocked pairs.
- Match response shape is explicit and safe, including nullable `conversationId`; raw Prisma `Match`, `User`, `Profile` and `ProfilePhoto` rows are never returned.
- Match responses must not expose `email`, `birthDate`, `passwordHash`, refresh/session fields, `storageKey`, local path, original filename or private profile settings.
- Conversation state is represented as `conversationId` plus `conversationStarted`; starting/opening the conversation is done by `POST /matches/:matchId/conversation`.

Known MVP limitations:

- No cron/job marks expired matches. For MVP, services filter active matches by `status=active` and `expiresAt > now`.
- Race/exclusion behavior should be smoke-tested on a temporary PostgreSQL database before PR; broader e2e coverage can follow later.
- Blocks can end active matches with `status=blocked`; unblocking does not restore old matches.

## Chat MVP security rules

Chat MVP owns one-to-one text conversations between match participants.

Security rules:

- `GET /chat/conversations`, `GET /chat/conversations/:conversationId/messages`, `POST /chat/conversations/:conversationId/messages` and `POST /matches/:matchId/conversation` require authenticated `CurrentUser`.
- Actor and sender identity always come from `CurrentUser`; frontend cannot choose sender user id.
- Conversation creation is allowed only through `POST /matches/:matchId/conversation`.
- Only match participants can create/open a conversation for that match.
- Active match (`status=active`, `expiresAt > now`) can create a new conversation.
- Expired match without an existing conversation cannot create a new chat.
- Existing conversation remains available after match expiration.
- Conversation creation writes `Conversation` and both `ConversationParticipant` rows in a transaction.
- Race on unique `conversation.matchId` maps to reading and returning the existing conversation.
- List returns only conversations where current user is an active participant.
- Message reads require current user active membership and use not-found style if an active block exists in either direction.
- Sends require current user active membership, active conversation status and one other active participant.
- Active block in either direction prevents sends with safe `403`.
- Inactive/deleted current user cannot list/start/send.
- Inactive/deleted other participant blocks new messages.
- Message `text` is trimmed on backend, whitespace-only text returns `400`, max length is `2000`.
- Chat supports plain text only in Step 16; no attachments/media messages.
- Message body must not be logged with PII or tokens.
- Responses use explicit safe shapes and never raw Prisma rows.

Known MVP limitations:

- WebSocket/realtime, typing indicators, read receipts, attachments/media messages, encryption, admin panel and complex chat search are outside Step 16. In-app notifications are implemented separately in Step 18 without realtime delivery.

## Notifications MVP security rules

Notifications MVP реализует только in-app уведомления внутри приложения.

Security rules:

- `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:notificationId/read` и `POST /notifications/read-all` require authenticated `CurrentUser`.
- Recipient/owner identity always comes from `CurrentUser`; frontend cannot choose which user's notifications to read or mark.
- Notification events are created from backend-owned match/message flows, not from frontend requests.
- `match_created` notifications are created only after a new `Match` row is created and only for both participants with the other participant as actor.
- Existing active match and race-existing match paths must not create duplicate notifications.
- `message_received` notifications are created only for the other active participant after successful message send.
- Sender never receives their own message notification.
- Active block in either direction prevents creating new visible notifications and hides existing actor notifications from list/count.
- `NotificationSettings.matchesEnabled` and `NotificationSettings.messagesEnabled` are respected when creating events.
- Notification rows store message keys and references only; raw message body is not stored.
- Match/message notifications require a safe actor. Unsafe actorless match/message notifications are hidden; system notifications may have `actor=null`.
- Responses use explicit safe shapes and never raw Prisma rows.

Notifications responses must not expose email, raw `birthDate`, password/passwordHash, refresh/session fields, storage keys, local paths, original filenames, private profile/privacy fields, block/report internals or raw message body.

Known MVP limitations:

- Push notifications, email notifications, WebSocket/realtime, background workers/queues, Redis/Valkey, mobile notifications, notification preferences UI, admin notification tools and complex templates are outside Step 18.

## Blocks / Reports MVP security rules

Blocks and reports are owned by `ModerationModule`.

Block rules:

- `POST /blocks/:targetUserId`, `DELETE /blocks/:targetUserId` and `GET /blocks/me` require authenticated `CurrentUser`.
- Backend takes `blockerUserId` only from `CurrentUser`; frontend user ids are untrusted.
- Self-block is rejected.
- Duplicate block returns idempotent success and does not create duplicate rows.
- Unblock uses hard delete scoped to `blockerUserId=CurrentUser.id` and is idempotent.
- Block applies in both directions for visibility and interactions: public profile reads, LIKE/SKIP, match creation and `/matches/me`.
- Creating a block ends active matches between the users with `status=blocked` and `endedAt=now`.
- Unblocking does not automatically restore old matches.
- `GET /blocks/me` returns only outgoing blocks for the current user and uses cursor pagination.

Report rules:

- `POST /reports` requires authenticated `CurrentUser`.
- Backend takes `reporterUserId` only from `CurrentUser`.
- Self-report is rejected.
- `reason` must be an existing `ReportReasonCode`.
- `details` is optional, trimmed, empty string becomes `null`, max length is `1000`.
- Public response status is only `"received"` and never exposes internal `ReportStatus`, notes, resolver data or review workflow.

Frontend support is intentionally small in Step 14: matches page can send block/report actions. Admin panel, full moderation workflow, chat/messages, notifications and discovery ranking remain out of scope.

## Pagination and anti-abuse

List endpoints для discover, likes, matches, messages, reports и moderation должны использовать server-side pagination. Общий cursor pagination pattern находится в `apps/backend/src/common/pagination`:

- default `limit`: `20`;
- max `limit`: `50`;
- discovery cards max `limit`: `20`;
- frontend не может запросить unlimited list.

Для dating app это часть anti-scraping и anti-abuse foundation: большие списки профилей, сообщений или жалоб нельзя отдавать одним запросом.

## Database security/integrity baseline

- Greenfield schema применяется через Prisma migrations, а не через `prisma db push`.
- Migrations не должны содержать реальные email, пароли, refresh tokens, дампы БД или другие PII.
- DB-level constraints защищают критичные invariants даже при ошибке в application code.
- Case-insensitive unique indexes запрещают дубли email/handle, отличающиеся только регистром.
- Check constraints запрещают self-like, self-match, self-block и self-report.
- Expiring likes use `expires_at` and an overlap exclusion constraint so active interactions cannot overlap, while expired interactions and future rematch flows remain possible.
- Match pairs use canonical `user_a_id < user_b_id` ordering plus active-window overlap protection; expired matches do not block future rematch.
- Photo constraints запрещают published photo без approved moderation state и несколько primary photos для одного пользователя.
- Messages должны быть связаны с `conversation_participants`, чтобы sender был участником conversation.
- Raw passwords и raw refresh tokens не должны появляться ни в migrations, ни в seeds, ни в logs.

Полные security rules будут расширяться по мере реализации auth, chat, media, moderation и хранения данных.
