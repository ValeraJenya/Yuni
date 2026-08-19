# Task 067a — Экспорт персональных данных пользователя

## ID

067a

## Название

Экспорт персональных данных пользователя (`GET /users/me/export`)

## Статус

research

## Приоритет

P1

## Owner

Valer

## Executor

Claude

## Reviewer

Independent blind AI reviewer

## Создана

2026-08-20

## Последнее обновление

2026-08-20

## Связанный audit finding / ADR / PR

- Task 067 (исходная задача, разделена на 067a — экспорт и 067b — удаление).
- Task 063 (юридические страницы, где расхождение было найдено).
- Task 047 (физическое удаление файлов фото) — зависимость только для 067b.

## Проблема

Эндпоинта выгрузки собственных данных не существует. `UsersModule`
(`apps/backend/src/modules/users/users.module.ts`) — пустой `@Module({})`, без
контроллера и сервиса, но уже зарегистрирован в `app.module.ts:41`.

Опубликованная политика конфиденциальности
(`apps/frontend/features/legal/content/privacy.ts:280`) обещает доступ к данным
по письму на `hello@yuni.app` в срок до 30 дней и отдельным TODO-блоком
(`privacy.ts:284`) фиксирует, что самостоятельной выгрузки в интерфейсе нет.

Это расхождение со ст. 15 (право доступа) и ст. 20 (переносимость данных)
GDPR и со ст. 14 152-ФЗ.

## Цель

Аутентифицированный пользователь получает по `GET /users/me/export` полный
машиночитаемый JSON своих данных, и при этом не получает персональных данных
других людей.

Вторая, не менее важная цель: **письменный инвентарь того, что сервис хранит о
человеке** — разбор всех relation-полей модели `User` с решением по каждому,
включая исключённые, с причиной.

## Зависимости

- Нет. Экспорт только читает.

## Блокирует

- Task 067b (удаление аккаунта): состав экспорта — готовый инвентарь того, что
  предстоит стирать.
- Снятие TODO-блока на `/privacy` (делается после 067b, не в этом PR).

## Затрагиваемые модули

- `apps/backend/src/modules/users/` — новые `users.controller.ts`,
  `users.service.ts`, `types/`, spec-файлы.
- `apps/backend/src/common/rate-limit/rate-limit.constants.ts` — новая политика.
- `apps/backend/test/` — новый e2e spec.
- `docs/security/data-exposure-rules.md` — новый раздел «Data Export Response
  Shape».
- `docs/ROADMAP.md`, `docs-site/content/tasks/067.md` — разделение 067 на 067a/067b.

## Разрешённый scope

- `GET /users/me/export` под `JwtAccessGuard`.
- Read-only Prisma-запросы.
- Rate-limit политика для экспорта.
- Явный response shape + документация этого shape.
- Unit + e2e тесты.

## Явно запрещённый scope

- `DELETE /users/me` и любая логика удаления/анонимизации — это Task 067b.
- Изменения `prisma/schema.prisma` и любые миграции.
- Изменения текстов на `/privacy`, `/terms`, `/help`.
- Любые UI-изменения во frontend.
- Изменение существующих сериализаторов и response shape других модулей.

## Факты

Проверено по коду на `main` `8feff3b`, 2026-08-19.

- `UsersModule` пуст (`users.module.ts:3` — `@Module({})`), зарегистрирован в
  `app.module.ts:41`.
- Эндпоинтов `/users/*` в кодовой базе нет.
- `User` имеет 16 relation-полей (`schema.prisma:92-108`) и 9 скалярных.
- `docs/security/data-exposure-rules.md` разрешает self-эндпоинтам отдавать
  «own private settings, if a future endpoint is explicitly self/private»
  (строка 37) и запрещает `passwordHash`, refresh token hash, `storageKey`,
  локальные пути и internal moderation data даже в self-ответах (строки 42-50).
- Политики rate-limit объявлены в
  `common/rate-limit/rate-limit.constants.ts` как массивы; применяются
  декоратором `@UseRateLimit(RATE_LIMIT_POLICIES.<name>)`
  (пример — `notifications.controller.ts:14`).
- В `Conversation` голосовой лимит хранится как `user1VoiceTotalSec` /
  `user2VoiceTotalSec`; определение «кто из двух я» уже реализовано в
  `chat.service.ts:964` (`getVoiceTotalForUser` / `isFirstVoiceParticipant`).
