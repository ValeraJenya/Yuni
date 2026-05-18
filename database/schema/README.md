# Database Schema

This is a PostgreSQL-first schema draft for the Yuni MVP foundation. It is intentionally SQL-first so the future NestJS backend can map it into an ORM later without hiding the domain model.

## Entities

- `users` stores account identity, email, password hash, lifecycle status, and login timestamps. Passwords are never stored in plain text.
- `refresh_tokens` stores hashed refresh tokens per user/device session. Tokens expire, can be revoked, and keep lightweight device/session metadata.
- `profiles` stores the single underlying dating profile for a user, including the public `handle`. Age is derived from `birth_date` in backend logic, not stored as a number.
- `profile_photos` stores storage keys, URLs, metadata, ordering, primary-photo state, moderation state, and publishing timestamps. Image binaries do not live in PostgreSQL.
- `interests` and `profile_interests` model reusable interests and the many-to-many profile relationship.
- `likes` stores one directional decision from one user to another: `like`, `superlike`, or `pass`. The unique pair prevents duplicated decisions.
- `matches` stores a mutual relationship between two users with `matched_at`, a default 7-day `expires_at`, and practical lifecycle statuses.
- `conversations` represents chat threads, normally connected to one match.
- `conversation_participants` explicitly maps users to conversations and is the base for chat owner checks.
- `messages` stores text messages. A composite foreign key requires the sender to be a participant in the conversation.
- `blocks` stores user-to-user blocks as a separate safety entity.
- `reports` stores user-focused moderation reports with a reason code, optional comment, review status, and optional references to message/photo context.
- `privacy_settings` stores explicit per-user privacy and visibility controls, including whether the same profile is presented in open or private mode and which system anonymous avatar should be used.
- `notification_settings` stores explicit per-user notification preferences.

## Relationships

Each `user` can have one `profile`, one `privacy_settings` row, one `notification_settings` row, many `refresh_tokens`, many photos through the profile, many likes, many matches, and many conversation memberships. `profiles.handle` is the public unique handle; raw account identity stays in `users`.

`profiles.handle` is a technical public identifier for URLs, search, indexing, and moderation. For MVP it is limited to Latin letters, digits, underscore, dot, and a practical 3-30 character length. Normal profile content such as display name, bio, interests, work, education, and other future free-text fields should support regular user language input, including Cyrillic.

`likes` are directional. `matches` are mutual and use an unordered uniqueness rule so `A-B` and `B-A` cannot both exist. Active matches expire after 7 days by default through `expires_at`. For MVP, expiration is handled at request time: backend queries and services should treat active matches with `expires_at <= now()` as expired and may update status to `expired` opportunistically.

`blocks` and `reports` are separate from profiles and matches so safety flows can be enforced across discovery, matching, and chat without overloading unrelated tables.

## Covered Scenarios

- Account creation and authentication session storage.
- Public profile creation with handle, photos, and interests.
- Discoverability and privacy preferences.
- Like/superlike/pass decisions and mutual match creation.
- Match-based conversations and participant-checked message access.
- Blocking and reporting for moderation and safety workflows.
- Open/private profile presentation from one underlying profile record.

## Fixed MVP Rules

- Discovery eligibility requires an active user/profile state, profile discoverability enabled, privacy discoverability enabled, minimum required profile completion, block filters, and at least one approved and published primary photo.
- Private mode never exposes user-uploaded photos. Backend presentation should use `privacy_settings.anonymous_avatar_key` for a system-provided rabbit avatar image.
- Report reason codes are: `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, `other`.

## Security And Privacy Notes

- Store only `password_hash`, never raw passwords.
- Store only `token_hash`, never raw refresh tokens.
- Treat `birth_date`, location fields, messages, reports, and block data as sensitive.
- Do not expose profiles blocked by or blocking the current user.
- Enforce owner checks through `user_id` fields and conversation membership joins.
- Message reads must join through `conversation_participants` for the current user.
- Photo records store object storage keys and metadata, not binary files. Only approved and published photos should be exposed in profile responses.
- Discovery visibility should require backend checks for `users.status`, `profiles.is_discoverable`, `privacy_settings.discoverable`, `profiles.completed_at`, block state, and an approved published primary photo.
- Private profile mode should be enforced in backend serializers by exposing a smaller subset of the same `profiles` data, using `privacy_settings` as the policy source. User photos are not shown in private mode.
