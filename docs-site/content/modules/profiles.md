---
title: "profiles"
weight: 20
---


Файлы: `apps/backend/src/modules/profiles/`

## Что делает

Управляет данными анкеты dating-профиля пользователя: просмотр своего профиля, редактирование, просмотр публичного профиля по handle. Разделяет self-serializer (расширенные данные) и public-serializer (ограниченный набор полей).

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/profiles/me` | Self-профиль текущего пользователя |
| `PATCH` | `/profiles/me` | Обновление своего профиля |
| `GET` | `/profiles/:handle` | Публичный профиль по handle (case-insensitive) |

Поля, которые можно обновить через `PATCH /profiles/me`: `displayName`, `bio`, `gender`, `lookingFor`, `city`, `country`, `isDiscoverable`.

`GET/PATCH /profiles/me` возвращает вычисляемый объект `completion` с полями `isComplete`, `missingFields` и `percentage`. Completion вычисляется из текущих полей и подходящих фото, а не читается из хранимой колонки.

## Rate limits

| Endpoint | Лимит |
|---|---|
| `GET /profiles/:handle` | 120 / 10 мин / user |

## Взаимодействие с другими модулями

- `ModerationModule` — block check при `GET /profiles/:handle` (заблокированные пары получают not-found style ответ)
- `MediaModule` — photos включаются в profile response
- `DiscoveryModule` — использует `profiles` таблицу для discovery cards

## Prisma-модели

- `profiles` — `user_id` (PK), `handle`, `display_name`, `bio`, `gender`, `looking_for`, `city`, `country`, `is_discoverable`, `birth_date`
- `profile_photos` — включаются в profile response через serializer
- `privacy_settings` — управляет видимостью профиля

## Известные ограничения

- `gender` и `lookingFor` временно остаются непустыми free-text строками; canonical enum contract требует отдельной задачи
- Поля interests, height, occupation, education присутствуют в frontend-типах, но не реализованы в backend MVP
- Изменить `handle`, `birthDate`, `email`, `role` через profile endpoint нельзя
