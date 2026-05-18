# Domain Model

Yuni is organized around separate domain blocks that map cleanly to PostgreSQL tables and later NestJS modules.

## Auth

`users` owns account identity and stores `password_hash`, status, verification, and lifecycle timestamps. `refresh_tokens` stores hashed refresh tokens for device sessions, expiry, revocation state, last use, and lightweight device metadata. Raw passwords and raw tokens must never be persisted or logged.

## Users

`users` is the stable owner identity used by auth, profiles, likes, matches, conversations, blocks, reports, privacy settings, and notification settings. Most owner checks should start from the authenticated `user.id`.

## Profiles

`profiles` contains the single underlying dating profile and uses `user_id` as its primary key. The public handle belongs here as `profiles.handle`, not on `users`, because public identity is part of profile presentation rather than raw account identity. For MVP, handles are technical URL-friendly identifiers: Latin letters, digits, underscore, dot, and 3-30 characters. User-facing profile text can still support normal language input, including Cyrillic.

`birth_date` is stored instead of age so the backend can compute age at request time. Profile discoverability is explicit and should be combined with privacy settings, approved primary photo checks, and block checks.

Open/private presentation is modeled through `privacy_settings`, not through a second profile table. In open mode the backend can expose fuller profile details. In private mode the backend should serialize a smaller subset, such as computed age and selected interests. User-uploaded photos are not shown in private mode; presentation should use `privacy_settings.anonymous_avatar_key` to select a system-provided rabbit avatar.

Discovery eligibility is a backend rule supported by the schema. A profile should be eligible only when the account/profile is active, discoverability is enabled, privacy settings allow discovery, minimum profile completion exists, block filters pass, and the profile has at least one approved and published primary photo.

## Media And Photos

`profile_photos` stores object storage keys, optional public URLs, dimensions, ordering, primary-photo state, moderation status, and publishing timestamps. PostgreSQL should not store image binaries. A photo can be uploaded and moderated before it is published; profile responses should expose only approved and published photos.

## Likes

`likes` stores directional decisions: one user can `like`, `superlike`, or `pass` another user. A unique `(liker_user_id, liked_user_id)` pair prevents duplicated decisions and makes mutual-like checks predictable.

## Matches

`matches` represents a mutual relationship between two users. The schema uses unordered uniqueness across the two user ids, so a pair can only have one match row. Match status supports active, expired, unmatched, and blocked lifecycle states. New matches default to a 7-day lifetime through `expires_at`. For MVP, expiration is request-time logic: services should treat active matches with `expires_at <= now()` as expired and can update status opportunistically.

## Chat

`conversations` is the chat thread. `conversation_participants` is the access-control boundary for chat reads and writes. `messages` requires the sender to be a participant through a composite foreign key, making conversation owner checks straightforward in backend queries.

## Moderation

`blocks` and `reports` are first-class entities. Blocks are directional and duplicate blocker/blocked pairs are forbidden. Blocks should affect discovery, likes, matches, and chat visibility.

Reports are user-focused for MVP: reporter, reported user, reason code, optional comment, and review status. Optional message, conversation, and photo references leave room for richer moderation context without turning reporting into a large content system too early.

The fixed MVP report reason codes are `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, and `other`.