- `PrivacySettings.anonymousAvatarKey` бэкенд сейчас намеренно не отдаёт
  (`settings.service.spec.ts:44` фиксирует `expect.not.objectContaining`).
- Существующие e2e (`apps/backend/test/*.e2e-spec.ts`) поднимают реальное
  Nest-приложение с реальным Postgres.

---

## Инвентарь: разбор полей модели `User`

Главный артефакт задачи. Решение по каждому полю — с причиной, включая
исключённые.

### Скалярные поля `User` (`schema.prisma:82-90`)

| Поле | Решение | Причина |
|---|---|---|
| `id` | включить | Собственный идентификатор; нужен как якорь всех остальных секций. |
| `email` | включить | Собственный email; `data-exposure-rules` явно разрешает в self-ответе. |
| `passwordHash` | **исключить** | Жёсткий запрет (`data-exposure-rules:43`). Хеш пароля не нужен субъекту и является материалом для offline-атаки. |
| `status` | включить | Состояние собственного аккаунта. |
| `emailVerifiedAt` | включить | Факт о собственных данных. Сейчас всегда `null` (Task 033 не сделан). |
| `lastLoginAt` | включить | Собственные данные о поведении. |
| `createdAt` / `updatedAt` | включить | Собственные данные. |
| `deletedAt` | **исключить** | `data-exposure-rules:22` запрещает отдавать `deletedAt`. Для авторизованного пользователя оно всегда `null` — удалённый не проходит `JwtAccessGuard`. Поле не несёт информации и нарушает документированное правило. |

### Relation-поля `User` (`schema.prisma:92-108`)

#### 1. `profile` — **включить**

Ядро PII. Все поля: `handle`, `displayName`, `birthDate`, `bio`, `gender`,
`lookingFor`, `city`, `country`, `latitude`, `longitude`, `isDiscoverable`,
`createdAt`, `updatedAt`.

`latitude` / `longitude` включаются намеренно: это точные геокоординаты
пользователя, которые сервис хранит и которые он нигде в UI не видит. Именно
такие поля и делают инвентарь ценным.

Вложенно:

- **`profile.photos`** — включить как метаданные: `id`, `publicUrl`,
  `blurhash`, `mimeType`, `width`, `height`, `position`, `isPrimary`,
  `moderationStatus`, `approvedAt`, `rejectedAt`, `publishedAt`, `createdAt`.
  **`storageKey` исключить** — жёсткий запрет (`data-exposure-rules:49`).
  Сами файлы в JSON не вкладываются, только `publicUrl` (см. Known limitations).
- **`profile.interests`** — включить: `interest.name`, `interest.slug`,
  `createdAt`. Таблица на практике пуста (фича интересов не реализована,
  Task 050), но секция должна быть в контракте.

#### 2. `refreshTokens` — **включить частично**

Метаданные сессий — персональные данные по ст. 15 GDPR: сервис хранит IP и
User-Agent пользователя, и человек об этом нигде не узнаёт.

Включить: `deviceLabel`, `ipAddress`, `userAgent`, `createdAt`, `lastUsedAt`,
`expiresAt`, `revokedAt`.

**Исключить `tokenHash`** — жёсткий запрет (`data-exposure-rules:45`).
**Исключить `revokedReason`** и `id` — внутренние поля механики сессий,
не несут смысла субъекту.

#### 3. `likesSent` — **включить, только UUID цели**

Собственные действия пользователя. Включить: `likedUserId` (голый UUID),
`kind`, `createdAt`, `expiresAt`.

Профиль цели **не подтягивать** (`handle`, `displayName`, фото). Экспорт не
должен становиться снапшотом чужих анкет: пользователь свои действия и так
совершил, а вот сохранять чужие профили в скачиваемый файл — новая утечка.

#### 4. `likesReceived` — **исключить полностью**

Ключевое решение. Формально лайк, где я — цель, «касается» меня, но:

- Yuni нигде не показывает, кто меня лайкнул или пропустил. Экспорт создал бы
  канал раскрытия, которого в продукте нет.
- Взаимные лайки пользователь и так видит — как матчи, и матчи экспортируются
  отдельно. То есть исключение не лишает пользователя ничего, что ему доступно.
- Записи с `kind: pass` — это «эти люди вас пропустили». Раскрытие чужого
  отказа — данные другого человека и прямой продуктовый вред.
- Ст. 15(4) GDPR: право на копию не должно нарушать права и свободы других лиц.

Агрегированные счётчики (`получено N лайков`) также **не включаются**: счётчик
пропусков — та же самая проблема в сжатом виде.

