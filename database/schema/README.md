# Database Schema

Это PostgreSQL-first reference схемы Yuni для MVP foundation. Файл `database/schema/schema.sql` остается domain documentation/reference и не является основным способом применения схемы.

Основной workflow применения схемы теперь находится в `apps/backend/prisma/migrations`. `apps/backend/prisma/schema.prisma` описывает ORM-модель для Prisma Client, а PostgreSQL-specific constraints/indexes должны сохраняться в `migration.sql`.

Проект стартует с новой пустой PostgreSQL БД. Legacy data migration, импорт старых пользователей, сохранение старых ID и cleanup старых данных не нужны.

## Docker Migration Workflow

Local Docker uses the same Prisma migrations. Backend containers do not run migrations automatically on startup.

For a new local Docker database:

```powershell
docker compose up -d postgres
corepack pnpm docker:migrate
```

`docker:migrate` runs `prisma migrate deploy` inside a backend container against the Docker network `postgres` service. Use `docker:reset:dev` only when intentionally deleting the local Docker PostgreSQL volume.

## Сущности

- `users` хранит учетную запись, email, `password_hash`, lifecycle status и timestamps. Пароли не хранятся в открытом виде.
- `refresh_tokens` хранит hashed refresh tokens для пользовательских сессий и устройств. Токены имеют expiry, revocation и легкие device/session metadata.
- `profiles` хранит один underlying dating profile пользователя, включая публичный `handle`. Возраст вычисляется на backend из `birth_date`.
- `profile_photos` хранит storage keys, URLs, metadata, ordering, primary photo state, moderation state и publishing timestamps. Бинарники изображений не хранятся в PostgreSQL.
- `interests` и `profile_interests` описывают интересы и many-to-many связь с профилем.
- `likes` хранит expiring directional interactions. Step 12 реализует `like` и `pass`/`skip`; `superlike` остается future work.
- `matches` хранит mutual relationship с `matched_at`, стандартным 7-дневным `expires_at`, lifecycle statuses и canonical `user_a_id < user_b_id` pair order.
- `conversations` представляет chat threads, обычно связанные с match.
- `conversation_participants` явно связывает пользователей с conversations и является основой chat owner checks.
- `messages` хранит текстовые сообщения. Composite foreign key требует, чтобы sender был участником conversation.
- `blocks` хранит directional user-to-user blocks. В Step 14 active block - это существующая row; unblock делает hard delete.
- `reports` хранит user-focused moderation reports с reason code, optional comment, review status и optional references на message/photo context. Public API не раскрывает internal review status.
- `privacy_settings` хранит privacy и visibility controls, включая open/private presentation и system anonymous avatar key.
- `notification_settings` хранит notification preferences.
- `notifications` хранит in-app notification events с recipient, optional actor, type, message key, read state и optional references на match/conversation/message.

Step 15 Discovery MVP uses the existing `users`, `profiles`, `profile_photos`, `privacy_settings`, `likes`, `matches` and `blocks` tables. It does not require a new table, Prisma schema change or migration.

Step 16 Chat MVP uses the existing `conversations`, `conversation_participants`, `messages`, `matches` and `blocks` tables. It does not require a new table, Prisma schema change or migration.

Step 18 Notifications MVP adds the `notifications` table and `NotificationType` enum through a new Prisma migration. Notifications are in-app only and store message keys plus references, not raw message bodies, email, birth date, profile snapshots, storage keys, private settings or moderation internals.

## Связи

У каждого `user` может быть один `profile`, один `privacy_settings`, один `notification_settings`, много `refresh_tokens`, много photos через profile, много likes, matches и conversation memberships.

`profiles.handle` - публичный технический identifier для URL, search, indexing и moderation. Для MVP он ограничен латинскими буквами, цифрами, underscore, dot, hyphen и длиной 3-30 символов. Обычный profile content, например display name, bio, interests, work, education и будущие free-text поля, должен поддерживать обычный пользовательский ввод, включая кириллицу.

`likes` directional and time-bound: LIKE действует 3 days, SKIP/PASS действует 1 day. Вечный unique `(liker_user_id, liked_user_id)` не используется, чтобы не блокировать future rematch. Active overlap для одной пары защищается PostgreSQL exclusion constraint. `matches` mutual, canonicalized by stable user id order, and protected by an active-window exclusion constraint rather than a permanent unique pair. Active matches истекают через `expires_at`; для MVP active означает `status='active'` и `expires_at > now()`. Expired matches не блокируют future rematch.

`blocks` и `reports` отделены от profiles и matches, чтобы safety flows применялись к discovery, profile visibility, likes, matching и future chat без перегруза других таблиц. Повторный block одной пары не создает дубль; unblock не восстанавливает старые matches.

`conversations.match_id` is nullable unique so a match can have at most one conversation. `conversation_participants` is the access-control boundary for reads and sends. `messages.body` stores backend-trimmed plain text from API `text`; sender must exist as a conversation participant through the composite foreign key.

`notifications.recipient_user_id` is the owner boundary. `actor_user_id` is nullable for safe deleted-actor handling, but public serializers hide actorless match/message notifications and allow `actor=null` only for system notifications. `read_at` tracks unread/read state. Active blocks in either direction prevent new visible notification events and hide existing actor notifications from list/count.

## Fixed MVP Rules

- Discovery eligibility требует active user/profile state, включенной profile discoverability, включенной privacy discoverability, minimum profile completion, block filters и минимум одно approved published public photo.
- Chat creation requires a match participant and active match unless an existing conversation already exists. Existing conversations remain available after match expiration.
- Active block in either direction hides chat list/read access and prevents new messages.
- Message text is plain text only for MVP, trimmed by backend, non-empty and max `2000` characters.
- Notification events are in-app only for MVP. Push/email/WebSocket/realtime delivery, queues/workers, Redis/Valkey, mobile notifications, notification preferences UI, admin notification tools and complex templates are outside Step 18.
- Notification rows must not store raw message body.
- Private mode никогда не отдает user-uploaded photos. Backend presentation должен использовать `privacy_settings.anonymous_avatar_key` для системного rabbit avatar.
- Blocks действуют в обе стороны для public profile visibility, LIKE/SKIP и matches. При block active match завершается `status='blocked'`.
- Report reason codes: `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, `other`.

## Security And Privacy Notes

- Хранить только `password_hash`, никогда raw passwords.
- Хранить только `token_hash`, никогда raw refresh tokens.
- `birth_date`, location fields, messages, reports и blocks считаются sensitive data.
- Не отдавать профили, которые заблокировали текущего пользователя или были заблокированы им.
- Owner checks строить через `user_id` и conversation membership joins.
- Чтение сообщений должно идти через `conversation_participants` для текущего пользователя.
- Фото хранят object storage keys и metadata, не бинарники. В profile responses можно отдавать только approved и published photos.
- Discovery visibility должна проверять `users.status`, `profiles.is_discoverable`, `privacy_settings.discoverable`, `profiles.completed_at`, block state, active LIKE/SKIP cooldowns, active matches и approved published public photo.
- Private profile mode должен enforced на backend serializers. User photos в private mode не показываются.
- Notification responses must use explicit safe shapes and must not expose message bodies, private profile fields, media storage internals, block/report internals or raw Prisma rows.
