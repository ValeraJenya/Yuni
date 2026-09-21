# Domain Model

Yuni разделен на доменные блоки, которые хорошо ложатся на PostgreSQL tables и реализованные NestJS modules.

## Auth

`users` хранит account identity, `password_hash`, status, verification и lifecycle timestamps. `refresh_tokens` хранит hashed refresh tokens, expiry, revocation state, last use и легкие device metadata. Raw passwords и raw tokens нельзя сохранять или логировать.

## Users

`users` - стабильная owner identity для auth, profiles, likes, matches, conversations, notifications, blocks, reports, privacy settings и notification settings. Большинство owner checks должны начинаться с authenticated `user.id`.

## Data ownership and identifiers — CURRENT / OPEN

Static evidence on `8092c1aa0a1ddfc15ec368c8f05a306fc2e9e993`: `apps/backend/prisma/schema.prisma`, its migrations, `common/security/access-control.ts`, `MediaModule` and `LocalProfilePhotoStorageService`. This table describes implemented storage; it does not create new models.

| Data | CURRENT storage / responsible module | Boundary or gap |
| --- | --- | --- |
| Users / profiles | PostgreSQL `User` / `Profile`; Auth and Profiles | `Profile.userId` is its PK and owner FK; `handle` is public lookup data |
| Photos | PostgreSQL `ProfilePhoto`; bytes in local adapter; Media | Owner is `userId`; keys stay internal; direct byte-serving policy is OPEN |
| Roles | No `Role`, `UserRole` or user role column in Prisma | `UserStatus` is account lifecycle, not RBAC; future role model is OPEN |
| Chat history | PostgreSQL `Conversation`, `Message`, `ConversationParticipant`; Chat | Membership is checked on backend; WSS would be delivery, not canonical history |
| Attachments | No attachment object/storage model or upload flow | `voiceDurationSec` is client-supplied metadata, not stored/verified audio bytes |
| Sessions | PostgreSQL `RefreshToken`; Auth | Hashed refresh material and revocation state; access JWT validation is separate |
| Financial transactions | No wallet/gift/payment/withdrawal/ledger models or services | [Financial proposal](./financial-flow.md); no balances or payouts are operational |

