---
title: "База данных"
weight: 60
---


Исходник: `docs/database/README.md`. Yuni использует PostgreSQL. `apps/backend/prisma/schema.prisma` — единственный source of truth для схемы, типов и relations. SQL migrations: `apps/backend/prisma/migrations/`.

## Структура

```text
apps/backend/prisma/
  schema.prisma
  migrations/
    migration_lock.toml
    20260528150000_greenfield_baseline/
    20260607120000_likes_expiring_interactions/
    20260607140000_matches_expiring_rematchable/
    20260609180000_notifications_mvp/
```

`database/schema/schema.sql` — историческая заготовка, не является авторитетным источником.

## PostgreSQL-расширения

- `pgcrypto` — для `gen_random_uuid()`; включается в `greenfield_baseline`
- `btree_gist` — для exclusion constraints на `likes` и `matches`; включается в Step 12 и Step 13 migrations

## Migrations

Применяются командой `prisma migrate deploy`. Не запускаются автоматически при старте backend.

```bash
# Через Docker Compose:
docker compose run --rm backend npm run docker:migrate

# Напрямую:
npx prisma migrate deploy
```

### Таблица migrations

| Migration | Что делает |
|---|---|
| `20260528150000_greenfield_baseline` | Bootstrap всей схемы: таблицы, enums, FK, индексы, CHECK constraints |
| `20260607120000_likes_expiring_interactions` | `expires_at` в `likes`; btree_gist exclusion constraint |
| `20260607140000_matches_expiring_rematchable` | Canonical pair order CHECK; btree_gist exclusion constraint для matches |
| `20260609180000_notifications_mvp` | Таблица `notifications` с FK и indexes |

## Ограничения Prisma

Prisma не выражает напрямую:

- **Expression indexes** (`lower(email)`, `lower(handle)`) — только в SQL migrations
- **Partial indexes** (`refresh_tokens_active_idx`, `profile_photos_one_primary_per_user_idx`, `matches_active_expires_idx`) — только в SQL migrations
- **Exclusion constraints** (`likes_no_overlapping_active_interactions`, `matches_no_overlapping_active_pairs`) — только в SQL migrations

## Безопасное изменение схемы

1. Изменить `schema.prisma` в своей ветке
2. Запустить `npx prisma migrate dev --name <name>` для генерации SQL
3. Если нужен expression/partial index или exclusion constraint — дописать руками в SQL
4. Проверить migration SQL на деструктивные операции
5. Не добавлять NOT NULL колонку без DEFAULT при непустой таблице
6. Не редактировать `migration_lock.toml` вручную
7. Не изменять SQL уже применённых migrations (Prisma проверяет checksum)

## Разделы

- [Схема и миграции]({{< relref "/database/schema" >}})
