# 0001 PostgreSQL Domain Foundation

Status: accepted

Yuni will use PostgreSQL as the database foundation for the MVP.

The schema is organized around separate domain blocks: auth, users, profiles, media/photos, likes, matches, chat, moderation, privacy, and notifications. This keeps owner checks and future NestJS module boundaries easier to reason about.

Sensitive data and private flows are modeled explicitly instead of being folded into one large user table. Passwords and refresh tokens are stored only as hashes. Profile privacy, blocks, reports, and chat membership are separate records so backend authorization can be implemented with clear joins and constraints.

Public identity belongs to the profile layer through `profiles.handle`, not the account layer. Handles are URL-friendly technical identifiers with Latin letters, digits, underscore, dot, and practical length limits. User-facing profile content remains normal text and can support Cyrillic.

Yuni keeps one underlying profile per user and uses explicit privacy settings to choose an open or private presentation of that profile in backend serialization. Private mode does not expose user-uploaded photos; it uses a system-provided anonymous rabbit avatar selected by `privacy_settings.anonymous_avatar_key`.

Dating-specific flows are represented directly but kept MVP-sized: directional likes support `like`, `superlike`, and `pass`; matches have `matched_at`, a default 7-day `expires_at`, and clear lifecycle statuses; photos support upload, moderation, primary selection, and publishing without storing binaries in PostgreSQL. Match expiration is request-time logic for MVP, so no scheduled cleanup infrastructure is required before backend foundation.

Discovery eligibility is a backend rule supported by the schema: active account/profile state, discoverability enabled, privacy discovery enabled, minimum profile completion, block filters, and at least one approved published primary photo.

MVP report reason codes are fixed as `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, and `other`.

The initial schema is SQL-first and not tied to a specific ORM. When the backend foundation is added, this draft can be translated into ORM entities and migrations.