Independent entity PKs use PostgreSQL `uuid` with `gen_random_uuid()` defaults, including users, photos, refresh sessions and messages. On PostgreSQL 16 this produces UUIDv4 ([official documentation](https://www.postgresql.org/docs/16/functions-uuid.html)). The local media adapter independently calls Node `randomUUID()` for filenames. These are opaque generated identifiers, not PII-derived keys. `Profile`, privacy and notification settings share the user PK; participants and profile interests use composite PKs. PK/UNIQUE/FK constraints, not collision probability alone, enforce database identity and relations.

**TARGET:** UUIDs never substitute for ownership, membership or permissions: guessing or possessing `photoId`/`conversationId` must not grant access (IDOR/BOLA). Public handles are not opaque authorization tokens and can contain user-chosen data. Session IDs and storage keys are internal; only allowlisted resource IDs go through serializers. Existing endpoint evidence is in `MediaService.setProfilePhotoPrimary/deleteProfilePhoto` and `ChatService`; this is not an assurance that every path is covered.

**OPEN:** UUIDv7, separate internal PK + public UUID, and IDs for future financial entities require a demonstrated ordering/indexing or exposure need before an ADR/migration. Keep current UUIDv4 defaults until such a decision; do not invent deployed IDs for absent entities.

## Profiles

`profiles` хранит один underlying dating profile и использует `user_id` как primary key. Public handle находится в `profiles.handle`, а не в `users`, потому что публичная идентичность относится к presentation layer профиля.

Для MVP handle - технический URL-friendly identifier: латинские буквы, цифры, underscore, dot, длина 3-30 символов. Пользовательский текст профиля может поддерживать обычный язык ввода, включая кириллицу.

`birth_date` хранится вместо age, чтобы backend вычислял возраст на момент запроса. Profile completion не хранится отдельной колонкой: backend вычисляет его из `displayName`, `birthDate`, `bio`, `gender`, `lookingFor`, `city`, `country` и хотя бы одного approved/published public photo. Primary photo, `isDiscoverable` и privacy settings не являются completion gates.

Open/private presentation моделируется через `privacy_settings`, без второй таблицы профиля. В open mode backend может отдавать более полный профиль. В private mode backend должен отдавать меньший набор данных, например вычисленный age и selected interests. User-uploaded photos в private mode не показываются; вместо них используется `privacy_settings.anonymous_avatar_key` для системного rabbit avatar.

Discovery eligibility - backend rule, поддерживаемый схемой. Профиль eligible только если account/profile active, discoverability включена, privacy settings разрешают discovery, shared computed profile-completion predicate выполнен, block filters прошли и есть минимум одно approved published public photo.

## Discovery

Discovery MVP (`GET /discovery/cards`) is a read boundary over existing tables, not a new database model. It uses `Profile.userId` as the card identity and cursor because `profiles.user_id` is the Profile primary key.

Cards are eligible only when the target user is active/not deleted, the profile is completed and discoverable, privacy settings are explicitly open/discoverable, the pair has no active block in either direction, the current user has no active LIKE/SKIP cooldown for the target, and there is no active match between the users. Expired LIKE/SKIP and expired matches do not block rediscovery.

Discovery returns computed age instead of raw `birth_date`, and only approved/published `publicUrl` photos. Ranking, random ordering, geolocation/radius and premium filters are future improvements.

## Media And Photos

`profile_photos` хранит storage-adapter keys, optional public URLs, dimensions, ordering, primary-photo state, moderation status и publishing timestamps. CURRENT bytes хранятся локально, не в S3; PostgreSQL не хранит image binaries. Схема допускает moderation lifecycle, но текущий upload сразу выставляет approved и published. Profile responses фильтруют фото; direct URL behavior описан в [Program Flow Map](./program-flow-map.md).

## Likes

`likes` хранит directional decisions между двумя users. В Step 12 реализованы только временные `LIKE` и `SKIP/PASS`:

- API `like` сохраняется как `LikeKind.like`;
- API `skip`/`pass` сохраняется как `LikeKind.pass`;
- `superlike` не реализован в MVP.

У Profile нет отдельного id: target profile в likes API обозначается как `targetProfileUserId`, то есть `profiles.user_id`.

LIKE действует 3 days, SKIP/PASS действует 1 day. `expires_at` задает cooldown window: active interaction blocks another LIKE/SKIP for the same liker/liked pair until expiration, while expired interactions do not block a new action.

Схема не использует вечный unique `(liker_user_id, liked_user_id)`, потому что это мешало бы future rematch. Вместо этого DB-level overlap exclusion constraint защищает от пересекающихся active interactions for the same pair. Ordinary integration/e2e artifacts already exist: [match-block-chat.e2e-spec.ts](../../apps/backend/test/match-block-chat.e2e-spec.ts) contains like/match/block concurrency scenarios, and [Quality Gates](../../.github/workflows/quality-gates.yml) runs backend e2e against its separate CI PostgreSQL service. These tests do not establish complete constraint/race coverage.

Ordinary automated tests and targeted audit validation are distinct: [CI run on `bea416879779e361ee5711dc2259ec61078a5a73`, 2026-09-16](https://github.com/ValeraJenya/Yuni/actions/runs/35093793555) completed backend e2e successfully. The [2026-09-06 local baseline](../audits/yuni-2026-09/02-BASELINE.md) retains its historical e2e BLOCKED result; [RV-01–09](../audits/yuni-2026-09/07-WAVE-1-FOLLOWUPS.md) remain Not run. In particular, an ordinary CI pass does not confirm or reject the SEC-003 concurrent conversation-start hypothesis.

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

CURRENT messages API принимает поле `text`, а DB хранит его в `messages.body`; staged-chat использует также `voiceDurationSec`, `messageWeight` и system messages. Это не реализованная загрузка audio attachments. In-app notifications не хранят message body. Realtime delivery, attachments и encryption остаются future work; текущие endpoints см. в [API reference](../api/README.md).

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
