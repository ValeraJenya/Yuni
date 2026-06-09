# Domain Model

Yuni разделен на доменные блоки, которые хорошо ложатся на PostgreSQL tables и будущие NestJS modules.

## Auth

`users` хранит account identity, `password_hash`, status, verification и lifecycle timestamps. `refresh_tokens` хранит hashed refresh tokens, expiry, revocation state, last use и легкие device metadata. Raw passwords и raw tokens нельзя сохранять или логировать.

## Users

`users` - стабильная owner identity для auth, profiles, likes, matches, conversations, notifications, blocks, reports, privacy settings и notification settings. Большинство owner checks должны начинаться с authenticated `user.id`.

## Profiles

`profiles` хранит один underlying dating profile и использует `user_id` как primary key. Public handle находится в `profiles.handle`, а не в `users`, потому что публичная идентичность относится к presentation layer профиля.

Для MVP handle - технический URL-friendly identifier: латинские буквы, цифры, underscore, dot, длина 3-30 символов. Пользовательский текст профиля может поддерживать обычный язык ввода, включая кириллицу.

`birth_date` хранится вместо age, чтобы backend вычислял возраст на момент запроса. Discoverability профиля должна комбинироваться с privacy settings, approved primary photo checks и block checks.

Open/private presentation моделируется через `privacy_settings`, без второй таблицы профиля. В open mode backend может отдавать более полный профиль. В private mode backend должен отдавать меньший набор данных, например вычисленный age и selected interests. User-uploaded photos в private mode не показываются; вместо них используется `privacy_settings.anonymous_avatar_key` для системного rabbit avatar.

Discovery eligibility - backend rule, поддерживаемый схемой. Профиль eligible только если account/profile active, discoverability включена, privacy settings разрешают discovery, minimum profile completion выполнен, block filters прошли и есть минимум одно approved published public photo.

## Discovery

Discovery MVP (`GET /discovery/cards`) is a read boundary over existing tables, not a new database model. It uses `Profile.userId` as the card identity and cursor because `profiles.user_id` is the Profile primary key.

Cards are eligible only when the target user is active/not deleted, the profile is completed and discoverable, privacy settings are explicitly open/discoverable, the pair has no active block in either direction, the current user has no active LIKE/SKIP cooldown for the target, and there is no active match between the users. Expired LIKE/SKIP and expired matches do not block rediscovery.

Discovery returns computed age instead of raw `birth_date`, and only approved/published `publicUrl` photos. Ranking, random ordering, geolocation/radius and premium filters are future improvements.

## Media And Photos

`profile_photos` хранит object storage keys, optional public URLs, dimensions, ordering, primary-photo state, moderation status и publishing timestamps. PostgreSQL не хранит image binaries. Фото может быть uploaded и moderated до публикации; profile responses должны отдавать только approved и published photos.

## Likes

`likes` хранит directional decisions между двумя users. В Step 12 реализованы только временные `LIKE` и `SKIP/PASS`:

- API `like` сохраняется как `LikeKind.like`;
- API `skip`/`pass` сохраняется как `LikeKind.pass`;
- `superlike` остается будущим расширением и не реализован в Step 12.

У Profile нет отдельного id: target profile в likes API обозначается как `targetProfileUserId`, то есть `profiles.user_id`.

LIKE действует 3 days, SKIP/PASS действует 1 day. `expires_at` задает cooldown window: active interaction blocks another LIKE/SKIP for the same liker/liked pair until expiration, while expired interactions do not block a new action.

Схема не использует вечный unique `(liker_user_id, liked_user_id)`, потому что это мешало бы future rematch. Вместо этого DB-level overlap exclusion constraint защищает от пересекающихся active interactions for the same pair. Race behavior for this constraint should be covered in a later integration/e2e step with a test database.

## Matches

`matches` представляет mutual relationship между двумя users. Step 13 создает match только при mutual active LIKE: обе directional записи `likes` должны быть `LikeKind.like`, и обе должны иметь `expires_at > now()`. Step 14 запрещает создание match, если между пользователями есть block в любую сторону.