#### 5. `matchesAsUserA` / `matchesAsUserB` — **включить, только UUID второго**

Матч взаимен и уже виден в интерфейсе. Включить: `id`, `status`, `matchedAt`,
`expiresAt`, `endedAt`, `createdAt`, `otherUserId` (голый UUID),
`conversationId`.

Профиль второго участника не подтягивается — по той же причине, что и в
`likesSent`.

Оба поля сливаются в одну секцию `matches`; какая сторона `userA`/`userB` —
внутренняя деталь схемы, наружу не выходит.

#### 6. `conversationMembers` — **включить частично**

Включить: `conversationId`, `joinedAt`, `leftAt`, а также контекст диалога —
`conversation.status`, `stage`, `stage1/2/3StartedAt`, `stageUpdatedAt` и
**собственный** `voiceTotalSec`, вычисленный по логике
`chat.service.ts:964`.

**Исключить `lastReadMessageId`** — `data-exposure-rules:279` запрещает его в
chat-ответах; это внутренний курсор без ценности для субъекта.
**Исключить голосовой тотал второго участника** — прямой запрет
(`data-exposure-rules:283`).

#### 7. `sentMessages` — **включить; чужие сообщения не включать**

Собственные сообщения: `id`, `conversationId`, `text` (значение поля `body` —
под именем `text`, как требует `data-exposure-rules:281`), `voiceDurationSec`,
`messageWeight`, `isSystemMessage`, `status`, `createdAt`, `editedAt`.

Сообщения со `status: deleted` **включаются** вместе с телом. Это осознанно:
сервис их физически хранит, и честный инвентарь обязан это показать, иначе
экспорт врёт о содержимом базы. `deletedAt` при этом отдаётся как
`deletedAt` внутри собственной секции сообщений — запрет
`data-exposure-rules:280` относится к chat-ответам, где виден второй участник;
здесь это собственная метка пользователя. **Требует подтверждения owner-а.**

**Сообщения собеседника исключаются полностью.** Это явный ответ на главный
вопрос задачи:

- Реплики собеседника — его персональные данные, а не мои.
- Ст. 15(4) GDPR прямо ограничивает выгрузку в части прав других лиц.
- «Контекст диалога» — самый частый предлог, под которым фича приватности
  превращается в дыру в приватности.

Последствие, которое надо принять осознанно: экспорт диалога выглядит
монологом. Порядок реплик восстанавливается по `createdAt` и `conversationId`,
но чужие реплики между ними отсутствуют. Ограничение фиксируется в
`docs/api` и в Known limitations, а не заминается.

#### 8. `gameAnswers` — **включить вместе с вопросом**

Собственные ответы: `answer`, `answeredAt`, `gameId`, и контекст из `ChatGame`
— `question`, `stage`, `gameType`, `options`, `shownAt`. Вопрос — системный
контент, не персональные данные, а без него ответ бессмыслен.

**Ответ второго участника на ту же игру исключается** — чужие данные.
`data-exposure-rules:282` запрещает «game answer rows or answer authors» и в
chat-ответах.

#### 9. `blockedUsers` (`BlocksFrom`) — **включить**

Собственное действие, уже доступно через `GET /blocks/me`. Включить:
`blockedUserId` (UUID), `reason`, `createdAt`. Внутренний `id` блока
исключается — `data-exposure-rules:340` запрещает его отдавать.

#### 10. `blockedByUsers` (`BlocksTo`) — **исключить полностью**

Кто заблокировал меня. Продукт это намеренно не показывает; раскрытие — прямой
риск безопасности в дейтинге: заблокированный, узнавший о блокировке, получает
повод для мести или обхода. Это не спорный случай.

#### 11. `reportsFiled` — **включить частично**

Собственные жалобы: `id`, `reportedUserId` (UUID), `reasonCode`, `comment`,
`createdAt`, публичный `status` (`"received"`, как в текущем контракте).

**Исключить** внутренний `ReportStatus`, `resolvedAt`, `resolutionNote`,
`updatedAt`, личность модератора — прямой запрет
(`data-exposure-rules:363-369`).

#### 12. `reportsReceived` — **исключить полностью**

Жалобы на меня. Три независимые причины:

- Личность жалобщика — его данные, и её раскрытие ставит под удар человека,
  сообщившего о злоупотреблении.
- Даже сам факт наличия жалоб предупреждает нарушителя и ломает работу
  модерации.
