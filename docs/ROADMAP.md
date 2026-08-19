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

Открытых P0 нет. Текущий приоритет — продуктовые пробелы, найденные при
ручной проверке сервиса 14 августа: 069 (редактирование профиля) закрыт
патчем и ждёт merge, следом 070 (онбординг), затем 067 (удаление аккаунта и
экспорт данных).

| ID | Название | Статус | Комментарий |
|---|---|---|---|
| 069 | Профиль: режим просмотра и явное сохранение | review | Патч готов, ждёт merge; разблокирует 070 |
| 027 | Этапный чат — схема и бэкенд | in_progress | Базовая реализация есть; остаются starters (045), contract gaps (048) и аудио (068) |
| 046 | Неатомарные write-пути | in_progress | Регистрация и like → match закрыты; остаются два пути уведомлений |

## Запланировано

| ID | Название | Статус | Priority | Зависимости | Notes |
| --- | --- | --- | --- | --- | --- |
| 023 | Safe image processing and media lifecycle | idea | P1 | Task 000 | EXIF/sanitization/moderation lifecycle; orphaned public file after delete выделен в Task 047. |
| 025 | Production deployment readiness | idea | P1 | Task 000 | Deployment architecture, secrets, HTTPS, reverse proxy. |
| 026 | PostgreSQL integration checks in CI | idea | P2 | Task 000 | Общий integration gate. Postgres в CI уже поднимается, а journey-покрытие закрыто (Task 058 и 053 — `done`); остаётся зафиксировать политику покрытия для новых модулей. |
| 027 | Этапный чат — схема и бэкенд | in_progress | P1 | Task 018 | Базовый backend реализован; открытые gaps вынесены в Task 043/044/045/048. |
| 031 | Password reset backend | idea | P1 | — | Frontend мокает через setTimeout, backend endpoint отсутствует. Зафиксировано как TODO на `/terms` и `/help` (Task 063) |
| 032 | Landing vs реальность | idea | P1 | — | Заявлена ручная верификация и круглосуточная модерация, по факту `media.service.ts:111` ставит `moderationStatus: approved` сразу при загрузке. Расхождение зафиксировано как TODO на `/privacy` (Task 063) |
| 033 | Email verification | idea | P1 | — | Не реализован, любой email принимается; `emailVerifiedAt` никогда не заполняется. Зафиксировано как TODO на `/privacy` (Task 063) |
| 035 | Gender/lookingFor свободный текст | idea | P1 | — | Нет единого контракта frontend/backend/БД |
| 036 | Dockerfile без USER directive | idea | P2 | — | Backend и frontend работают от root |
| 037 | packageManager не закреплён | idea | P2 | — | Версия pnpm не зафиксирована в package.json |
| 039 | Политика integration/e2e покрытия | idea | P3 | — | Обязательное покрытие критических сценариев |
| 040 | OAuth-кнопки декоративны | idea | P1 | — | Google/Apple без onClick, помечены Social placeholders |
| 045 | Starters seed | idea | P1 | — | conversation_starters таблица всегда пустая на чистой БД; подсказки для начала разговора не показываются. Зафиксировано как TODO на `/help` (Task 063) |
| 046 | Неатомарные write-пути | in_progress | P1 | — | Регистрация закрыта в PR #63, like → match — в PR #69. Остаются match → notifications и message → notification. Outbox не нужен: уведомления — строки в той же БД, чинится общей транзакцией с проброшенным `tx` |
| 048 | Staged-chat contract alignment | idea | P2 | Task 027 | Nullable system sender расходится с frontend DTO; staged contract tests отсутствуют. |
| 050 | Дополнительные мёртвые кнопки | in_progress | P2 | — | Шапка диалога закрыта в PR #72, «Улучшить» — в Task 069. Остаётся «Добавить» в секции «Интересы» профиля: сама фича интересов нигде не реализована, ни в схеме, ни в API |
| 054 | Дрейф документации | idea | P3 | — | Verified-baseline расходится с git-историей — процессный пункт |
| 055 | Database-доки отстали от миграций | idea | P3 | — | staged-chat и Task 021 не отражены |
| 056 | CI/DevOps проблемы | idea | P2 | — | Root-контейнеры, дефолтные креды, JWT плейсхолдеры, Hugo без PR-гейта |
| 060 | ParseUUIDPipe непоследователен | idea | P2 | — | Используется не во всех контроллерах |
| 061 | Два флага видимости профиля | idea | P2 | — | isDiscoverable и PrivacySettings.discoverable рассинхронизированы |
| 062 | Report не привязан к контенту | idea | P3 | — | Только к пользователю целиком, хотя схема поддерживает `conversationId`/`messageId`/`profilePhotoId`. Ограничение зафиксировано как TODO на `/terms` (Task 063) |
| 067 | Self-service удаление аккаунта и экспорт данных | idea | P1 | Task 047 | Эндпоинтов `DELETE /users/me` и экспорта не существует; `UserStatus.deleted`/`deletedAt` не используются. Расхождение со ст. 15 и 17 GDPR, ст. 14 и 21 152-ФЗ. Найдено при написании Task 063 |
| 068 | Голосовые сообщения без аудио и без верификации длительности | idea | P2 | Task 027 | `voiceDurationSec` — число из DTO, которому бэкенд верит; загрузки аудиофайла в API нет вообще. Спека Task 027 обещает backend-верификацию и физическую обрезку аудио — этого не существует. Выделено из Task 044, у которого исправлена только конкурентная часть |
| 069 | Профиль: режим просмотра и явное сохранение | review | P1 | — | Поля профиля всегда открыты на ввод, кнопка «Сохранить» — мелкий элемент в шапке секции далеко от них. Ничто не показывает несохранённое состояние, уход со страницы теряет введённое. Нужен режим просмотра по умолчанию, редактирование в отдельной панели, явные «Сохранить»/«Отмена» и предупреждение о несохранённых изменениях. Поглощает пункт #15 визуального аудита |
| 070 | Онбординг-анкета после регистрации | idea | P1 | Task 069 | После `/join` пользователя отправляет в `/discover`, где пусто: профиль не заполнен, в выдаче он не участвует. Нужна анкета сразу после регистрации со всеми полями, обязательные помечены звёздочкой. Переиспользует форму из Task 069 |
| 072 | Демо-данные для проверки сценариев | idea | P2 | — | Проверить продукт вручную нельзя: сидов нет, для матча нужно вручную регистрировать двух пользователей, заполнять оба профиля, грузить фото и лайкать крест-накрест. Нужен скрипт, создающий несколько анкет, готовый матч и диалог. Смежно с Task 045 (пустые `conversation_starters`) |

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
| 071 | Маскоты вместо чужого фото в фолбэках | done | P2 | PR #73 / merge `90fe38a`; `defaultAvatarUrl(gender, variant)` в `lib/default-avatar.ts`, `/hero-portrait.jpg` больше не используется как аватар ни на одном экране. Для незаполненного и нераспознанного `gender` — нейтральный SVG; свободный текст в поле (Task 035) поэтому попадает в нейтральный вариант. |
| 030 | Мёртвые кнопки в профиле | done | P1 | PR #74 / merge `8e1ec73`; экраны `/settings/privacy` и `/settings/notifications` на реальном API из Task 057, строки-переходы рендерятся ссылками. |

## Отложено

Нет записей.

## Заменено

Нет записей.
