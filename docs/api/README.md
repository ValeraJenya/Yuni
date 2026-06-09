# API

Это короткая API-документация для текущего backend foundation. Сейчас реализованы auth/session flow, Profiles MVP, Profile Photos / Media MVP, Likes MVP, Matches MVP, Blocks/Reports MVP и Discovery MVP.

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
- `GET /discovery/cards` использует более строгий max `limit`: `20`;
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

## Profiles

Все profile endpoints требуют `Authorization: Bearer <accessToken>`. Frontend вызывает их через общий auth client: access token живет только в memory, а refresh cookie остается HttpOnly.

### Get My Profile

```bash
curl -i http://localhost:4000/profiles/me \
  -H "Authorization: Bearer <accessToken>"
```

Ответ:

- `profile.userId`;
- `profile.handle`;
- `profile.displayName`;
- `profile.birthDate` для владельца профиля;
- `profile.bio`, `gender`, `lookingFor`, `city`, `country`, `isDiscoverable`;
- `profile.photos` в owner/self shape, включая moderation status.

Self response не должен отдавать `email`, `passwordHash`, refresh/session fields, raw tokens или private settings.

### Update My Profile

```bash
curl -i -X PATCH http://localhost:4000/profiles/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d "{\"displayName\":\"Alex\",\"bio\":\"Short bio\",\"city\":\"Almaty\",\"country\":\"KZ\",\"isDiscoverable\":true}"
```

Разрешенные поля:

- `displayName`;
- `bio`;
- `gender`;
- `lookingFor`;
- `city`;
- `country`;
- `isDiscoverable`.

Поля вроде `userId`, `email`, `password`, `birthDate`, `handle`, `status`, `role`, `photos`, moderation fields и `privacySettings` нельзя обновлять через этот endpoint. Global `ValidationPipe` использует whitelist + forbidNonWhitelisted, поэтому лишние поля возвращают `400`.

Строковые поля trim-ятся на backend. Пустые optional строки для `bio`, `gender`, `lookingFor`, `city` и `country` сохраняются как `null`. Пустой `displayName` невалиден.

### Get Public Profile By Handle

```bash
curl -i http://localhost:4000/profiles/test_user \
  -H "Authorization: Bearer <accessToken>"
```

`handle` ищется case-insensitive. Public response не отдает `email`, `birthDate`, private settings, refresh/session fields, raw tokens или internal moderation fields.

Если profile не найден, API возвращает `404`. Если profile существует, но не доступен текущему пользователю из-за `isDiscoverable=false` или private visibility mode, API возвращает `403 Forbidden`. Владелец всегда может читать свой профиль.

## Profile Photos / Media MVP

Все media endpoints требуют `Authorization: Bearer <accessToken>`. Backend берет владельца только из `CurrentUser`, а не из body/query/path.

Локальное MVP-хранилище:

- файлы сохраняются в `apps/backend/uploads/profile-photos`;
- папка uploads не коммитится;
- `publicUrl` имеет вид `/uploads/profile-photos/<generated-file-name>`;
- storage filename генерируется backend через random UUID и не использует original filename;
- production S3/CDN pipeline будет отдельным шагом позже.

### Get My Profile Photos

```bash
curl -i http://localhost:4000/media/profile-photos/me \
  -H "Authorization: Bearer <accessToken>"
```

Owner response возвращает `id`, `publicUrl`, `blurhash`, `isPrimary`, `position`, `moderationStatus` и `publishedAt`. Self response не должен отдавать `storageKey`, filesystem path, original filename, private tokens или user secrets.

### Upload Profile Photo

```bash
curl -i -X POST http://localhost:4000/media/profile-photos \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@./local-photo.png"
```

Contract:

- multipart field: `file`;
- allowed MIME types: `image/jpeg`, `image/png`, `image/webp`;
- max size: `5 MB`;
- unsupported type or missing file returns `400`;
- too large file returns `413` at upload boundary or `400` if rejected by service validation;
- local MVP marks uploaded photos as `approved` and published immediately;
- first uploaded photo becomes primary automatically.

### Set Primary Profile Photo

```bash
curl -i -X PATCH http://localhost:4000/media/profile-photos/<photoId>/primary \
  -H "Authorization: Bearer <accessToken>"
```

Only the owner can set a photo as primary. Non-owner access returns `403`; missing photo returns `404`.

### Delete Profile Photo

```bash
curl -i -X DELETE http://localhost:4000/media/profile-photos/<photoId> \
  -H "Authorization: Bearer <accessToken>"
```

Only the owner can delete a photo. Backend deletes the DB row and best-effort removes the local file. If the deleted photo was primary, backend promotes the next owner photo by position.

### Public Profile Photo Visibility

