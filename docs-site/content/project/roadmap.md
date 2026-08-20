---
title: "Roadmap"
weight: 20
---

Синхронизировано с `main` на commit `42db25f`, 2026-08-20. Последний merged PR — PR #80.

> Эта страница — ручная копия `docs/ROADMAP.md`. Скрипта синхронизации нет;
> при расхождении источником истины считается файл в `docs/`.

## Правила

- Task ID — постоянный идентификатор, а не порядок выполнения.
- Приоритет определяет порядок выполнения.
- Зависимость блокирует начало задачи.
- Status и priority — разные вещи.

**Status:** `idea` | `research` | `ready` | `in_progress` | `review` | `blocked` | `done` | `deferred` | `superseded`

**Priority:** `P0` | `P1` | `P2` | `P3`

## Сейчас

Открытых P0 нет. Продуктовые пробелы, найденные при ручной проверке сервиса 14 августа, закрыты целиком: 071 (PR #73), 030 (PR #74), 069 (PR #75), 070 (PR #76), 072 вместе с 045 (PR #77). Задача 067 разделена: 067a влит в PR #80, открыта только 067b.

Ближайший P1 — 074: после PR #78 главный CTA лендинга ушёл ниже сгиба.

| ID | Название | Статус | Комментарий |
|---|---|---|---|
| 027 | Этапный чат — схема и бэкенд | in_progress | Базовая реализация есть; starters (045) закрыт в PR #77, остаются contract gaps (048) и аудио (068) |
| 046 | Неатомарные write-пути | in_progress | Регистрация и like → match закрыты; остаются два пути уведомлений |
| 054 | Дрейф документации | in_progress | Четвёртый заход подряд; синхронизация на `42db25f` / PR #80 |

## Запланировано

| ID | Название | Статус | Priority | Зависимости | Notes |
|---|---|---|---|---|---|
| 023 | Safe image processing and media lifecycle | idea | P1 | Task 000 | EXIF/sanitization/moderation lifecycle; orphaned public file after delete выделен в Task 047 |
| 025 | Production deployment readiness | idea | P1 | Task 000 | Deployment architecture, secrets, HTTPS, reverse proxy |
| 026 | PostgreSQL integration checks in CI | idea | P2 | Task 000 | Postgres в CI уже поднимается, journey-покрытие закрыто (058 и 053 — `done`); остаётся политика покрытия для новых модулей |
| 027 | Этапный чат — схема и бэкенд | in_progress | P1 | Task 018 | Выделенные gaps 043, 044 и 045 закрыты; остаются 048 и 068 |
| 031 | Password reset backend | idea | P1 | — | Frontend мокает через setTimeout, backend endpoint отсутствует. TODO на `/terms` и `/help` |
| 032 | Landing vs реальность | idea | P1 | — | Заявлена ручная верификация и круглосуточная модерация, по факту `media.service.ts:111` ставит `approved` сразу при загрузке. TODO на `/privacy` |
| 033 | Email verification | idea | P1 | — | Не реализован, любой email принимается; `emailVerifiedAt` никогда не заполняется. TODO на `/privacy` |
| 035 | Gender/lookingFor свободный текст | idea | P1 | — | Нет единого контракта frontend/backend/БД |
| 036 | Dockerfile без USER directive | idea | P2 | — | Backend и frontend работают от root |
| 037 | packageManager не закреплён | idea | P2 | — | Версия pnpm не зафиксирована в package.json |
| 039 | Политика integration/e2e покрытия | idea | P3 | — | Обязательное покрытие критических сценариев |
| 040 | OAuth-кнопки декоративны | idea | P1 | — | Google/Apple без onClick, помечены Social placeholders |
| 046 | Неатомарные write-пути | in_progress | P1 | — | Регистрация закрыта в PR #63, like → match — в PR #69. Остаются match → notifications и message → notification. Outbox не нужен: уведомления — строки в той же БД |
| 048 | Staged-chat contract alignment | idea | P2 | Task 027 | Nullable system sender расходится с frontend DTO; staged contract tests отсутствуют |
| 050 | Дополнительные мёртвые кнопки | in_progress | P2 | — | Шапка диалога закрыта в PR #72, премиум-элементы — в PR #74. Остаётся «Добавить» в секции «Интересы»: `Interest`/`ProfileInterest` есть в схеме, но эндпоинтов нет |
| 054 | Дрейф документации | in_progress | P3 | — | Verified-baseline расходится с git-историей — процессный пункт. Четвёртый заход подряд: PR #33, PR #35, PR #67 и текущий |
| 055 | Database-доки отстали от миграций | idea | P3 | — | staged-chat и Task 021 не отражены |
| 056 | CI/DevOps проблемы | idea | P2 | — | Root-контейнеры, дефолтные креды, JWT плейсхолдеры, Hugo без PR-гейта |
| 061 | Два флага видимости профиля | idea | P2 | — | isDiscoverable и PrivacySettings.discoverable рассинхронизированы |
| 062 | Report не привязан к контенту | idea | P3 | — | Только к пользователю целиком, хотя схема поддерживает `conversationId`/`messageId`/`profilePhotoId`. TODO на `/terms` |
| 067b | Self-service удаление аккаунта | idea | P1 | Task 047, Task 067a | `DELETE /users/me` — soft delete с анонимизацией: `Message.sender` объявлен `onDelete: Cascade`, физическое удаление снесло бы переписку у собеседника. При soft delete ни один каскад не сработает сам. Расхождение со ст. 17 GDPR, ст. 21 152-ФЗ |
| 068 | Голосовые сообщения без аудио и без верификации длительности | idea | P2 | Task 027 | `voiceDurationSec` — число из DTO, которому бэкенд верит; загрузки аудиофайла в API нет вообще |
| 073 | UUID-валидация `cursor` в пагинации | idea | P2 | — | `cursor` без `@IsUUID()` в двух независимых DTO; P2023 утекает 500-м через query в пяти местах. Механизм тот же, что в Task 060, но через query, а не path |
| 074 | Главный CTA лендинга ниже сгиба | idea | P1 | — | Стек hero 986px при `min-h-[100svh]`: на 1280×800 кнопка «Познакомиться» целиком ниже сгиба, на 1280×900 обрезана на 6px. Причина — `justify-start` с сохранённым `pt-28` из `3a196a3` (PR #78). Возврат `justify-center` воспроизведёт исходный дефект |
| 075 | lint-baseline вырос с 17 до 18 | idea | P3 | Task 074 | `react-hooks/set-state-in-effect` в `landing/motion/in-view.tsx:43`, на ветке фолбэка IntersectionObserver. Механическое исправление сломает путь деградации — чинить ленивым начальным состоянием либо точечным `eslint-disable` с объяснением |

## Выполнено

| ID | Название | Статус | Priority | Evidence |
|---|---|---|---|---|
| 000 | Project documentation foundation | done | P0 | PR #24 / `6d3d399` |
| Step 20.2 | Profile photo storage boundary | done | P0 | PR #23 / `ca50baf` |
| 021 | Profile completion lifecycle | done | P0 | Branch commits `3abd405`–`852c67f`; checks и independent blind review пройдены |
| 024 | Atomic block and match lifecycle | done | P1 | PR #38 / merge `f027b0f`; read-path gap закрыт при верификации Task 053 |
| 043 | Race condition game-answer | done | P1 | PR #39 / merge `157fc46`; `game-race.e2e-spec.ts` стабильно зелёный на реальном Postgres |
| 058 | CI не может запустить e2e | done | P2 | PR #47 / merge `959c5d9`; Postgres service + backend `test:e2e` в quality-gates |
| 059 | Backend lint — это tsc --noEmit | done | P2 | PR #47 / merge `959c5d9`; backend ESLint отдельным шагом от typecheck |
| 065 | Нет CD-пайплайна для приложения | done | P2 | PR #48 / merge `6f26d01`; GHCR build/publish без environment deploy — это Task 025 |
| 053 | Critical real-DB/HTTP coverage | done | P2 | PR #49→#53; real-Postgres e2e для journey/game-race/voice-limit зелёные на CI |
| 057 | Privacy/Notification settings API | done | P0 | PR #55 → #57 (+ #58, фикс импорта JwtModule); `SettingsModule` с GET/PATCH `/settings/privacy` и `/settings/notifications` |
| 064 | Невидимый текст в модалке фильтров Discovery | done | P1 | PR #42 / merge `79233fc`; `FilterToggle` и `FilterSheet` на семантических токенах |
| 066 | Landing font, hero и design rules | done | P2 | PR #42 / merge `79233fc`; design tokens и anti-slop checklist в `CLAUDE.md` |
| 063 | Юридические страницы /terms /privacy /help | done | P0 | PR #60 / merge `a77bd90`; три статических роута на общем `LegalPage`, RU/EN. Тексты требуют вычитки юристом до публикации |
| 042 | Race condition блокировка vs match | done | P1 | PR #61 / merge `9556a3f`; `pg_advisory_xact_lock` по канонической паре пользователей, снят `skip` с block-vs-match |
| 044 | Voice-limit bypass | done | P1 | Исправлено попутно в PR #49 (коммит `96603a8`); `lockAndReloadConversation` берёт `SELECT ... FOR UPDATE`. Доверие к клиентскому `voiceDurationSec` вынесено в Task 068 |
| 047 | Удалённое фото остаётся доступным | done | P1 | PR #62 / merge `fb8684b`; файл удаляется до записи в БД, сбой проваливает запрос |
| 022 | Frontend media URL resolution | done | P1 | Основная часть — PR #41 / merge `0d6f51e`; модалка матча в discover — PR #64 / merge `ebf5173` |
| 049 | Fake healthcheck | done | P2 | PR #65 / merge `1142ff5`; `SELECT 1` через Prisma, `dependencies.database`, 503 при недоступной БД |
| 038 | Мёртвый demo-mode код | done | P2 | PR #66 / merge `fdd3fdc`; `DemoSessionProvider` и `DemoGate` удалены |
| 052 | Переключатель языка неполон | done | P2 | PR #68 / merge `55163e4`; один `LangProvider`, `localStorage`, синхронизация между вкладками |
| 071 | Маскоты вместо чужого фото в фолбэках | done | P2 | PR #73 / merge `90fe38a`; `defaultAvatarUrl(gender, variant)`, `/hero-portrait.jpg` больше не аватар ни на одном экране |
| 030 | Мёртвые кнопки в профиле | done | P1 | PR #74 / merge `8e1ec73`; `/settings/privacy` и `/settings/notifications` на API из Task 057, премиум удалён |
| 069 | Профиль: режим просмотра и явное сохранение | done | P1 | PR #75 / merge `4d2f9be`; форма вынесена в `features/profile` и переиспользуется онбордингом |
| 070 | Онбординг-анкета после регистрации | done | P1 | PR #76 / merge `2b0d847`; роут `/onboarding`, устранена гонка редиректов |
| 072 | Демо-данные для проверки сценариев | done | P2 | PR #77 / merge `8feff3b`; 9 анкет с фото, готовый матч, диалоги на этапах 1 и 2, guard против production/`yuni_test` |
| 045 | Starters seed | done | P1 | PR #77 / merge `8feff3b`; закрыт тем же сидом — `conversation_starters` наполняется четырьмя активными фразами. Автотеста на clean-DB сценарий нет |
| 060 | ParseUUIDPipe непоследователен | done | P2 | PR #79 / merge `38d3e5a`; пайп на обоих `@Param('photoId')`, новый `media-path-params.e2e-spec.ts`. Через query P2023 продолжает утекать — Task 073 |
| 067a | Экспорт персональных данных пользователя | done | P1 | PR #80 / merge `42db25f`; `GET /users/me/export`, allowlist по `select`, сообщения собеседника не выгружаются (ст. 15(4) GDPR). Кнопки в интерфейсе нет |

## Отложено

Нет записей.

## Заменено

Нет записей.
