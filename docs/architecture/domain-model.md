# Domain Model

Yuni разделен на доменные блоки, которые хорошо ложатся на PostgreSQL tables и будущие NestJS modules.

## Auth

`users` хранит account identity, `password_hash`, status, verification и lifecycle timestamps. `refresh_tokens` хранит hashed refresh tokens, expiry, revocation state, last use и легкие device metadata. Raw passwords и raw tokens нельзя сохранять или логировать.

## Users

`users` - стабильная owner identity для auth, profiles, likes, matches, conversations, blocks, reports, privacy settings и notification settings. Большинство owner checks должны начинаться с authenticated `user.id`.

## Profiles

`profiles` хранит один underlying dating profile и использует `user_id` как primary key. Public handle находится в `profiles.handle`, а не в `users`, потому что публичная идентичность относится к presentation layer профиля.

Для MVP handle - технический URL-friendly identifier: латинские буквы, цифры, underscore, dot, длина 3-30 символов. Пользовательский текст профиля может поддерживать обычный язык ввода, включая кириллицу.

`birth_date` хранится вместо age, чтобы backend вычислял возраст на момент запроса. Discoverability профиля должна комбинироваться с privacy settings, approved primary photo checks и block checks.

Open/private presentation моделируется через `privacy_settings`, без второй таблицы профиля. В open mode backend может отдавать более полный профиль. В private mode backend должен отдавать меньший набор данных, например вычисленный age и selected interests. User-uploaded photos в private mode не показываются; вместо них используется `privacy_settings.anonymous_avatar_key` для системного rabbit avatar.

Discovery eligibility - backend rule, поддерживаемый схемой. Профиль eligible только если account/profile active, discoverability включена, privacy settings разрешают discovery, minimum profile completion выполнен, block filters прошли и есть минимум одно approved published primary photo.

## Media And Photos

`profile_photos` хранит object storage keys, optional public URLs, dimensions, ordering, primary-photo state, moderation status и publishing timestamps. PostgreSQL не хранит image binaries. Фото может быть uploaded и moderated до публикации; profile responses должны отдавать только approved и published photos.

## Likes

`likes` хранит directional decisions: `like`, `superlike`, `pass`. Unique `(liker_user_id, liked_user_id)` не дает создавать дубликаты решений и упрощает mutual-like логику.

## Matches

`matches` представляет mutual relationship между двумя users. Unordered uniqueness не позволяет создать два match для одной пары. Status поддерживает `active`, `expired`, `unmatched`, `blocked`. Новые matches получают стандартный 7-дневный `expires_at`. Для MVP expiration делается request-time логикой: services считают active matches с `expires_at <= now()` истекшими и могут opportunistically обновлять status.

## Chat

`conversations` - chat thread. `conversation_participants` - access-control boundary для chat reads/writes. `messages` требует, чтобы sender был участником conversation через composite foreign key, что делает owner checks понятными.

## Moderation

`blocks` и `reports` - first-class entities. Blocks directional, duplicate blocker/blocked pairs запрещены. Blocks должны влиять на discovery, likes, matches и chat visibility.

Reports user-focused для MVP: reporter, reported user, reason code, optional comment и review status. Optional message, conversation и photo references оставляют место для richer moderation context без превращения MVP в большую content moderation систему.

MVP report reason codes: `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, `other`.