Public profile responses include only photos that have:

- `publicUrl`;
- `moderationStatus=approved`;
- `publishedAt` set.

Public profile responses do not expose `storageKey`, filesystem path, original filename, moderation internals or private owner-only fields.

## Discovery MVP

`GET /discovery/cards` требует `Authorization: Bearer <accessToken>`. Backend берет actor только из `CurrentUser`; frontend не может передать actor id.

```bash
curl -i "http://localhost:4000/discovery/cards?limit=20" \
  -H "Authorization: Bearer <accessToken>"
```

Query:

- `limit` optional, default `20`, max `20`;
- `cursor` optional, значение из `nextCursor`;
- cursor соответствует `profiles.user_id`, потому что у Profile нет отдельного id.

Response shape:

```json
{
  "cards": [
    {
      "userId": "22222222-2222-4222-8222-222222222222",
      "handle": "target_user",
      "displayName": "Target",
      "bio": "Short public bio",
      "gender": "female",
      "lookingFor": "relationship",
      "city": "Almaty",
      "country": "KZ",
      "age": 26,
      "primaryPhotoUrl": "/uploads/profile-photos/photo.jpg",
      "photos": [
        {
          "publicUrl": "/uploads/profile-photos/photo.jpg"
        }
      ]
    }
  ],
  "nextCursor": null
}
```

Discovery filters on backend:

- excludes current user;
- excludes inactive/deleted users;
- requires `profiles.is_discoverable=true`;
- requires `profiles.completed_at`;
- requires explicit open and discoverable `privacy_settings`;
- requires at least one approved, published photo with `publicUrl`;
- excludes active block in either direction;
- excludes active LIKE/SKIP cooldown from current user where `expiresAt > now`;
- excludes active match where `status=active` and `expiresAt > now`.

Expired LIKE/SKIP and expired matches do not block rediscovery. Sorting is stable, not random: `createdAt desc`, then `userId desc`. Ranking, random ordering, geolocation/radius, premium filters, chat/messages, notifications and admin/moderation panels are outside Discovery MVP.

Discovery response must not expose raw `birthDate`, email, password/passwordHash, refresh/session fields, storage keys, local paths, original filenames, private profile/privacy fields, block/report/moderation internals or raw Prisma rows.

## Likes MVP

Все likes endpoints требуют `Authorization: Bearer <accessToken>`. Backend берет actor только из `CurrentUser`, а не из body/query/path.

Важно по naming: `targetProfileUserId` - это `profiles.user_id`. У Profile нет отдельного id; primary key профиля равен user id. Если в старых заметках встречается `targetProfileId`, его нужно читать как `profiles.user_id`, а не как новый profile id.

Step 12 реализует только `LIKE` и `SKIP/PASS`:

- `like` сохраняется как `LikeKind.like`;
- `skip`/`pass` сохраняется как `LikeKind.pass`;
- superlike не реализован в Step 12;
- matches реализованы отдельным Step 13 через optional `match` в LIKE response и `GET /matches/me`;
- Step 14 добавляет block-aware enforcement: active block в любую сторону запрещает LIKE/SKIP.

### Like Profile

```bash
curl -i -X POST http://localhost:4000/likes/<targetProfileUserId> \
  -H "Authorization: Bearer <accessToken>"
```

Response shape:

```json
{
  "interaction": {
    "targetProfileUserId": "22222222-2222-4222-8222-222222222222",
    "action": "like",
    "expiresAt": "2026-06-10T12:00:00.000Z"
  },
  "match": {
    "id": "33333333-3333-4333-8333-333333333333",
    "matchedProfile": {
      "userId": "22222222-2222-4222-8222-222222222222",
      "handle": "target_user",
      "displayName": "Target",
      "primaryPhotoUrl": "/uploads/profile-photos/photo.jpg"
    },
    "matchedAt": "2026-06-07T12:00:00.000Z",
    "expiresAt": "2026-06-14T12:00:00.000Z",
    "status": "active",
    "conversationStarted": false
  }
}
```

LIKE cooldown: 3 days. Active LIKE/SKIP for the same actor and target blocks another LIKE/SKIP until `expiresAt`. Expired interactions do not block a new action. `match` is present only when the backend detected a mutual active LIKE and created or found an active match; clients must not show fake/random match UI when `match` is absent.

### Skip / Pass Profile

```bash
curl -i -X POST http://localhost:4000/likes/<targetProfileUserId>/skip \
  -H "Authorization: Bearer <accessToken>"
```

Response shape:

```json
{
  "interaction": {
    "targetProfileUserId": "22222222-2222-4222-8222-222222222222",
    "action": "skip",
    "expiresAt": "2026-06-08T12:00:00.000Z"
  }
}
```

