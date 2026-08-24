# Roadmap

## Правила

- Task ID - постоянный идентификатор, а не порядок выполнения.
- Приоритет определяет порядок выполнения.
- Зависимость блокирует начало задачи.
- Status и priority - разные вещи.

Status vocabulary:

```text
idea
research
ready
in_progress
review
blocked
done
deferred
superseded
```

Priority vocabulary: `P0`, `P1`, `P2`, `P3`.

## Сейчас

Открытых P0 нет. Продуктовые пробелы, найденные при ручной проверке сервиса
14 августа, закрыты целиком: 071 (PR #73), 030 (PR #74), 069 (PR #75),
070 (PR #76), 072 вместе с 045 (PR #77). Задача 067 разделена: 067a (экспорт
данных) влит в PR #80, открыта только 067b (удаление аккаунта). 046 и 061
закрыты по факту раньше, чем отражено здесь — статус поправлен при
верификации Task 046 (2026-08); 076 влита в PR #84, статус тоже поправлен.
После этого в разделе остаются только два реально открытых пункта: 027 и
054.

Ближайший P1 — 074: после PR #78 главный CTA лендинга ушёл ниже сгиба.

| ID | Название | Статус | Комментарий |
|---|---|---|---|
| 027 | Этапный чат — схема и бэкенд | in_progress | Базовая реализация есть; starters (045) и contract gaps (048) закрыты, остаётся аудио (068) |
| 054 | Дрейф документации | in_progress | Четвёртый заход подряд. Синхронизация на `42db25f` / PR #80; процессные выводы — в PR этой задачи |

## Запланировано

| ID | Название | Статус | Priority | Зависимости | Notes |
| --- | --- | --- | --- | --- | --- |
| 023 | Safe image processing and media lifecycle | idea | P1 | Task 000 | EXIF/sanitization/moderation lifecycle; orphaned public file after delete выделен в Task 047. |
| 025 | Production deployment readiness | idea | P1 | Task 000 | Deployment architecture, secrets, HTTPS, reverse proxy. |
| 026 | PostgreSQL integration checks in CI | idea | P2 | Task 000 | Общий integration gate. Postgres в CI уже поднимается, а journey-покрытие закрыто (Task 058 и 053 — `done`); остаётся зафиксировать политику покрытия для новых модулей. |
| 027 | Этапный чат — схема и бэкенд | in_progress | P1 | Task 018 | Базовый backend реализован; выделенные gaps 043, 044, 045 и 048 (contract alignment) закрыты, остаётся 068 (аудио). |
| 031 | Password reset backend | idea | P1 | — | Frontend мокает через setTimeout, backend endpoint отсутствует. Зафиксировано как TODO на `/terms` и `/help` (Task 063) |
| 032 | Landing vs реальность | idea | P1 | — | Заявлена ручная верификация и круглосуточная модерация, по факту `media.service.ts:111` ставит `moderationStatus: approved` сразу при загрузке. Расхождение зафиксировано как TODO на `/privacy` (Task 063) |
| 033 | Email verification | idea | P1 | — | Не реализован, любой email принимается; `emailVerifiedAt` никогда не заполняется. Зафиксировано как TODO на `/privacy` (Task 063) |
| 035 | Gender/lookingFor свободный текст | idea | P1 | — | Нет единого контракта frontend/backend/БД |
| 036 | Dockerfile без USER directive | idea | P2 | — | Backend и frontend работают от root |
| 037 | packageManager не закреплён | idea | P2 | — | Версия pnpm не зафиксирована в package.json |
| 039 | Политика integration/e2e покрытия | idea | P3 | — | Обязательное покрытие критических сценариев |
| 040 | OAuth-кнопки декоративны | idea | P1 | — | Google/Apple без onClick, помечены Social placeholders |
| 050 | Дополнительные мёртвые кнопки | in_progress | P2 | — | Шапка диалога закрыта в PR #72, баннер «Улучши профиль» и бейджи PREMIUM удалены в PR #74 (коммит `d143078` перечисляет их поимённо). Остаётся «Добавить» в секции «Интересы» профиля: `Interest` и `ProfileInterest` есть в схеме, но ни одного эндпоинта нет, а `UpdateProfileDto` их не принимает — в коде backend они читаются только сериализатором экспорта (`users.service.ts:85`, `:269`) |
| 054 | Дрейф документации | in_progress | P3 | — | Verified-baseline расходится с git-историей — процессный пункт. Четвёртый заход подряд: PR #33 (`75d527c`), PR #35 (`dbdac85`), PR #67 (`b30ce10`) и текущий |
| 055 | Database-доки отстали от миграций | idea | P3 | — | staged-chat и Task 021 не отражены |
| 056 | CI/DevOps проблемы | idea | P2 | — | Root-контейнеры, дефолтные креды, JWT плейсхолдеры, Hugo без PR-гейта |
| 062 | Report не привязан к контенту | idea | P3 | — | Только к пользователю целиком, хотя схема поддерживает `conversationId`/`messageId`/`profilePhotoId`. Ограничение зафиксировано как TODO на `/terms` (Task 063) |
| 067b | Self-service удаление аккаунта | idea | P1 | Task 047, Task 067a | Выделено из 067. `DELETE /users/me` — soft delete с анонимизацией, не физическое удаление: `Message.sender` объявлен `onDelete: Cascade`, поэтому удаление строки `User` снесло бы переписку у собеседника. Готовый инвентарь — колонка «При удалении» в `docs/tasks/067a-user-data-export.md`, там же три вопроса, которые надо решить до кода. Главный вывод инвентаря: при soft delete **ни один каскад не сработает сам**, всё придётся удалять явно. `UserStatus.deleted`/`deletedAt` уже читаются восемью сервисами — не хватает только того, что их выставляет. Расхождение со ст. 17 GDPR, ст. 21 152-ФЗ |
| 068 | Голосовые сообщения без аудио и без верификации длительности | idea | P2 | Task 027 | `voiceDurationSec` — число из DTO, которому бэкенд верит; загрузки аудиофайла в API нет вообще. Спека Task 027 обещает backend-верификацию и физическую обрезку аудио — этого не существует. Выделено из Task 044, у которого исправлена только конкурентная часть |
| 073 | UUID-валидация `cursor` в пагинации: P2023 утекает 500-й через query | idea | P2 | — | `cursor` объявлен `@IsOptional() @IsString()` без `@IsUUID()` в двух независимых DTO — общем `common/pagination/cursor-pagination.dto.ts` и собственном `modules/discovery/dto/discovery-cards-query.dto.ts`, поэтому починка одного общего DTO разом обе не закроет. Уходит в Prisma по uuid-колонке в пяти местах: `moderation.service.ts:180`, `chat.service.ts:349`, `chat.service.ts:398`, `notifications.service.ts:183` (все четыре как `cursor: { id }`) и `discovery.service.ts:104` (как `cursor: { userId }`). Механизм тот же, что в Task 060, но через query, а не path: невалидный UUID доходит до Prisma, та бросает P2023, `AllExceptionsFilter` не распознаёт его как `HttpException` и отдаёт 500. Найдено при выполнении Task 060, руками не воспроизводилось — только чтение кода. Смежно с более крупной задачей о разборе Prisma-ошибок в `AllExceptionsFilter` |
| 074 | Главный CTA лендинга ниже сгиба | idea | P1 | — | Стек контента hero — 986px при обёртке `min-h-[100svh]`. На 1280×800 кнопка «Познакомиться» целиком за пределами первого экрана (`top=859`), на 1280×900 обрезана на 6px. Причина — `justify-start` вместе с сохранённым `pt-28` в `apps/frontend/components/landing/hero.tsx` из коммита `3a196a3` (PR #78 / merge `a5b2b15`): якорение к верху убрало пустоту на высоких окнах, но на типовых десктопных высотах увело CTA под сгиб. Возврат `justify-center` воспроизведёт исходный дефект — чинить высотой стека или отступом. Найдено визуальной проверкой PR #78 |
| 075 | lint-baseline вырос с 17 до 18 | idea | P3 | Task 074 | `react-hooks/set-state-in-effect` в `apps/frontend/components/landing/motion/in-view.tsx:43`. Предупреждение стоит на `setVisible(true)` в ветке фолбэка `typeof IntersectionObserver === "undefined"`: она существует ровно для того, чтобы на старых движках контент показался сразу, а не остался невидимым блоком. **Механическое исправление сломает путь деградации.** Чинить ленивым начальным состоянием либо точечным `eslint-disable` с объяснением, зачем ветка нужна. Записано в строку явно, потому что следующий, кто увидит 18 вместо 17, иначе «почистит» предупреждение и уберёт фолбэк |
| 077 | Общий пакет для PROFILE_COMPLETION_FIELDS | idea | P3 | Task 076 | `apps/frontend` и `apps/backend` — независимые пакеты монорепо, прямой импорт между ними невозможен. Task 076 закрыл дыру test-time text-parse'ом бэкендного файла (frontend-тест читает `profile-completion.policy.ts` как текст и регэкспом достаёт список полей) — это подпорка: ловит расхождение списков, но ломается на любом рефакторинге формата константы, а не только на реальном дрейфе. Правильное решение — вынести `PROFILE_COMPLETION_FIELDS` в общий пакет монорепо, из которого его импортируют обе стороны; тогда компилятор, а не regexp, гарантирует единый источник истины. |
| 078 | Пять из восьми chat-эндпоинтов недостижимы с фронта | idea | P1 | Task 027 | `chat.controller.ts` — 8 эндпоинтов, `chatApi` (frontend) использует 3 (`getConversations`, `getMessages`, `sendMessage`). Без клиента: `GET conversations/:id/stage`, `GET starters`, `GET conversations/:id/game/current`, `POST game/postpone`, `POST game/:gameId/answer`. Именно этапность и игры — единственная причина существования Task 027 (P1) и всей цепочки 043/044/045/068 — с фронта недостижимы вообще: пользователь не видит текущий этап, не видит игровой вопрос, не может ответить или отложить игру. Backend-работа полностью инвестирована в функциональность, которую никто не может включить. Приоритет P1, не P2: это не отсутствующая мелкая фича, а причина, по которой P1-инвестиция в Task 027 не даёт никакого пользовательского эффекта. Найдено при верификации Task 048. |

## Выполнено

| ID | Название | Статус | Priority | Evidence |
| --- | --- | --- | --- | --- |
| 000 | Project documentation foundation | done | P0 | PR #24 / 6d3d399 |
| Step 20.2 | Profile photo storage boundary | done | P0 | PR #23 / ca50baf |
| 021 | Profile completion lifecycle | done | P0 | Branch commits `3abd405`–`852c67f`; checks and independent blind review passed. |
| 024 | Atomic block and match lifecycle | done | P1 | PR #38 / merge `f027b0f`; юнит-тесты зелёные на CI. Read-path gap закрыт при верификации Task 053. |
| 043 | Race condition game-answer | done | P1 | PR #39 / merge `157fc46`; game-race.e2e-spec.ts стабильно зелёный на реальном Postgres. |
| 058 | CI не может запустить e2e | done | P2 | PR #47; Postgres service + backend test:e2e в quality-gates, реально прогнан на CI. |
| 059 | Backend lint — это tsc --noEmit | done | P2 | PR #47; backend ESLint отдельным шагом от typecheck. |
| 065 | Нет CD-пайплайна для приложения | done | P2 | PR #48; GHCR build/publish workflow для backend/frontend images (без environment deploy — это Task 025). |
| 053 | Critical real-DB/HTTP coverage | done | P2 | PR #49→#53; real-Postgres e2e для journey/game-race/voice-limit зелёные на CI. Block-vs-match — skipped до Task 042. |
| 057 | Privacy/Notification settings API | done | P0 | PR #55 → #57 (+ #58, фикс отсутствующего импорта JwtModule); `SettingsModule` с GET/PATCH `/settings/privacy` и `/settings/notifications`. `anonymousAvatarKey` вынесен в отдельное security-решение. |
| 064 | Невидимый текст в модалке фильтров Discovery | done | P1 | PR #42 / merge `79233fc`; `FilterToggle` и `FilterSheet` переведены на семантические токены вместо литеральных значений. |
| 066 | Landing font, hero и design rules | done | P2 | PR #42 / merge `79233fc`; design tokens и anti-slop checklist зафиксированы в `CLAUDE.md`, спека — `docs/tasks/066-landing-font-hero-design-rules.md`. Задача существовала в `docs/tasks/`, но в ROADMAP не была занесена. |
| 063 | Юридические страницы /terms /privacy /help | done | P0 | PR #60 / merge `a77bd90`, CI 5/5; три статических роута на общем `LegalPage`, RU/EN, контент по фактическому инвентарю данных. Нереализованные функции помечены видимыми TODO-блоками. Тексты требуют вычитки юристом до публикации. |
| 042 | Race condition блокировка vs match | done | P1 | PR #61 / merge `9556a3f`; `pg_advisory_xact_lock` по канонической паре пользователей в `blockUser` и `tryCreateMatchFromLike`. Снят `skip` с real-Postgres теста block-vs-match в `match-block-chat.e2e-spec.ts`, прогон зелёный. |
| 044 | Voice-limit bypass | done | P1 | Исправлено попутно в PR #49 (коммит `96603a8`), как отдельная задача не отмечалось: `lockAndReloadConversation` берёт `SELECT ... FOR UPDATE` по диалогу и пересчитывает остаток лимита внутри транзакции. Покрыто e2e `keeps concurrent stage-2 voice messages within the 90 second user limit`. Вторая половина находки — доверие к клиентскому `voiceDurationSec` — вынесена в Task 068. |
| 047 | Удалённое фото остаётся доступным | done | P1 | PR #62 / merge `fb8684b`; файл удаляется до записи в БД, сбой удаления файла проваливает запрос вместо тихого проглатывания, `ENOENT` считается успехом. E2E намеренно не добавлялся — под root в CI отказ `unlink` не воспроизвести. |
| 022 | Frontend media URL resolution | done | P1 | Основная часть — PR #41 / merge `0d6f51e` (лента, matches, messages). Последняя нерезолвленная точка — модалка матча в discover — закрыта PR #64 / merge `ebf5173`: ответ `likesApi` шёл в состояние мимо `toUserProfile`. |
| 049 | Fake healthcheck | done | P2 | PR #65 / merge `1142ff5`; `SELECT 1` через Prisma, `dependencies.database`, 503 при недоступной БД — иначе healthcheck docker-compose (`r.ok`) считал контейнер здоровым. Причина сбоя наружу не отдаётся. |
| 038 | Мёртвый demo-mode код | done | P2 | PR #66 / merge `fdd3fdc`; `DemoSessionProvider` и `DemoGate` удалены — провайдер не монтировался, компонент не импортировался. Предупреждений линтера стало 17 вместо 18. |
| 052 | Переключатель языка неполон | done | P2 | PR #68 / merge `55163e4`; один `LangProvider` в корневом layout, выбор хранится в `localStorage` через `useSyncExternalStore`, `document.documentElement.lang` обновляется, язык синхронизируется между вкладками. |
| 060 | ParseUUIDPipe непоследователен | done | P2 | PR #79 / merge `38d3e5a`; `ParseUUIDPipe` добавлен в оба `@Param('photoId')` в `media.controller.ts` — это были единственные две точки без пайпа во всех 12 контроллерах (обход выписан в описании коммита). Без пайпа `photoId` доходил до `findUnique` по uuid-колонке, Prisma бросала P2023, и `AllExceptionsFilter` отдавал 500 вместо 400. Новый `test/media-path-params.e2e-spec.ts` на реальном Postgres: до фикса обе проверки падали с 500, после — 400. Контрольные случаи в том же спеке: корректный несуществующий UUID даёт 404 (пайп не ломает нормальный путь), запрос без токена — 401 (guard остаётся впереди пайпа). Класс ошибки закрыт только для path-параметров; через query та же P2023 продолжает утекать — вынесено в Task 073. |
| 071 | Маскоты вместо чужого фото в фолбэках | done | P2 | PR #73 / merge `90fe38a`; `defaultAvatarUrl(gender, variant)` в `lib/default-avatar.ts`, `/hero-portrait.jpg` больше не используется как аватар ни на одном экране. Для незаполненного и нераспознанного `gender` — нейтральный SVG; свободный текст в поле (Task 035) поэтому попадает в нейтральный вариант. Список диалогов и аватар «Ты» в оверлее матча намеренно получают нейтральный вариант: chat API не отдаёт пол собеседника, `useAuth` — пол текущего пользователя. |
| 030 | Мёртвые кнопки в профиле | done | P1 | PR #74 / merge `8e1ec73`; экраны `/settings/privacy` и `/settings/notifications` на реальном API из Task 057, переключение оптимистичное с откатом при ошибке, строки-переходы рендерятся ссылками. Заодно удалён премиум (`isPremium` был захардкожен в `false`). Кнопка «Добавить» у интересов осталась неактивной — Task 050. |
| 070 | Онбординг-анкета после регистрации | done | P1 | PR #76 / merge `2b0d847`; роут `/onboarding` вне группы `(app)`, переиспользует `ProfileFormFields` из Task 069. Заодно устранена гонка редиректов: решение о переходе принимает layout `(auth)` по фактической заполненности анкеты, а не `router.replace` из формы регистрации. |
| 072 | Демо-данные для проверки сценариев | done | P2 | PR #77 / merge `8feff3b`; `prisma/seed.ts` + `prisma/seed/**`, 9 персонажей с фото, готовый матч и диалог на этапе 1, второй диалог на этапе 2. Идемпотентность и guard (`NODE_ENV=production`, нелокальный `DATABASE_URL`, база `yuni_test`) проверены вручную на scratch-базе. |
| 045 | Starters seed | done | P1 | PR #77 / merge `8feff3b`; закрыт тем же сидом, что и Task 072 — `seedConversationStarters` в `apps/backend/prisma/seed/starters.ts` наполняет `conversation_starters` четырьмя активными фразами. Тело коммита `08baab0` называет закрытие Task 045 явно. Отдельного теста нет: e2e-база `yuni_test` намеренно исключена guard-ом сида, поэтому clean-DB сценарий из acceptance остаётся непокрытым — зафиксировано на странице задачи. |
| 067a | Экспорт персональных данных пользователя | done | P1 | PR #80 / merge `42db25f`; `GET /users/me/export` под `JwtAccessGuard`, наполнен пустовавший `UsersModule`. Состав выгрузки — allowlist по `select`, определён построчным разбором всех полей `User` в `docs/tasks/067a-user-data-export.md`, включая исключённые с причиной. Сообщения собеседника не выгружаются (ст. 15(4) GDPR); `likesReceived`, `blockedByUsers`, `reportsReceived`, `notificationsActed` исключены целиком. Второй участник — всегда голый UUID. Rate limit 3/час user + 10/час ip. Проверено: юнит-тесты обходят дерево ответа на запрещённые ключи, e2e на реальном Postgres ловит утечку чужих сообщений (проверено ослаблением фильтра — тест падает). Инвентарь размечен колонкой «При удалении» как вход для 067b. |
| 069 | Профиль: режим просмотра и явное сохранение | done | P1 | PR #75 / merge `4d2f9be`; режим просмотра по умолчанию, редактирование в отдельной панели с липкой шапкой, dirty-состояние и предупреждение об уходе. Форма вынесена в `features/profile` и переиспользуется онбордингом. |
| 046 | Неатомарные write-пути | done | P1 | Часть 1 (регистрация) — PR #63. Оставшиеся три пути (`like → match`, `match → notifications`, `message → notification`) закрыты одним коммитом `806fd28` в PR #69 — фактически уже полгода назад; ROADMAP отставал, потому что PR/ветка называлась `fix/task-046-like-match-atomicity` и ни сам PR, ни последующие Task 054 sync-проходы (`4490ba2`) не заметили, что дифф `806fd28` заодно трогает `notifications.service.ts` и `chat.service.ts`, а не только `like → match`. Перепроверено по коду заново (Task 046 verify, 2026-08): `NotificationsService.createNotificationForRecipient` пишет только через переданный `client`; оба продакшен-вызова передают `tx` — `matches.service.ts:205` (ветка с внешним `tx` от `likes.service.ts`) и `:269` (собственная `$transaction`), `chat.service.ts:700` внутри той же `$transaction`, что и `tx.message.create`. Полный грep по `apps/backend/src` подтвердил: `notification.create` вызывается только из `notifications.service.ts`, третьего пути нет. Покрыто юнит-тестами, которые сверяют объект `client` с `tx`: `matches.service.spec.ts` — `creates a match when the new LIKE has a reciprocal active LIKE` и `uses a provided transaction client without opening or locking another transaction`; `chat.service.spec.ts` — `trims and sends a plain-text message in a transaction`. |
| 061 | Два флага видимости профиля | done | P2 | PR #82 / merge `5b4b9a9`; статус в ROADMAP остался `review` после мержа — поправлено при верификации Task 046. `discoverable` добавлен в `ProfileAccessResource` и в `targetProfileSelect` (`likes.service.ts`), закрыты оба пути — `GET /profiles/:handle` и лайк/скип. Схема и оба UI-переключателя не менялись; полная evidence — `docs-site/content/tasks/061.md`. |
| 076 | Jest во frontend + тесты чистой логики | done | P2 | PR #84 / merge `2b0d39d`; статус в ROADMAP остался `review` после мержа — тот же класс расхождения, что у Task 061, поправлено заодно с ним. Jest 29.7.0/ts-jest/@types/jest наравне с бэкендом, `pnpm --filter frontend test` в `quality-gates.yml`. Покрыты `features/profile/form-state.ts`, `lib/default-avatar.ts`, `lib/utils.ts`, `lib/auth-api.ts`, плюс `required-fields.contract.test.ts` на расхождение обязательных полей frontend/backend (Task 070). Полная evidence — `docs-site/content/tasks/076.md`. |
| 048 | Staged-chat contract alignment | done | P2 | Ветка `feat/task-048-chat-contract`, `bc6eb33`; PR не открыт — открывает владелец. Контракт (`senderUserId: string \| null`, `isSystemMessage`, `voiceDurationSec`, `messageWeight`), рендер (три случая вместо двух, `features/chat/message-render.ts`) и тесты (frontend + backend, включая pin формы `ChatMessageView`) сделаны. Визуальная проверка `chrome-devtools-mcp` пройдена 390×844 и 1280×900 на `demo@seed.yuni.local`: системное сообщение и голосовое рендерятся как задумано, список диалогов не путает системное с репликой собеседника, переполнения и новых ошибок консоли нет. Полная evidence, включая временную правку demo-БД для воспроизведения кейса «последнее сообщение — системное» (возвращена к исходному состоянию), — `docs-site/content/tasks/048.md`. |

## Отложено

Нет записей.

## Заменено

Нет записей.
