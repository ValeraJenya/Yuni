# Schema and Migrations

Технический справочник по таблицам, инвариантам, жизненному циклу данных и PII-правилам. Source of truth: `apps/backend/prisma/schema.prisma` и `apps/backend/prisma/migrations/`.

## Таблицы по доменам

### Auth

**`users`** — account identity. PK: `id` (UUID). Ключевые поля: `email` (unique, case-insensitive), `password_hash`, `status`, `deleted_at`. Soft-delete через `status=deleted` + `deleted_at`.

**`refresh_tokens`** — hashed refresh tokens. PK: `id`. FK `user_id → users.id` ON DELETE CASCADE. Revocation через `revoked_at`; partial index на активные токены (`revoked_at IS NULL`). `token_hash` unique.

### Profiles

**`profiles`** — один профиль на пользователя. PK: `user_id` (совпадает с `users.id`). FK → `users.id` ON DELETE CASCADE. `handle` unique (case-insensitive через expression index). `birth_date` хранится как DATE; backend вычисляет возраст на момент запроса. `completed_at` — признак завершённости профиля. `is_discoverable` управляет eligibility для discovery.

**`profile_photos`** — фото профиля. FK `user_id → profiles.user_id` ON DELETE CASCADE. `storage_key` unique; `(user_id, position)` unique. Partial unique index обеспечивает максимум одно `is_primary = true` на пользователя. `moderation_status`: `pending | approved | rejected`. CHECK constraint запрещает `published_at IS NOT NULL` при `moderation_status != 'approved'`.

**`interests`** — справочник интересов. `name` и `slug` unique.

**`profile_interests`** — M:N профиль ↔ интерес. PK: `(profile_user_id, interest_id)`.

### Likes

**`likes`** — направленные взаимодействия. `kind`: `like | pass | superlike`. `superlike` присутствует в схеме как enum-значение, но не реализован в API. `expires_at` задаёт cooldown window: LIKE — 3 дня, SKIP/PASS — 1 день. CHECK constraint `likes_expires_after_created`. Exclusion constraint `likes_no_overlapping_active_interactions` (btree_gist) запрещает пересекающиеся active interactions для одной пары liker/liked. Нет постоянного unique на пару — это разрешает rematch после истечения.

### Matches

**`matches`** — взаимный матч. `user_a_id < user_b_id` (canonical pair order, CHECK constraint). `status`: `active | expired | unmatched | blocked`. `expires_at` — 7 дней от создания (DB default). Match считается active только при `status=active AND expires_at > now()`. Нет cron-job для перевода в `expired`; сервисы фильтруют по `expires_at`. Exclusion constraint `matches_no_overlapping_active_pairs` (btree_gist, только где `status='active'`) запрещает overlapping active matches для одной canonical пары. Нет постоянного unique на пару — разрешает rematch после истечения.

### Chat

**`conversations`** — chat thread. FK `match_id → matches.id` ON DELETE SET NULL; `match_id` unique (один разговор на матч). `conversation_participants` — access-control boundary; PK: `(conversation_id, user_id)`.

**`messages`** — сообщения. FK `(conversation_id, sender_user_id) → conversation_participants(conversation_id, user_id)` ON DELETE CASCADE — DB-level гарантия, что отправитель является участником. `body` NOT BLANK (CHECK). Soft-delete через `status=deleted` + `deleted_at`.

### Moderation

**`blocks`** — directional block. `(blocker_user_id, blocked_user_id)` unique. CHECK `blocks_no_self_block`. Hard delete при unblock: строка не сохраняется.

**`reports`** — жалобы. `reason_code` enum. Nullable FK на `conversation_id`, `message_id`, `profile_photo_id` (ON DELETE SET NULL — отчёт остаётся при удалении контента). CHECK `reports_no_self_report`. `status`: `open | reviewing | resolved | dismissed`; публичный API возвращает только `"received"`.

### Notifications

**`notifications`** — in-app события. `type`: `match_created | message_received | system`. Nullable FK на `actor_user_id` (ON DELETE SET NULL — позволяет обрабатывать удалённых акторов). Хранит только lightweight references (`match_id`, `conversation_id`, `message_id`) и `message_key`. Тело сообщения, email, birth_date, storage_key в notifications не хранятся. CHECK `notifications_no_self_actor`. Lifecycle: `read_at` nullable; нет hard delete со стороны пользователя.

### Settings

**`privacy_settings`** и **`notification_settings`** — 1:1 к `users`. FK → `users.id` ON DELETE CASCADE.

---

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

---

## SQL-инварианты (не видны в schema.prisma)

Следующие правила живут только в SQL migrations и не отражены в `schema.prisma`:

**Self-interaction checks:**
- `likes_no_self_like` — `liker_user_id <> liked_user_id`
- `matches_no_self_match` — `user_a_id <> user_b_id`
- `blocks_no_self_block` — `blocker_user_id <> blocked_user_id`
- `reports_no_self_report` — `reporter_user_id <> reported_user_id`
- `notifications_no_self_actor` — `actor_user_id IS NULL OR actor_user_id <> recipient_user_id`

**Media integrity:**
- `profile_photos_published_requires_approval` — `published_at IS NULL OR moderation_status = 'approved'`
- `profile_photos_one_primary_per_user_idx` — partial unique index на `(user_id) WHERE is_primary = true`

**Profile format:**
- `profiles_handle_format` — `handle ~ '^[a-zA-Z0-9_][a-zA-Z0-9_.-]{2,29}$'`
- `profiles_birth_date_not_future` — `birth_date <= CURRENT_DATE`

**Case-insensitive uniqueness (expression indexes):**
- `users_email_lower_unique_idx` — `lower(email)`
- `profiles_handle_lower_unique_idx` — `lower(handle)`

**Exclusion constraints (btree_gist):**
- `likes_no_overlapping_active_interactions` — запрещает пересекающиеся `tstzrange(created_at, expires_at)` для одной пары `(liker_user_id, liked_user_id)`
- `matches_no_overlapping_active_pairs` — запрещает пересекающиеся `tstzrange(matched_at, expires_at)` для одной canonical пары, пока `status = 'active'`

**Match pair ordering:**
- `matches_user_pair_order` — `user_a_id < user_b_id`

---

## Жизненный цикл данных

### Soft-delete

| Таблица | Механизм |
|---|---|
| `users` | `status = 'deleted'` + `deleted_at` |
| `messages` | `status = 'deleted'` + `deleted_at` |

User-level CASCADE (ON DELETE CASCADE) удаляет все дочерние строки при физическом удалении пользователя. В MVP физического удаления нет; используется soft-delete.

### Hard delete

| Таблица | Когда |
|---|---|
| `blocks` | При unblock; строка не сохраняется |

### TTL и expiry

| Домен | TTL | Механизм |
|---|---|---|
| Like (LIKE) | 3 дня | `expires_at = created_at + 3 days`; сервис фильтрует по `expires_at > now()` |
| Like (SKIP/PASS) | 1 день | `expires_at = created_at + 1 day` |
| Match | 7 дней | `expires_at = now() + 7 days` (DB default); сервис фильтрует по `status=active AND expires_at > now()` |
| RefreshToken | задаётся при выдаче | `expires_at`; проверяется при использовании |

Нет cron-job для автоматического обновления `status`. Переход match в `expired` применяется через read-time фильтр.

### Статусные машины

**Match status:**
- `active` — создан, не истёк
- `blocked` — active match завершается при block в любую сторону (`ended_at = now`)
- `expired` — истёк по `expires_at` (фактически только read-time фильтр в MVP)
- `unmatched` — зарезервировано для будущего unmatch flow

**Photo moderation:**
- `pending` → `approved` или `rejected`
- `published_at` может быть установлен только если `moderation_status = 'approved'`

### CASCADE behavior

| Родительская таблица | Дочерняя таблица | При удалении родителя |
|---|---|---|
| `users` | `refresh_tokens`, `profiles`, `likes`, `matches`, `conversation_participants`, `messages`, `blocks`, `reports`, `privacy_settings`, `notification_settings`, `notifications` | CASCADE |
| `profiles` | `profile_photos`, `profile_interests` | CASCADE |
| `matches` | `conversations` | SET NULL (`match_id`) |
| `conversations` | `conversation_participants`, `messages` | CASCADE |
| `conversations` | `reports`, `notifications` | SET NULL |
| `messages` | `reports`, `notifications` | SET NULL |
| `profile_photos` | `reports` | SET NULL |

---

## PII-поля

Следующие поля содержат чувствительные данные и не должны появляться в API response serializers, логах или notification rows:

| Таблица | Поле | Почему |
|---|---|---|
| `users` | `email` | персональные данные |
| `users` | `password_hash` | credential |
| `refresh_tokens` | `token_hash` | credential |
| `refresh_tokens` | `ip_address` | device fingerprint |
| `refresh_tokens` | `user_agent` | device fingerprint |
| `profile_photos` | `storage_key` | internal storage path |
| `privacy_settings` | `anonymous_avatar_key` | internal storage key |
| `profiles` | `latitude`, `longitude` | точная геолокация; в MVP поля в схеме есть, но не читаются и не отдаются |

Serializers в `apps/backend/src/common/serializers/` формируют public/self response shapes, исключая эти поля. `storage_key` никогда не отдаётся клиенту; вместо него используется `public_url`.
