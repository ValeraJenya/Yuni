---
title: "moderation"
weight: 80
---


Файлы: `apps/backend/src/modules/moderation/`

## Что делает

Управляет блокировками и жалобами пользователей. Предоставляет helper-методы для других модулей (block check, block list) и реализует side effects блокировки: завершение active match со `status=blocked`.

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/blocks/:targetUserId` | Заблокировать пользователя |
| `DELETE` | `/blocks/:targetUserId` | Разблокировать пользователя |
| `GET` | `/blocks/me` | Список исходящих блокировок |
| `POST` | `/reports` | Пожаловаться на пользователя |

## Rate limits

| Endpoint | Лимит |
|---|---|
| `POST /reports` | 10 / час / user |

## Бизнес-правила

**Блокировки:**
- Self-block запрещён (`400`)
- Дублирующийся block → idempotent success (duplicate row не создаётся)
- Unblock — hard delete; строка не сохраняется
- Block завершает active match: `status=blocked`, `ended_at=now`
- Unblock не восстанавливает матч
- Block влияет в обе стороны: discovery, LIKE/SKIP, matches, chat, notifications

**Жалобы:**
- Self-report запрещён (`400`)
- `reason` должен быть из `ReportReasonCode`
- `details` опциональный, trimmed, max 1000 символов, пустой → `null`
- Public response status: только `"received"` (не внутренний `ReportStatus`)

**Report reasons:** `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, `other`

## Взаимодействие с другими модулями

- `MatchesModule` — block завершает active match
- `LikesModule` — block check перед LIKE/SKIP
- `DiscoveryModule` — block check в discovery filter
- `ProfilesModule` — block check при `GET /profiles/:handle`
- `ChatModule` — block check при list/read/send
- `NotificationsModule` — block check при создании и листинге

## Prisma-модели

- `blocks` — `blocker_user_id`, `blocked_user_id`, `created_at`; unique `(blocker, blocked)`; CHECK no self-block
- `reports` — `reporter_user_id`, `reported_user_id`, `reason_code`, `details`, `status`, nullable FK на `conversation_id`, `message_id`, `profile_photo_id`

Response не содержит `blockerUserId`, `reporterUserId`, `email`, `birthDate`, internal `ReportStatus`.

## Известные ограничения

- `GET /reports/me` (история жалоб) не реализован
- Admin/moderation panel не реализован
- Автоматическая обработка жалоб не реализована
- Отдельный frontend UI для управления блокировками отсутствует (только action из matches page)