SKIP/PASS cooldown: 1 day.

Security and conflict behavior:

- self-like and self-skip return `400`;
- inactive/deleted actor returns `401`;
- missing, inactive or deleted target user returns `404`;
- target profile must be discoverable/open by current profile access rules;
- blocked pair in either direction returns safe `403`;
- active duplicate interaction returns safe `409`;
- DB overlap constraint conflicts are also mapped to safe `409`;
- response is an explicit safe shape, not a raw Prisma `Like` row.

## Matches MVP

Все matches endpoints требуют `Authorization: Bearer <accessToken>`.

Step 13 реализует только взаимные matches на основе active LIKE:

- match появляется при mutual active LIKE;
- mutual active LIKE означает `A -> B` и `B -> A`, оба `LikeKind.like`, оба `expiresAt > now`;
- match active only when `status=active` and `expiresAt > now`;
- match активен 7 days from `matchedAt`;
- match исчезает из `/matches/me` после `expiresAt`;
- cron/job для перевода `status` в `expired` в Step 13 не нужен;
- chat не реализуется в Step 13;
- Step 14 blocks могут завершить active match через `status=blocked` и скрывают blocked pair из `/matches/me`.

### Get My Active Matches

```bash
curl -i http://localhost:4000/matches/me \
  -H "Authorization: Bearer <accessToken>"
```

Response shape:

```json
{
  "matches": [
    {
      "id": "33333333-3333-4333-8333-333333333333",
      "matchedProfile": {
        "userId": "22222222-2222-4222-8222-222222222222",
        "handle": "target_user",
        "displayName": "Target",
        "primaryPhotoUrl": "/uploads/profile-photos/photo.jpg"
      },
      "matchedAt": "2026-06-07T12:00:00.000Z",
      "expiresAt": "2026-06-14T12:00:00.000Z",
      "status": "active",
      "conversationStarted": false
    }
  ]
}
```

Response contains only current user's active matches and filters out blocked pairs in either direction. It must not expose raw Prisma `Match`, `User`, `Profile` or `ProfilePhoto` rows, `email`, `birthDate`, `passwordHash`, refresh/session fields, `storageKey`, local file path, original filename or private profile settings.

## Blocks / Reports MVP

Все moderation endpoints требуют `Authorization: Bearer <accessToken>`. Backend берет actor только из `CurrentUser`; frontend не может передать blocker/reporter user id.

### Block User

```bash
curl -i -X POST http://localhost:4000/blocks/<targetUserId> \
  -H "Authorization: Bearer <accessToken>"
```

Response shape:

```json
{
  "block": {
    "blockedUserId": "22222222-2222-4222-8222-222222222222",
    "createdAt": "2026-06-07T12:00:00.000Z",
    "status": "blocked"
  }
}
```

Self-block returns `400`. Duplicate block returns the same safe success shape and does not create duplicate rows. Creating a block ends any active match between the users with `status=blocked` and `endedAt=now`; unblock does not restore old matches.

### Unblock User

```bash
curl -i -X DELETE http://localhost:4000/blocks/<targetUserId> \
  -H "Authorization: Bearer <accessToken>"
```

Response shape:

```json
{
  "success": true,
  "blockedUserId": "22222222-2222-4222-8222-222222222222"
}
```

Unblock uses hard delete scoped to `blockerUserId=CurrentUser.id` and is idempotent.

### Get My Blocks

```bash
curl -i "http://localhost:4000/blocks/me?limit=20" \
  -H "Authorization: Bearer <accessToken>"
```

Response shape:

```json
{
  "blocks": [
    {
      "blockedUserId": "22222222-2222-4222-8222-222222222222",
      "createdAt": "2026-06-07T12:00:00.000Z",
      "status": "blocked"
    }
  ],
  "nextCursor": null
}
```

Only the current user's own outgoing blocks are returned, with cursor pagination.

### Report User

```bash
curl -i -X POST http://localhost:4000/reports \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"targetUserId":"22222222-2222-4222-8222-222222222222","reason":"other","details":"Optional context"}'
```

`reason` must be an existing `ReportReasonCode`: `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, `other`. `details` is optional, trimmed, empty string becomes `null`, max length is `1000`.

Response shape:

```json
{
  "report": {
    "id": "33333333-3333-4333-8333-333333333333",
    "targetUserId": "22222222-2222-4222-8222-222222222222",
    "reason": "other",
    "createdAt": "2026-06-07T12:00:00.000Z",
    "status": "received"
  }
}
```

Report response never exposes internal moderation status, notes or workflow. `GET /reports/me`, admin panel, full moderation workflow, chat/messages, notifications and discovery ranking are outside Step 14.

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
