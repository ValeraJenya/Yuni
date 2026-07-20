---
title: "chat"
weight: 70
---

Файлы: `apps/backend/src/modules/chat/`

## Что делает

Управляет one-to-one conversations участников match и backend-owned staged-chat: stages 1–3, message weights, игровые вопросы, стартовые фразы и системные сообщения переходов.

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/matches/:matchId/conversation` | Создать или вернуть conversation для match |
| `GET` | `/chat/conversations` | Список доступных conversations |
| `GET` | `/chat/conversations/:conversationId/messages` | История сообщений |
| `POST` | `/chat/conversations/:conversationId/messages` | Отправить text/voice-metadata/attachment-type message |
| `GET` | `/chat/conversations/:conversationId/stage` | Stage, timestamps и voice limits текущего участника |
| `GET` | `/chat/starters` | До четырёх активных стартовых фраз |
| `GET` | `/chat/conversations/:conversationId/game/current` | Текущая доступная игра или `null` |
| `POST` | `/chat/conversations/:conversationId/game/postpone` | Отложить игру один раз на минуту |
| `POST` | `/chat/conversations/:conversationId/game/:gameId/answer` | Сохранить ответ участника |

Send rate limits: 30 сообщений/минуту и 120/10 минут на user.

## Conversation access и lifecycle

- Conversation создаётся только из active, unexpired match; повторный start идемпотентно возвращает существующий conversation.
- Expired match не создаёт новый conversation, но ранее созданный остаётся доступным.
- List/read/send требуют active participant; send также требует active conversation и active users.
- Active `Block` в любую сторону скрывает conversation, read возвращает not-found style, send — safe `403`.
- Block переводит active `Match` в `blocked`, но `Conversation.status` не меняет. Unblock удаляет `Block`, после чего старый conversation и его история снова видимы. Закрытие chat lifecycle остаётся в Task 024.

## Stages

| Stage | Реализованные gates | Игры и переход |
|---|---|---|
| 1 | text; voice запрещён; attachment type запрещён | games при weight 5/10; 2 completed → stage 2 |
| 2 | text + voice metadata; attachment type запрещён | games при weight 5/10/15; 3 completed → stage 3 |
| 3 | text + voice/attachment message types | конечный stage |

При 1→2 и 2→3 backend создаёт system message с `senderUserId=null` и `isSystemMessage=true`.

## Message contract

- Request всегда содержит trimmed non-empty `text` до 2000 символов.
- `messageType`: `text` (default), `voice` или `attachment`.
- Voice требует integer `voiceDurationSec`.
- Stage 2 clamp-ит переданное значение до 60 секунд на сообщение и оставшегося persisted total 90 секунд на текущего участника.
- Text/attachment получают `messageWeight=1`; voice — `MAX(1, FLOOR(duration / 15))`.
- Response использует `text` вместо DB `body`, всегда возвращает `isSystemMessage` и nullable `senderUserId`; voice дополнительно возвращает `voiceDurationSec`/`messageWeight`.

`messageType=voice` не загружает audio-файл. `messageType=attachment` на stage 3 проходит только type gate: transport, storage и public URL вложения отсутствуют.

## Игры

- Встроенный pool вопросов создаёт только `gameType=question`.
- В conversation может быть одна незавершённая игра.
- Один user не может ответить на одну игру дважды.
- Игра считается completed после ответов обоих участников.
- Postpone разрешён один раз на 60 секунд.
- Stage transition и system message выполняются после completion.

Подтверждённый gap: при concurrent first answers оба запроса могут не увидеть ответ другого в `READ COMMITTED` и не выставить `completedAt`. Исправление и real-DB race test — Task 043.

## Стартовые фразы

`GET /chat/starters` читает до четырёх active `ConversationStarter`, сортируя по `text`. Seed отсутствует, поэтому на clean database endpoint возвращает пустой список. Это Task 045.

## Voice limitations

Текущий backend доверяет клиентскому `voiceDurationSec` и не получает реальный audio-файл, не проверяет media duration и не выполняет физическую обрезку. Кроме того, параллельные sends могут вычислить quota по одному старому total и превысить 90 секунд. Это Task 044.

## Safe response boundary

Разрешены staged fields `voiceDurationSec`, `messageWeight`, `isSystemMessage`, stage/voice limits, starters и безопасный game shape. Нельзя возвращать raw Prisma rows, DB `body`, game answers/authors, other participant voice total, `lastReadMessageId`, `deletedAt`, `editedAt`, email, `birthDate`, `storageKey` или moderation internals.

## Prisma-модели

- `Conversation` / `ConversationParticipant`
- `Message`
- `ChatGame` / `GameAnswer`
- `ConversationStarter`

## Известные ограничения

- Game completion race — Task 043.
- Voice quota race и отсутствие server-verified audio processing — Task 044.
- Starter seed отсутствует — Task 045.
- Frontend/backend staged DTO contract gap — Task 048.
- WebSocket/realtime, read receipts, typing indicators и chat search не реализованы.
- Реальные attachments/audio transport и storage не реализованы.
