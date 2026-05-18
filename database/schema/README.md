# Database Schema

Это PostgreSQL-first draft схемы Yuni для MVP foundation. Схема намеренно описана SQL-first, чтобы будущий NestJS backend мог перенести ее в Prisma migrations без потери доменной модели.

## Сущности

- `users` хранит учетную запись, email, `password_hash`, lifecycle status и timestamps. Пароли не хранятся в открытом виде.
- `refresh_tokens` хранит hashed refresh tokens для пользовательских сессий и устройств. Токены имеют expiry, revocation и легкие device/session metadata.
- `profiles` хранит один underlying dating profile пользователя, включая публичный `handle`. Возраст вычисляется на backend из `birth_date`.
- `profile_photos` хранит storage keys, URLs, metadata, ordering, primary photo state, moderation state и publishing timestamps. Бинарники изображений не хранятся в PostgreSQL.
- `interests` и `profile_interests` описывают интересы и many-to-many связь с профилем.
- `likes` хранит directional decision: `like`, `superlike` или `pass`.
- `matches` хранит mutual relationship с `matched_at`, стандартным 7-дневным `expires_at` и lifecycle statuses.
- `conversations` представляет chat threads, обычно связанные с match.
- `conversation_participants` явно связывает пользователей с conversations и является основой chat owner checks.
- `messages` хранит текстовые сообщения. Composite foreign key требует, чтобы sender был участником conversation.
- `blocks` хранит directional user-to-user blocks.
- `reports` хранит user-focused moderation reports с reason code, optional comment, review status и optional references на message/photo context.
- `privacy_settings` хранит privacy и visibility controls, включая open/private presentation и system anonymous avatar key.
- `notification_settings` хранит notification preferences.

## Связи

У каждого `user` может быть один `profile`, один `privacy_settings`, один `notification_settings`, много `refresh_tokens`, много photos через profile, много likes, matches и conversation memberships.

`profiles.handle` - публичный технический identifier для URL, search, indexing и moderation. Для MVP он ограничен латинскими буквами, цифрами, underscore, dot и длиной 3-30 символов. Обычный profile content, например display name, bio, interests, work, education и будущие free-text поля, должен поддерживать обычный пользовательский ввод, включая кириллицу.

`likes` directional. `matches` mutual и используют unordered uniqueness, чтобы пары `A-B` и `B-A` не дублировались. Active matches истекают через `expires_at`. Для MVP expiration выполняется request-time логикой: backend должен считать active matches с `expires_at <= now()` истекшими и может opportunistically обновлять status на `expired`.

`blocks` и `reports` отделены от profiles и matches, чтобы safety flows применялись к discovery, matching и chat без перегруза других таблиц.

## Fixed MVP Rules

- Discovery eligibility требует active user/profile state, включенной profile discoverability, включенной privacy discoverability, minimum profile completion, block filters и минимум одно approved published primary photo.
- Private mode никогда не отдает user-uploaded photos. Backend presentation должен использовать `privacy_settings.anonymous_avatar_key` для системного rabbit avatar.
- Report reason codes: `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, `other`.

## Security And Privacy Notes

- Хранить только `password_hash`, никогда raw passwords.
- Хранить только `token_hash`, никогда raw refresh tokens.
- `birth_date`, location fields, messages, reports и blocks считаются sensitive data.
- Не отдавать профили, которые заблокировали текущего пользователя или были заблокированы им.
- Owner checks строить через `user_id` и conversation membership joins.
- Чтение сообщений должно идти через `conversation_participants` для текущего пользователя.
- Фото хранят object storage keys и metadata, не бинарники. В profile responses можно отдавать только approved и published photos.
- Discovery visibility должна проверять `users.status`, `profiles.is_discoverable`, `privacy_settings.discoverable`, `profiles.completed_at`, block state и approved published primary photo.
- Private profile mode должен enforced на backend serializers. User photos в private mode не показываются.