Пара хранится в canonical order: `user_a_id < user_b_id`. Это не permission model, а стабильная нормализация пары, чтобы `A-B` и `B-A` не создавали разные active matches.

Новые matches получают стандартный 7-day `expires_at`. Match считается active только если `status=active` и `expires_at > now()`. В Step 13 нет cron/job, который переводит status в `expired`; services фильтруют active matches по `expires_at`. При block active match между пользователями завершается через `status=blocked` и `ended_at=now`; unblock не восстанавливает старый match.

Вечный unique на пару пользователей не используется, потому что он блокировал бы future rematch. Вместо него DB-level exclusion constraint запрещает overlapping active match windows for the same canonical pair. Expired match не блокирует future rematch.

`conversations.match_id` остается nullable unique relation to match. Chat не реализуется в Step 13: если future conversation уже существует, она может оставаться в Messages после исчезновения match из `/matches/me`.

## Chat

`conversations` - chat thread. `conversation_participants` - access-control boundary для chat reads/writes. `messages` требует, чтобы sender был участником conversation через composite foreign key, что делает owner checks понятными.

Step 16 Chat MVP использует уже существующие `Conversation`, `ConversationParticipant`, `Message`, `Match` и `Block`. Новая Prisma migration не нужна.

Conversation создается только из match через `POST /matches/:matchId/conversation`. Active match (`status=active`, `expires_at > now`) может создать новую conversation. Если match expired и conversation еще нет, новый чат не создается. Если conversation уже была создана раньше, она остается доступной через `/chat/conversations` даже после истечения match.

`conversations.match_id` уникален, поэтому repeated start возвращает existing conversation idempotently. Race на unique `match_id` должен обрабатываться application service как safe read-existing path.

Messages MVP - plain text only. API принимает поле `text`, а DB хранит его в `messages.body`. Backend trim-ит текст, запрещает пустые сообщения и ограничивает длину `2000` символов. In-app notifications for received messages are handled by Step 18 without storing message body in notification rows. Realtime, typing, read receipts, attachments/media messages, encryption and complex search are future work.

Blocks apply to chat in both directions: blocked conversations are hidden from list, message read uses not-found style, and send returns safe `403`.

## Notifications

`notifications` хранит in-app notification events for the recipient user. Step 18 реализует только `match_created`, `message_received` и reserved `system` notifications.

Notification rows store lightweight references and `message_key`, not rendered text snapshots, raw message body, email, birth date, private profile data, storage keys or moderation internals. `actor_user_id` is nullable so deleted actors can be handled safely; public list serializers hide actorless match/message notifications and allow `actor=null` only for system notifications.

Notifications lifecycle: created, unread/read via nullable `read_at`, list with cursor pagination, unread count, mark one read and mark all read. Owner checks start from authenticated `CurrentUser.id`, and users can only read or mutate their own notifications.

Match notifications are created only after a new `Match` row is created, one for each participant with the other participant as actor. Message notifications are created only for the other active participant after a successful message send. Active blocks in either direction prevent new visible notification events and hide existing actor notifications from list/count.

Notifications are in-app only. Push/email notifications, WebSocket/realtime delivery, queues/workers, Redis/Valkey, mobile notifications, notification preferences UI, admin notification tools and complex templates are future work.

## Moderation

`blocks` и `reports` - first-class entities. Blocks directional, duplicate blocker/blocked pairs запрещены. Step 14 использует hard delete для unblock: active block row существует только пока blocker держит block, а repeated block возвращает idempotent success. Blocks влияют в обе стороны на public profile visibility, discovery, LIKE/SKIP, match creation и `/matches/me`.

Reports user-focused для MVP: reporter, reported user, reason code, optional comment и review status. Public API возвращает только safe `"received"` status, не internal moderation workflow. Optional message, conversation и photo references оставляют место для richer moderation context без превращения MVP в большую content moderation систему.

MVP report reason codes: `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, `other`.
