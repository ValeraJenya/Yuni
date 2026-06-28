---
title: "discovery"
weight: 40
---


Файлы: `apps/backend/src/modules/discovery/`

## Что делает

Формирует ленту анкет для свайпа — backend-owned выдача карточек с серверной фильтрацией, cursor pagination и anti-scraping ограничениями. Frontend не является источником истины для доступности карточек.

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/discovery/cards` | Лента карточек (cursor pagination, max limit 20) |

Query параметры: `limit` (optional, default 20, max 20), `cursor` (optional).

## Rate limits

| Endpoint | Лимит |
|---|---|
| `GET /discovery/cards` | 120 / 10 мин / user |

## Фильтры backend (все применяются)

- Исключает текущего пользователя
- Исключает inactive/deleted users
- Требует `profiles.is_discoverable=true`
- Требует `profiles.completed_at` (заполненный профиль)
- Требует явные open и discoverable `privacy_settings`
- Требует минимум одно `approved` + `published` фото с `publicUrl`
- Исключает active block в обе стороны
- Исключает active LIKE/SKIP cooldown текущего пользователя (`expiresAt > now`)
- Исключает active match (`status=active`, `expiresAt > now`)

Expired LIKE/SKIP и expired matches не блокируют rediscovery.

## Взаимодействие с другими модулями

- `ModerationModule` — block check в обе стороны
- `ProfilesModule` — данные профиля и privacy_settings
- `MediaModule` — только approved+published фото в cards
- `LikesModule` — active LIKE/SKIP cooldown фильтр
- `MatchesModule` — active match фильтр

## Prisma-модели

- `profiles` — фильтрация и данные карточек
- `profile_photos` — только `approved` + `published`
- `likes` — cooldown фильтр
- `matches` — active match фильтр
- `blocks` — block фильтр в обе стороны
- `privacy_settings` — open/discoverable проверка

Response не отдаёт raw `birthDate` — только вычисленный `age`.

## Известные ограничения

- Геолокация и radius filter не реализованы
- Ранжирование не реализовано; сортировка стабильная: `createdAt desc`, затем `userId desc`
- Premium-фильтры не реализованы
- Фильтры по возрасту/полу в UI не подключены к backend
