---
title: "chat"
weight: 70
---

Файлы: `apps/backend/src/modules/chat/`

## Что делает

Модуль управляет one-to-one conversations для matches и backend-owned staged-chat. Фактическая реализация включает список/чтение/отправку сообщений, создание conversation из match, 3 стадии общения, voice metadata, игровые вопросы, стартовые фразы из таблицы `conversation_starters` и системные сообщения при переходах стадий.

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/matches/:matchId/conversation` | Создать или вернуть conversation для match |
| `GET` | `/chat/conversations` | Список доступных conversations |
| `GET` | `/chat/conversations/:conversationId/messages` | История сообщений |
| `POST` | `/chat/conversations/:conversationId/messages` | Отправить text/voice-metadata/attachment-type message |
| `GET` | `/chat/conversations/:conversationId/stage` | Stage, timestamps и voice limits текущего участника |
| `GET` | `/chat/starters` | До четырёх active стартовых фраз |
| `GET` | `/chat/conversations/:conversationId/game/current` | Текущая доступная игра или `null` |
| `POST` | `/chat/conversations/:conversationId/game/postpone` | Отложить текущую игру один раз на 60 секунд |
| `POST` | `/chat/conversations/:conversationId/game/:gameId/answer` | Сохранить ответ участника |

Send rate limits: 30 сообщений/минуту и 120 сообщений/10 минут на user.

## Conversation access

- Conversation создаётся только из active, unexpired match; повторный start идемпотентно возвращает существующий conversation.
- Expired match не создаёт новый conversation, но ранее созданный conversation остаётся доступным.
- List/read/send требуют active participant. Send дополнительно требует active conversation, active users и отсутствие active block между участниками.
- Active `Block` в любую сторону скрывает conversation из list/read через `unblockedConversationWhere()`; send запрещается через `assertNoBlockBetween()`.
- Block переводит active `Match` в `status=blocked`, но `Conversation.status` не меняется. Unblock удаляет строку `Block`, после чего старый conversation и история снова видимы. Полный chat lifecycle остаётся scope Task 024.

## Staged-chat

| Stage | Реализованные gates | Игры и переход |
|---|---|---|
| 1 | Text разрешён; voice запрещён; attachment type запрещён | Games при message weight 5 и 10; 2 completed games переводят на stage 2 |
| 2 | Text + voice metadata разрешены; attachment type запрещён | Games при message weight 5, 10 и 15; 3 completed games переводят на stage 3 |
| 3 | Text + voice/attachment message types разрешены | Конечный stage |

При переходах 1→2 и 2→3 backend создаёт system message с `isSystemMessage=true` и `senderUserId=null`.

## Voice

- `voiceDurationSec` — число от клиента в request body, а не результат серверной проверки audio-файла.
- На stage 2 backend ограничивает значение максимумом 60 секунд на сообщение и 90 секунд суммарно на текущего участника.
- Text/attachment получают `messageWeight=1`; voice получает `MAX(1, FLOOR(voiceDurationSec / 15))`.
- Backend не принимает реальный audio-файл, не проверяет фактическую длительность media и не выполняет физическую обрезку аудио.
- Подтверждённый gap: параллельные voice sends могут считать quota от старого объекта `conversation` и превысить 90 секунд. Это Task 044.

## Игры

- `ChatGame` и `GameAnswer` реализованы в Prisma schema.
- Backend создаёт игры из встроенного pool вопросов в коде, только `gameType=question`.
- В conversation может быть одна незавершённая игра.
- Один user не может ответить на одну игру дважды.
- Игра считается completed после ответов обоих участников.
- Postpone разрешён один раз на 60 секунд.
- Stage transition и system message выполняются после game completion.

Подтверждённый gap: при concurrent first answers оба запроса могут не увидеть ответ другого участника и не выставить `completedAt`. Исправление и real-DB race test вынесены в Task 043.

## Стартовые фразы

`GET /chat/starters` читает до четырёх active записей `ConversationStarter`, сортируя по `text`.

Таблица `conversation_starters` существует, но seed-данных нет: миграция создаёт таблицу, однако `INSERT`, `createMany` или другой reproducible seed отсутствует. На clean database endpoint всегда возвращает пустой список. Это Task 045.

## Message contract

- Request всегда содержит trimmed non-empty `text` до 2000 символов.
- `messageType`: `text` по умолчанию, `voice` или `attachment`.
- Voice требует integer `voiceDurationSec`.
- Response использует `text` вместо DB `body`, возвращает `isSystemMessage`, nullable `senderUserId`, а для voice также `voiceDurationSec` и `messageWeight`.
- `messageType=attachment` на stage 3 проходит только type gate: transport, storage и public URL вложения не реализованы.

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
