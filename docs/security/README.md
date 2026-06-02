# Security

Это стартовые правила безопасности для Yuni.

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
- Unordered unique match pair index запрещает duplicate matches для пар `A-B` и `B-A`.
- Photo constraints запрещают published photo без approved moderation state и несколько primary photos для одного пользователя.
- Messages должны быть связаны с `conversation_participants`, чтобы sender был участником conversation.
- Raw passwords и raw refresh tokens не должны появляться ни в migrations, ни в seeds, ни в logs.

Полные security rules будут расширяться по мере реализации auth, chat, media, moderation и хранения данных.
