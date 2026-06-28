---
title: "likes"
weight: 50
---


Файлы: `apps/backend/src/modules/likes/`

## Что делает

Управляет directional взаимодействиями между пользователями (LIKE и SKIP/PASS) с временными cooldown-окнами. При взаимном LIKE делегирует создание match в `MatchesModule`.

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/likes/:targetProfileUserId` | Лайк профиля |
| `POST` | `/likes/:targetProfileUserId/skip` | Пропуск профиля |

`targetProfileUserId` — это `profiles.user_id` (у профиля нет отдельного id).

## Rate limits

| Endpoint | Лимит |
|---|---|
| `POST /likes/:targetProfileUserId` | 60 / час / user (общий с SKIP) |
| `POST /likes/:targetProfileUserId/skip` | 60 / час / user (общий с LIKE) |

## Бизнес-правила

- LIKE cooldown: 3 дня
- SKIP/PASS cooldown: 1 день
- Self-like и self-skip запрещены (`400`)
- Active block в обе стороны → `403`
- Дублирующееся active взаимодействие → `409`
- Target profile должен быть discoverable/open
- При взаимном active LIKE → match создаётся через `MatchesService`
- DB exclusion constraint защищает от overlapping active interactions для одной пары

## Взаимодействие с другими модулями

- `ModerationModule` — block check перед LIKE/SKIP
- `MatchesModule` — делегирует создание match после successful LIKE
- `ProfilesModule` — проверка доступности target profile

## Prisma-модели

- `likes` — `liker_user_id`, `liked_user_id`, `kind` (`like|pass|superlike`), `expires_at`, `created_at`
- Exclusion constraint `likes_no_overlapping_active_interactions` (btree_gist)

Response не содержит `id`, `likerUserId`, raw `kind` — только `targetProfileUserId`, `action`, `expiresAt`.

## Известные ограничения

- Superlike не реализован (enum значение есть в схеме, но не в API)
- `GET /likes/me` (история лайков) не реализован
