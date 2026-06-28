---
title: "matches"
weight: 60
---


Файлы: `apps/backend/src/modules/matches/`

## Что делает

Управляет взаимными матчами, возникающими при двустороннем LIKE. Хранит пары в каноническом порядке (`user_a_id < user_b_id`), применяет 7-дневный TTL и обеспечивает связь с chat через conversationId.

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/matches/me` | Список активных матчей текущего пользователя |
| `POST` | `/matches/:matchId/conversation` | Начать conversation из match (реализован в ChatModule) |

## Бизнес-правила

- Match создаётся только при mutual active LIKE (оба `LikeKind.like`, оба `expiresAt > now`)
- Пара нормализуется: `user_a_id < user_b_id`
- Match active: `status=active` AND `expires_at > now()`
- TTL: 7 дней от создания
- Active block в обе стороны блокирует создание match
- Block завершает active match (`status=blocked`, `ended_at=now`)
- Unblock не восстанавливает старый match
- Expired match не блокирует future rematch
- DB exclusion constraint защищает от overlapping active matches для одной пары

## Взаимодействие с другими модулями

- `LikesModule` — делегирует создание match после successful LIKE
- `ModerationModule` — block check при создании и листинге matches
- `NotificationsModule` — `createMatchNotifications` вызывается после создания match
- `ChatModule` — `conversationId` в response; start conversation через `POST /matches/:matchId/conversation`

## Prisma-модели

- `matches` — `id`, `user_a_id`, `user_b_id`, `status`, `expires_at`, `matched_at`, `ended_at`
- Exclusion constraint `matches_no_overlapping_active_pairs` (btree_gist, только `status=active`)
- CHECK constraint `matches_user_pair_order`: `user_a_id < user_b_id`

Response содержит `matchedProfile` (handle, displayName, primaryPhotoUrl), `matchedAt`, `expiresAt`, `status`, `conversationId`, `conversationStarted`. Не содержит `userAId`/`userBId`, `email`, `birthDate`, `storageKey`.

## Известные ограничения

- Cron/job для автоматического перевода `status` в `expired` не реализован — expiry через read-time фильтр
- Unmatch (разрыв матча без блока) не реализован
