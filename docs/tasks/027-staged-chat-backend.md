# Task 027 — Этапный чат: схема и бэкенд

## Метаданные

- Статус: `in_progress`
- Приоритет: P1
- Owner: TBD — требует назначения
- Executor: TBD — требует назначения
- Reviewer: TBD — требует назначения
- Создана: 2026-06-28
- Последнее обновление: 2026-07-21
- Базовая реализация: PR #29 / commit `5e38042`

## Проблема и цель

После создания матча пользователи попадали в пустой чат без контекста. Цель Task 027 — дать backend-контракт трёх этапов общения, игровых вопросов, стартовых фраз и ограничений возможностей по этапу.

Task 028 и Task 029 зарезервированы соответственно для UI игр/анимаций и frontend этапов staged-chat. Их scope и статус эта задача не меняет.

## Фактически реализовано

### Схема и staged metadata

- `Conversation` хранит `stage`, timestamps начала/обновления этапов и голосовые totals обоих участников.
- `Message` хранит nullable `voiceDurationSec`, `messageWeight` и `isSystemMessage`; у системного сообщения `senderUserId=null`.
- Добавлены `ChatGame`, `GameAnswer` и `ConversationStarter`.
- Новый conversation создаётся на этапе 1; backend является источником истины для stage.

### HTTP API

Помимо list/read/send реализованы пять staged-endpoints:

| Метод | Путь | Назначение |
|---|---|---|
| `GET` | `/chat/conversations/:conversationId/stage` | stage, timestamps и voice limits текущего участника |
| `GET` | `/chat/starters` | до четырёх активных стартовых фраз |
| `GET` | `/chat/conversations/:conversationId/game/current` | текущая доступная игра или `null` |
| `POST` | `/chat/conversations/:conversationId/game/postpone` | отложить текущую игру один раз на минуту |
| `POST` | `/chat/conversations/:conversationId/game/:gameId/answer` | записать ответ участника |

Все conversation/game endpoints выполняют participant/visibility checks через chat service. `GET /chat/starters` возвращает только активные записи.

### Этапы, сообщения и игры

- Stage 1: voice запрещён; игры создаются на thresholds 5 и 10 условных сообщений.
- Stage 2: voice metadata разрешена; одна запись ограничивается 60 секундами, общий persisted total участника — 90 секунд; игры создаются на thresholds 5, 10 и 15.
- Stage 3: снимает staged-запреты на voice/attachment message type, но сам файл вложения или audio backend не принимает.
- Text/attachment message имеет `messageWeight=1`; voice — `MAX(1, FLOOR(voiceDurationSec / 15))`.
- Игра завершается после ответов обоих участников; два завершённых game на stage 1 переводят conversation на stage 2, три на stage 2 — на stage 3.
- При переходах создаются системные сообщения с `isSystemMessage=true` и `senderUserId=null`.
- Один пользователь не может ответить на одну игру дважды; postpone ограничен одним разом.

## Реализовано частично

- Последовательный send на stage 2 ограничивает переданное значение `voiceDurationSec` остатком от 90 секунд и атомарно увеличивает persisted total вместе с созданием сообщения.
- Unit-покрытие проверяет основную staged-логику, но не доказывает поведение конкурентных запросов в PostgreSQL.
- Пул игровых вопросов находится в коде, однако стартовые фразы читаются из отдельной таблицы и требуют данных.
- `messageType=attachment` проходит staged gate только на stage 3, но transport/storage вложений не реализован.

## Подтверждённые открытые gaps

1. Одновременные первые ответы двух участников могут оставить игру без `completedAt`. Игра и число ответов читаются вне завершающей транзакции; при PostgreSQL `READ COMMITTED` оба запроса могут не увидеть ответ друг друга. Это Task 043.
2. Параллельные voice sends могут превысить общий лимит 90 секунд: остаток вычисляется по ранее прочитанному conversation. `voiceDurationSec` — клиентское число; backend не проверяет реальный audio-файл и физически его не обрезает. Это Task 044.
3. Миграция создаёт `conversation_starters`, но seed/`INSERT`/`createMany` отсутствуют. На чистой БД `GET /chat/starters` возвращает пустой список. Это Task 045.
4. Frontend DTO объявляет `ChatMessage.senderUserId` как обязательный `string`, хотя системные сообщения возвращают `null`; contract tests staged-response ↔ frontend DTO отсутствуют. Это Task 048.

## Вынесенные задачи

| Task | Scope |
|---|---|
| 043 | Атомарное завершение игры при конкурентных ответах и real-DB race test |
| 044 | Конкурентно безопасный voice total; server-verified audio duration/обрезка |
| 045 | Воспроизводимый seed стартовых фраз и проверка clean database |
| 048 | Nullable system sender и contract tests backend response/frontend DTO |

## Продуктовая спецификация

Ниже описан целевой UX; это не утверждение о полном текущем поведении.

| Этап | Целевые возможности | Условие перехода |
|---|---|---|
| 1 — начало знакомства | text, стартовые фразы, две игры | 2 завершённые игры |
| 2 — среднее общение | text + voice с лимитами, три игры | 3 завершённые игры |
| 3 — открытое общение | text + voice + attachments | конечный этап |

Целевой UX стартовых фраз показывает 3–4 варианта до первого сообщения. Для production voice flow backend должен получать реальный файл, самостоятельно определять длительность и физически обрезать данные до разрешённого остатка; текущая реализация этого не делает.

## Почему статус `in_progress`

PR #29 доставил базовую схему и staged-chat backend, но исходная цель не доказана полностью:

- не закрыты Tasks 043–045 и 048;
- Owner, Executor и Reviewer не назначены;
- нет real-PostgreSQL concurrency evidence для первых game answers и параллельных voice sends;
- нет clean-DB проверки непустого starter catalog;
- нет проверки реального audio duration/trimming;
- нет contract tests между backend staged responses и frontend DTO.

## Definition of Done для закрытия

- устранены или явно выведены из Task 027 с принятым owner-ом все четыре gaps;
- добавлено real-DB evidence для concurrency-sensitive сценариев;
- стартовые фразы воспроизводимо доступны на чистой БД;
- реальный voice contract соответствует security claims;
- backend/frontend staged DTO согласованы контрактными тестами;
- назначен независимый reviewer и приложено evidence применимых checks.

## История статуса

- 2026-06-28: created, status `approved`.
- 2026-06-30: PR #29 / `5e38042` реализовал базовую staged-chat схему и backend.
- 2026-07-21: после двух независимых blind audits статус исправлен с `done` на `in_progress`; подтверждённые gaps выделены в Tasks 043, 044, 045 и 048.
