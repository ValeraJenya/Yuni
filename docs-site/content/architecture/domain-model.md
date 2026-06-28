---
title: "Domain Model"
weight: 30
---


Исходник: `docs/architecture/domain-model.md`. Yuni разделён на доменные блоки, соответствующие PostgreSQL-таблицам и NestJS-модулям.

## Auth

`users` хранит account identity, `password_hash`, status, verification и lifecycle timestamps. `refresh_tokens` хранит hashed refresh tokens, expiry, revocation state, last use и device metadata. Raw passwords и raw tokens нельзя сохранять или логировать.

## Users

`users` — стабильная owner identity для auth, profiles, likes, matches, conversations, notifications, blocks, reports, privacy settings и notification settings. Большинство owner checks начинаются с authenticated `user.id`.

## Profiles

`profiles` хранит один dating profile; использует `user_id` как primary key. Public handle — в `profiles.handle`. `birth_date` хранится вместо age (backend вычисляет возраст при запросе). Discoverability комбинируется с privacy settings, approved primary photo checks и block checks.

Discovery eligibility требует: account/profile active, discoverability включена, privacy settings разрешают discovery, minimum profile completion выполнен, block filters прошли, есть минимум одно approved published public photo.

## Discovery

`GET /discovery/cards` — read boundary поверх существующих таблиц, не новая модель БД. Использует `Profile.userId` как card identity и cursor.

Карточки eligible только когда: target user active, profile completed и discoverable, privacy settings open, нет active block в обе стороны, нет active LIKE/SKIP cooldown, нет active match. Expired LIKE/SKIP и expired matches не блокируют rediscovery.

## Media And Photos

`profile_photos` хранит object storage keys, optional public URLs, dimensions, ordering, primary-photo state, moderation status и publishing timestamps. PostgreSQL не хранит image binaries.

## Likes

`likes` хранит directional decisions. `LIKE` → `LikeKind.like`; `SKIP/PASS` → `LikeKind.pass`; superlike не реализован.

- LIKE cooldown: 3 дня
- SKIP/PASS cooldown: 1 день
- DB-level exclusion constraint против overlapping active interactions для одной пары

## Matches

`matches` — mutual relationship. Создаётся только при mutual active LIKE (оба `LikeKind.like`, оба `expiresAt > now()`). Пара нормализуется: `user_a_id < user_b_id`. Match active: `status=active` AND `expires_at > now()`. TTL: 7 дней. При block active match завершается через `status=blocked`; unblock не восстанавливает старый match.

## Chat

`conversations` — chat thread. `conversation_participants` — access-control boundary. `messages` требует, чтобы sender был участником через composite FK.

Conversation создаётся только через `POST /matches/:matchId/conversation`. Plain text only. Blocks apply в обе стороны.

## Notifications

`notifications` — in-app события. Типы: `match_created`, `message_received`, `system`. Хранит только lightweight references и `message_key` — не message body, email, birth_date, storage_key. Active blocks скрывают notifications.

## Moderation

`blocks` — directional block. Hard delete при unblock. Blocks влияют в обе стороны на visibility, discovery, LIKE/SKIP, match creation.

`reports` — user-focused. Public API возвращает только `"received"` status.

MVP report reason codes: `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, `other`.