- `data-exposure-rules:24` относит reports и internal abuse data к запрещённым
  к выдаче.

GDPR Recital 63 и ст. 15(4) прямо допускают это ограничение.

Отдельно: это **не** тот вопрос про `Report`, который открыт в 067b. Там
решается судьба жалоб при удалении аккаунта; здесь — только выдача, и ответ
однозначен.

#### 13. `privacySettings` — **включить**

Собственные приватные настройки — `data-exposure-rules:37` их разрешает для
явного self-эндпоинта. Все поля: `profileVisibilityMode`, `showDistance`,
`showOnlineStatus`, `showDisplayNameInPrivateMode`, `showBioInPrivateMode`,
`showLocationInPrivateMode`, `discoverable`,
`allowMessagesFromMatchesOnly`, `createdAt`, `updatedAt`.

`anonymousAvatarKey` **исключается**: сейчас бэкенд его нигде не отдаёт
(зафиксировано тестом `settings.service.spec.ts:44`), и экспорт не должен в
одиночку менять это решение.

#### 14. `notificationSettings` — **включить**

Все поля: `likesEnabled`, `matchesEnabled`, `messagesEnabled`,
`productUpdatesEnabled`, `createdAt`, `updatedAt`.

#### 15. `notificationsReceived` — **включить частично**

Собственная лента: `id`, `type`, `messageKey`, `createdAt`, `readAt`,
`actorUserId` (UUID), `matchId`, `conversationId`, `messageId`.

Профиль актора не подтягивается. Тело сообщения по `messageId` не
подтягивается — `data-exposure-rules:318` это запрещает.

#### 16. `notificationsActed` — **исключить полностью**

Это уведомления **в лентах других людей**, где я — актор. Их содержимое
принадлежит получателю, а не мне; выгрузка означала бы чтение чужих
уведомлений.

### Сущности вне графа `User`

- `Interest`, `ConversationStarter` — глобальные справочники, не персональные
  данные. Не экспортируются (кроме `name`/`slug` тех интересов, что выбрал сам
  пользователь).
- `ChatGame` — системный контент, экспортируется только как контекст
  собственных `gameAnswers`.

---

## Принятые решения

1. Разделить Task 067 на 067a (экспорт, этот PR) и 067b (удаление).
2. Экспорт строится на явном allowlist полей, а не на `include` с последующим
   вычитанием. Новое поле в схеме по умолчанию **не** попадает в выгрузку.
3. Ни одна секция не подтягивает профиль другого пользователя. Второй человек
   всегда представлен голым UUID.
4. Сообщения собеседника не выгружаются. Экспорт диалога односторонний.
5. Формат — один JSON-объект в теле ответа, с `exportedAt` и `schemaVersion`
   на верхнем уровне.
6. Пустые секции присутствуют в ответе как `[]` / `null`, а не опускаются:
   отсутствие данных — тоже ответ на вопрос «что вы обо мне храните».

## Открытые вопросы

Требуют решения owner-а до начала кода.

1. **Собственные удалённые сообщения.** Рекомендация — включать вместе с телом
   и `deletedAt`, потому что сервис их хранит и инвентарь обязан это признать.
   Альтернатива — отдавать только факт удаления без тела.
2. **Метаданные сессий (`refreshTokens`).** Рекомендация — включать IP и
   User-Agent, потому что это скрытые от пользователя данные о нём.
   Альтернатива — исключить секцию целиком как инфраструктурную.
3. **Формат доставки.** Рекомендация для 067a — обычный JSON-ответ
   (`Content-Type: application/json`). Альтернатива — `Content-Disposition:
   attachment` с именем файла. Второе имеет смысл только вместе с UI-кнопкой,
   которой в этом PR нет.
4. **Точные лимиты частоты.** Предложение — `3 запроса в час` по ключу `user`
   плюс `10 в час` по ключу `ip`. Готов принять другие цифры.

## Инварианты

- Ответ содержит только данные, относящиеся к `currentUser.id`.
- Ни при каких данных в ответе не появляются `passwordHash`, `tokenHash`,
  `storageKey`, локальные пути, `anonymousAvatarKey`, внутренние поля
  модерации.
- Ни одно сообщение в выдаче не имеет `senderUserId !== currentUser.id`.
- Эндпоинт не выполняет записей в БД.

## Security checks

- Owner check: единственный источник идентичности — `currentUser` из
  `JwtAccessGuard`; никаких user id из query/body/headers.
