---
title: "chat"
weight: 70
---


Файлы: `apps/backend/src/modules/chat/`

## Что делает

Управляет one-to-one текстовыми разговорами между участниками матча. Conversation создаётся только из active match, участники ограничены через `conversation_participants`, блокировки применяются в обе стороны.

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/chat/conversations` | Список разговоров текущего пользователя |
| `GET` | `/chat/conversations/:conversationId/messages` | Сообщения разговора |
| `POST` | `/chat/conversations/:conversationId/messages` | Отправить сообщение |
| `POST` | `/matches/:matchId/conversation` | Начать разговор из матча |

## Rate limits

| Endpoint | Лимит |
|---|---|
| `POST /chat/conversations/:conversationId/messages` | 30 / мин / user + 120 / 10 мин / user |

## Бизнес-правила

- Conversation создаётся только через `POST /matches/:matchId/conversation`
- Только участники match могут создать conversation
- Active match (`status=active`, `expiresAt > now`) может создать новую conversation
- Repeated start для уже созданной conversation → возвращает существующую (idempotent)
- Expired match с уже созданной conversation остаётся доступен
- Expired match без conversation → новый чат не создаётся
- Send разрешён только active participant в active conversation
- Active block в обе стороны: list скрывает conversation, read → not-found style, send → `403`
- Текст trim-ится, пустой/whitespace → `400`, max 2000 символов
- Plain text only; тело сообщения не логируется
- `messages.body` (DB field) маппируется как `text` в response

## Взаимодействие с другими модулями

- `MatchesModule` — conversation создаётся из active match
- `ModerationModule` — block check при list/read/send
- `NotificationsModule` — `message_received` notification после successful send

## Prisma-модели

- `conversations` — `id`, `match_id` (unique), `status`, `updated_at`
- `conversation_participants` — PK `(conversation_id, user_id)`, `left_at`
- `messages` — `id`, `conversation_id`, `sender_user_id`, `body`, `status`, composite FK на `conversation_participants`

Response не содержит `body` (DB field), `lastReadMessageId`, `deletedAt`, `editedAt`, `email`, `birthDate`, `storageKey`.

## Известные ограничения

- WebSocket/realtime не реализован
- Read receipts не реализованы
- Typing indicators не реализованы
- Вложения/медиа-сообщения не реализованы
- Поиск по чату не реализован
