# Database

Yuni использует PostgreSQL. `apps/backend/prisma/schema.prisma` — единственный source of truth для схемы, типов и relations. SQL migrations находятся в `apps/backend/prisma/migrations/`.

## Структура

```text
apps/backend/prisma/
  schema.prisma          — source of truth: таблицы, колонки, FK, Prisma-видимые индексы, enums
  migrations/
    migration_lock.toml  — фиксирует provider = "postgresql"
    20260528150000_greenfield_baseline/
    20260607120000_likes_expiring_interactions/
    20260607140000_matches_expiring_rematchable/
    20260609180000_notifications_mvp/
```

`database/schema/schema.sql` — историческая SQL-заготовка, предшествующая внедрению Prisma. Он больше не обновляется и не является авторитетным источником.

## PostgreSQL-расширения

Два расширения необходимы перед первой migration:

- `pgcrypto` — для `gen_random_uuid()`; включается в `greenfield_baseline`.
- `btree_gist` — для exclusion constraints на `likes` и `matches`; включается в Step 12 и Step 13 migrations.

Оба добавляются через `CREATE EXTENSION IF NOT EXISTS` в SQL migrations.

## Migrations

Migrations применяются командой `prisma migrate deploy`. Они не запускаются автоматически при старте backend.

Для локального Docker Compose:

```
docker compose run --rm backend npm run docker:migrate
```

Или напрямую с настроенным `DATABASE_URL`:

```
npx prisma migrate deploy
```

Текущие migrations по порядку:

| Migration | Что делает |
|---|---|
| `20260528150000_greenfield_baseline` | Bootstrap всей схемы: таблицы, enums, FK, индексы, SQL CHECK constraints |
| `20260607120000_likes_expiring_interactions` | Добавляет `expires_at` в `likes`; btree_gist exclusion constraint против overlapping active interactions для одной пары |
| `20260607140000_matches_expiring_rematchable` | Добавляет canonical pair order CHECK в `matches`; btree_gist exclusion constraint против overlapping active matches |
| `20260609180000_notifications_mvp` | Создаёт таблицу `notifications` с FK и indexes |

## Ограничения Prisma

Prisma не выражает напрямую несколько классов PostgreSQL-объектов. Они живут только в SQL migrations:

**Expression indexes (case-insensitive uniqueness):**
- `lower(email)` — `users_email_lower_unique_idx`
- `lower(handle)` — `profiles_handle_lower_unique_idx`

**Partial indexes:**
- `refresh_tokens_active_idx` — только где `revoked_at IS NULL`
- `profile_photos_one_primary_per_user_idx` — только где `is_primary = true`
- `profile_photos_approved_primary_idx` — только где `is_primary = true AND moderation_status = 'approved' AND published_at IS NOT NULL`
- `matches_active_expires_idx` — только где `status = 'active'`

**Exclusion constraints (btree_gist):**
- `likes_no_overlapping_active_interactions` — запрещает пересекающиеся active likes для одной пары liker/liked
- `matches_no_overlapping_active_pairs` — запрещает пересекающиеся active matches для одной canonical пары, пока `status = 'active'`

Если новая схемная правила требует expression index, partial index или exclusion constraint — его нужно дописать вручную в сгенерированный migration SQL.

## Безопасное изменение схемы

1. Изменяй `schema.prisma` в своей ветке.
2. Запускай `npx prisma migrate dev --name <migration_name>` для генерации SQL.
3. Если нужен expression/partial index или exclusion constraint — дописывай руками в сгенерированный SQL файл.
4. Проверяй migration SQL на деструктивные операции: `DROP COLUMN`, `DROP TABLE`, изменение enum.
5. Не добавляй NOT NULL колонку без DEFAULT если таблица не пустая.
6. Не удаляй enum-значение если оно уже используется в существующих строках.
7. Не редактируй `migration_lock.toml` вручную.
8. Не изменяй SQL уже применённых migrations — Prisma проверяет checksum.