- Отсутствие аутентификации → `401`.
- Rate limit применён и покрыт тестом.
- Ответ построен явными сериализаторами, не raw Prisma rows.
- Логи не содержат тело экспорта.
- Сверка с `docs/security/data-exposure-rules.md` — раздел
  «Data Export Response Shape» добавляется в том же PR.

## Scope-check

Задача затрагивает `auth` (guard), `profiles`, `chat`, `media`-метаданные,
API contract, rate limits и PII. По `AGENTS.md` (раздел «Scope rules») это
**не** облегчённый режим: требуется явное подтверждение scope-check owner-ом
до начала кода.

Задача при этом read-only: ни схема, ни миграции, ни существующие эндпоинты не
меняются. Основной риск — не поломка, а утечка: выдача чужих персональных
данных под видом собственных. Он снимается allowlist-подходом, правилом «второй
участник = только UUID» и e2e-проверкой на чужие данные.

## Подтверждение scope-check

Кто подтвердил:
Дата:
Формат подтверждения:

## План реализации

1. Наполнить `UsersModule`: `UsersController`, `UsersService`,
   `types/user-data-export.ts` с явным типом ответа.
2. Реализовать `GET /users/me/export` под `JwtAccessGuard` +
   `@CurrentUser()`.
3. Собрать данные несколькими явными Prisma-запросами с `select`-allowlist
   (не `include`), в одной read-транзакции для консистентного снимка.
4. Сериализаторы — отдельный слой, по образцу
   `common/serializers/user-profile.serializer.ts`.
5. Добавить `RATE_LIMIT_POLICIES.usersDataExport` и повесить
   `@UseRateLimit`.
6. Unit-тесты сервиса: allowlist полей, отсутствие запрещённых ключей,
   фильтрация сообщений по `senderUserId`.
7. E2E на реальном Postgres.
8. Добавить раздел «Data Export Response Shape» в
   `docs/security/data-exposure-rules.md` и описание эндпоинта в `docs/api`.
9. Обновить `docs/ROADMAP.md` и `docs-site/content/tasks/067.md`, разделив
   067 на 067a/067b.

## План проверки

- `corepack pnpm --dir apps/backend lint`;
- `corepack pnpm --dir apps/backend typecheck`;
- `corepack pnpm --dir apps/backend test`;
- `corepack pnpm --dir apps/backend test:e2e`;
- `git diff --check`;
- проверка, что в diff нет `prisma/schema.prisma` и `prisma/migrations/`;
- independent blind review по `docs/AI_REVIEW_PROTOCOL.md`.

Visual QA по `CLAUDE.md` не применяется: изменений вёрстки в PR нет.

## Ручные проверки

- Не требуются: UI в этом PR не меняется.

## Definition of Done

- `GET /users/me/export` работает под `JwtAccessGuard`, без аутентификации
  возвращает `401`.
- Состав выдачи соответствует инвентарю выше построчно.
- Тест доказывает отсутствие `passwordHash` и `tokenHash` в сериализованном
  ответе — проверкой ключей, а не глазами.
- Тест доказывает, что в выдаче нет сообщений собеседника.
- Rate limit применён и покрыт тестом.
- В diff нет `schema.prisma` и миграций.
- Все quality gates из плана проверки пройдены.

## Документация для обновления

- `docs/security/data-exposure-rules.md` — новый раздел.
- `docs/api/README.md` — описание эндпоинта и ограничений выгрузки.
- `docs/ROADMAP.md` — 067 → 067a/067b.
- `docs-site/content/tasks/067.md` — то же.
- `AGENTS.md` — не меняется: workflow, quality gates и security rules эта
  задача не меняет, она им следует.

## Evidence после выполнения

- TBD.

## Не проверялось

- TBD.

## Known limitations

- Экспорт отдаёт метаданные фотографий и `publicUrl`, но не сами файлы. Ст. 20
  GDPR («в структурированном, машиночитаемом формате») этим удовлетворяется
  спорно; вложение бинарных файлов — отдельная задача.
- Диалоги выгружаются односторонне (только собственные реплики). Это осознанное
  решение в пользу приватности второго участника.
- TODO-блок на `/privacy` остаётся до закрытия 067b.
- Синхронного снимка «на момент запроса» гарантировать нечего: экспорт
  выполняется в read-транзакции, но параллельные записи между запросом и
  скачиванием не отслеживаются.

## История статуса

- 2026-08-20: created, ожидает подтверждения scope-check.
