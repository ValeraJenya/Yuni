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
- Доступ к чатам должен проверяться через membership в `conversation_participants`.
- Доступ к профилям, фото, лайкам, матчам, блокировкам и жалобам должен строиться вокруг authenticated `user_id` и owner checks.
- Likes MVP принимает target profile только как `targetProfileUserId`, то есть `profiles.user_id`. У профиля нет отдельного публичного id.
- Private mode не должен отдавать user-uploaded photos; вместо них используется системный anonymous avatar.
- Auth endpoints имеют базовый throttling foundation. Production rate limits можно уточнить позже.

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

Mock/demo flow не является production auth source. Product UI может временно использовать mock-data для discover/matches/messages, но доступ к protected routes и состояние авторизации должны зависеть от backend session/API response, а не от frontend flag в storage.

## Backend access-control patterns

Backend security boundary для будущих product modules строится вокруг authenticated `user_id` из `CurrentUser`. Frontend значения `userId`, `profileId`, `photoId`, `conversationId`, `isOwner`, `isMember` и `isAdmin` считаются untrusted input и всегда проверяются на backend.

Общие helpers находятся в `apps/backend/src/common/security`:

- `assertOwner(resourceOwnerId, currentUserId)` и `assertSameUser(targetUserId, currentUserId)` - для owner-only операций.
- `assertConversationMember(membership, currentUserId)` - для chat reads/writes. Conversation id сам по себе не даёт доступ.
- `assertMatchParticipant(match, currentUserId)` - для match-scoped действий.
- `assertCanAccessProfile(profile, currentUserId)` - для own profile и public discover/profile access с учетом private mode.
- `assertCanAccessPhoto(photo, currentUserId)` - для own photos или approved+published public photos.

Отсутствующий ресурс возвращает `404 Resource not found`. Недостаточные права возвращают `403 Forbidden`. Ошибки не должны раскрывать детали вроде "user exists but you are not owner".

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
- Frontend profile page не хранит private profile data, access token или refresh token в `localStorage`/`sessionStorage`; profile data загружается через authenticated backend API.

## Profile Photos / Media MVP security rules

Profile Photos / Media MVP использует локальное файловое хранилище только как ранний development/MVP шаг. Production S3/CDN/media pipeline, async moderation и metadata processing будут отдельными задачами.

Security rules:

- Все endpoints `GET /media/profile-photos/me`, `POST /media/profile-photos`, `PATCH /media/profile-photos/:photoId/primary` и `DELETE /media/profile-photos/:photoId` требуют authenticated `CurrentUser`.
- Backend берет owner identity только из access token, а не из `userId`, `profileId`, `photoId`, `isOwner` или любых frontend flags в body/query/path.
- Upload принимает только multipart field `file`.
- Разрешены только `image/jpeg`, `image/png` и `image/webp`.
- Максимальный размер файла - `5 MB`.
- Storage filename генерируется backend через random UUID; original filename не используется как имя файла в storage и не возвращается клиенту.
- Local uploads path `apps/backend/uploads/profile-photos` не коммитится в репозиторий.
- Public responses не должны отдавать `storageKey`, filesystem path, original filename или moderation internals.
- Self response может видеть `moderationStatus`, но всё равно не должен видеть filesystem/storage internals.
- Public profile serializers отдают только photos с `publicUrl`, `moderationStatus=approved` и `publishedAt`.
- Owner checks mandatory для set primary и delete.
- DB constraints остаются последним слоем защиты для one-primary-per-user и запрета published photo без approved state.

Known MVP limitations:

- EXIF/metadata stripping пока не реализован и должен быть добавлен перед production media pipeline.
- Image dimension validation, malware scanning, perceptual hashing и async moderation не входят в этот MVP шаг.
- Локальное хранение подходит для development/early MVP, но не для production scale.

## Likes MVP security rules

Likes MVP реализует только `LIKE` и `SKIP/PASS`. Superlike, chat, blocks/reports и full backend discovery не входят в Step 12. Matches реализуются отдельно в Step 13 через `MatchesService`.

Security rules:

- Все endpoints `POST /likes/:targetProfileUserId` и `POST /likes/:targetProfileUserId/skip` требуют authenticated `CurrentUser`.
- `targetProfileUserId` означает `profiles.user_id`; backend не вводит отдельный profile id.
- Backend берет actor identity только из access token, а не из body/query/path или frontend state.
- Self-like и self-skip запрещены.
- Actor должен быть active и not deleted.
- Target user должен быть active и not deleted.
- Target profile должен быть доступен по текущим profile access rules: discoverable/open для другого пользователя.
- `like` сохраняется как `LikeKind.like`, `skip`/`pass` сохраняется как `LikeKind.pass`.
- LIKE cooldown - 3 days; SKIP/PASS cooldown - 1 day.
- Active interaction blocks another LIKE/SKIP for the same actor/target until `expiresAt`.
- Expired interaction does not block a new LIKE/SKIP.
- Duplicate active interaction returns safe `409 Active interaction already exists`.
- DB overlap constraint conflicts are mapped to the same safe `409`, without leaking constraint details.
- Response shape is explicit and safe: `interaction.targetProfileUserId`, `interaction.action`, `interaction.expiresAt`; raw Prisma `Like` rows are never returned.

Known MVP limitations:

- Race/exclusion constraint behavior should be covered by integration/e2e tests with a test database in a later step.
- Backend discover feed, blocks/reports effects and superlike rules are intentionally outside Step 12.

## Matches MVP security rules

Matches MVP реализует только mutual matches from active LIKE interactions. Full chat, messages, blocks/reports, notifications and moderation are outside Step 13.

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
- Expired match does not block future rematch.
- DB overlap constraint conflicts are mapped to the existing active match or a safe conflict.
- `/matches/me` returns only matches where the current user is a participant.
- Match response shape is explicit and safe; raw Prisma `Match`, `User`, `Profile` and `ProfilePhoto` rows are never returned.
- Match responses must not expose `email`, `birthDate`, `passwordHash`, refresh/session fields, `storageKey`, local path, original filename or private profile settings.
- Conversation state is represented only as `conversationStarted`; chat is not implemented in Step 13.

Known MVP limitations:

- No cron/job marks expired matches. For MVP, services filter active matches by `status=active` and `expiresAt > now`.
- Race/exclusion behavior should be smoke-tested on a temporary PostgreSQL database before PR; broader e2e coverage can follow later.
- Blocks/reports effects are planned for Step 14 and are not applied in Step 13.

## Pagination and anti-abuse

List endpoints для discover, likes, matches, messages, reports и moderation должны использовать server-side pagination. Общий cursor pagination pattern находится в `apps/backend/src/common/pagination`:

- default `limit`: `20`;
- max `limit`: `50`;
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
