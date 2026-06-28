---
title: "notifications"
weight: 90
---


Файлы: `apps/backend/src/modules/notifications/`

## Что делает

Управляет in-app уведомлениями: создание events от backend domain actions (match, message), листинг с cursor pagination, счётчик непрочитанных, пометка как прочитанных. Push/email/realtime вне scope MVP.

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/notifications` | Список уведомлений (cursor pagination) |
| `GET` | `/notifications/unread-count` | Количество непрочитанных |
| `POST` | `/notifications/:notificationId/read` | Пометить одно как прочитанное |
| `POST` | `/notifications/read-all` | Пометить все как прочитанные |

## Rate limits

| Endpoint | Лимит |
|---|---|
| `GET /notifications` | 120 / 10 мин / user |
| `GET /notifications/unread-count` | 240 / 10 мин / user |
| `POST /notifications/:notificationId/read` | 120 / 10 мин / user |
| `POST /notifications/read-all` | 120 / 10 мин / user |

## Типы уведомлений

- `match_created` — при создании нового match (для обоих участников, actor = другой участник)
- `message_received` — при получении сообщения (только для recipient, не sender)
- `system` — системные (actor может быть null)

## Бизнес-правила

- Notification events создаются от backend domain actions, не от frontend запросов
- `match_created` — только после создания нового `Match` row
- `message_received` — только для другого active participant после successful send
- Sender не получает своё `message_received` уведомление
- Active block в обе стороны → notification не создаётся и скрывается из листинга
- `NotificationSettings.matchesEnabled` / `messagesEnabled` проверяются при создании
- Match/message notifications требуют safe actor; actorless match/message notifications скрываются
- Notification rows хранят только lightweight references и `message_key` — не message body, email, birth_date, storage_key

## Взаимодействие с другими модулями

- `MatchesModule` — вызывает `createMatchNotifications` после создания match
- `ChatModule` — вызывает `createMessageNotification` после successful send
- `ModerationModule` — block check при создании и листинге

## Prisma-модели

- `notifications` — `id`, `type`, `recipient_user_id`, `actor_user_id` (nullable), `message_key`, `read_at`, `match_id`, `conversation_id`, `message_id`
- `notification_settings` — `matches_enabled`, `messages_enabled`

Response не содержит raw message body, `email`, `birthDate`, `storageKey`, private profile fields.

## Известные ограничения

- WebSocket/realtime delivery не реализован
- Push notifications (mobile/browser) не реализованы
- Email notifications не реализованы
- Notification preferences UI не реализован
