---
title: "Схема и миграции"
weight: 10
---


Исходник: `docs/database/schema-and-migrations.md`. Source of truth: `apps/backend/prisma/schema.prisma` и `apps/backend/prisma/migrations/`.

## Таблицы по доменам

### Auth

**`users`** — account identity. PK: `id` (UUID). Ключевые поля: `email` (unique, case-insensitive), `password_hash`, `status`, `deleted_at`. Soft-delete: `status=deleted` + `deleted_at`.

**`refresh_tokens`** — hashed refresh tokens. FK `user_id → users.id` ON DELETE CASCADE. Revocation: `revoked_at`; partial index на активные (`revoked_at IS NULL`). `token_hash` unique.

### Profiles

**`profiles`** — один профиль на пользователя. PK: `user_id` (= `users.id`). FK → `users.id` ON DELETE CASCADE. `handle` unique (case-insensitive). `birth_date` как DATE; backend вычисляет возраст. `completed_at` — признак завершённости. `is_discoverable` — eligibility для discovery.

**`profile_photos`** — фото профиля. FK `user_id → profiles.user_id` ON DELETE CASCADE. `storage_key` unique; `(user_id, position)` unique. Partial unique index: максимум одно `is_primary=true` на пользователя. `moderation_status`: `pending | approved | rejected`. CHECK: `published_at IS NOT NULL` требует `moderation_status=approved`.

**`interests`** — справочник интересов.

**`profile_interests`** — M:N профиль ↔ интерес.

### Likes

**`likes`** — directional взаимодействия. `kind`: `like | pass | superlike`. `expires_at`: LIKE — 3 дня, SKIP/PASS — 1 день. Exclusion constraint `likes_no_overlapping_active_interactions` (btree_gist). Нет постоянного unique на пару — разрешает rematch.

### Matches

**`matches`** — взаимный матч. `user_a_id < user_b_id` (canonical pair, CHECK). `status`: `active | expired | unmatched | blocked`. TTL: 7 дней. Exclusion constraint `matches_no_overlapping_active_pairs` (btree_gist, только `status=active`).

### Chat

**`conversations`** — chat thread. FK `match_id → matches.id` ON DELETE SET NULL; `match_id` unique.

**`conversation_participants`** — access-control boundary. PK: `(conversation_id, user_id)`.

**`messages`** — сообщения. FK `(conversation_id, sender_user_id) → conversation_participants`. `body` NOT BLANK. Soft-delete: `status=deleted` + `deleted_at`.

### Moderation

**`blocks`** — directional block. `(blocker_user_id, blocked_user_id)` unique. CHECK no self-block. Hard delete при unblock.

**`reports`** — жалобы. `reason_code` enum. Nullable FK на `conversation_id`, `message_id`, `profile_photo_id` (ON DELETE SET NULL). CHECK no self-report. `status`: `open | reviewing | resolved | dismissed`; public API возвращает только `"received"`.

### Notifications

**`notifications`** — in-app события. `type`: `match_created | message_received | system`. Nullable FK `actor_user_id` (ON DELETE SET NULL). Только lightweight references + `message_key`. CHECK no self-actor.

### Settings

**`privacy_settings`** и **`notification_settings`** — 1:1 к `users`. FK → `users.id` ON DELETE CASCADE.

## Enums

| Enum | Значения |
|---|---|
| `UserStatus` | `active`, `disabled`, `deleted` |
| `PhotoModerationStatus` | `pending`, `approved`, `rejected` |
| `LikeKind` | `like`, `superlike`, `pass` |
| `MatchStatus` | `active`, `expired`, `unmatched`, `blocked` |
| `ConversationStatus` | `active`, `archived`, `closed` |
| `MessageStatus` | `sent`, `deleted` |
| `ReportStatus` | `open`, `reviewing`, `resolved`, `dismissed` |
| `ReportReasonCode` | `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, `other` |
| `ProfileVisibilityMode` | `open`, `private` |
| `NotificationType` | `match_created`, `message_received`, `system` |

## SQL-инварианты (не видны в schema.prisma)

**Self-interaction checks:**
- `likes_no_self_like`
- `matches_no_self_match`
- `blocks_no_self_block`
- `reports_no_self_report`
- `notifications_no_self_actor`

**Media integrity:**
- `profile_photos_published_requires_approval`
- `profile_photos_one_primary_per_user_idx` (partial unique)

**Profile format:**
- `profiles_handle_format` — `^[a-zA-Z0-9_][a-zA-Z0-9_.-]{2,29}$`
- `profiles_birth_date_not_future`

**Case-insensitive uniqueness:**
- `users_email_lower_unique_idx`
- `profiles_handle_lower_unique_idx`

**Exclusion constraints (btree_gist):**
- `likes_no_overlapping_active_interactions`
- `matches_no_overlapping_active_pairs`

## Жизненный цикл данных

### Soft-delete

| Таблица | Механизм |
|---|---|
| `users` | `status=deleted` + `deleted_at` |
| `messages` | `status=deleted` + `deleted_at` |

### Hard delete

| Таблица | Когда |
|---|---|
| `blocks` | При unblock |

### TTL и expiry

| Домен | TTL | Механизм |
|---|---|---|
| Like (LIKE) | 3 дня | `expires_at`; сервис фильтрует по `expires_at > now()` |
| Like (SKIP/PASS) | 1 день | `expires_at` |
| Match | 7 дней | `expires_at = now() + 7 days` (DB default) |
| RefreshToken | задаётся при выдаче | `expires_at` |

Нет cron-job для автоматического обновления `status`. Переход match в `expired` — только read-time фильтр.

## PII-поля

| Таблица | Поле | Почему |
|---|---|---|
| `users` | `email` | персональные данные |
| `users` | `password_hash` | credential |
| `refresh_tokens` | `token_hash` | credential |
| `refresh_tokens` | `ip_address` | device fingerprint |
| `refresh_tokens` | `user_agent` | device fingerprint |
| `profile_photos` | `storage_key` | internal storage path |
| `privacy_settings` | `anonymous_avatar_key` | internal storage key |
| `profiles` | `latitude`, `longitude` | геолокация (в схеме есть, в MVP не читаются) |
