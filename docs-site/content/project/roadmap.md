---
title: "Roadmap"
weight: 20
---

## Правила

- Task ID — постоянный идентификатор, а не порядок выполнения.
- Приоритет определяет порядок выполнения.
- Зависимость блокирует начало задачи.
- Status и priority — разные вещи.

**Status:** `idea` | `research` | `ready` | `in_progress` | `review` | `blocked` | `done` | `deferred` | `superseded`

**Priority:** `P0` | `P1` | `P2` | `P3`

## Сейчас

| ID | Название | Статус | Комментарий |
|---|---|---|---|
| 024 | Atomic block and match lifecycle | review | Conversation теперь закрывается атомарно вместе с Match; ждёт прогона тестов и мержа |
| 027 | Этапный чат — схема и бэкенд | in_progress | Базовая реализация есть; остаются concurrency, voice-limit, starters и contract gaps |

## Запланировано

| ID | Название | Статус | Priority | Зависимости | Notes |
|---|---|---|---|---|---|
| 022 | Frontend media URL resolution | research | P1 | Task 000 | Только profile page resolves relative uploads; Discovery, matches и messages используют URL как есть. |
| 023 | Safe image processing and media lifecycle | idea | P1 | Task 000 | EXIF/sanitization/moderation lifecycle; orphaned public file after delete выделен в Task 047. |
| 024 | Atomic block and match lifecycle | review | P1 | Task 000 | Матчевая часть — PR #31. Conversation теперь закрывается атомарно в той же транзакции — код готов, ждёт прогона тестов и мержа. |
| 025 | Production deployment readiness | idea | P1 | Task 000 | Deployment architecture, secrets, HTTPS, reverse proxy. |
| 026 | PostgreSQL integration checks in CI | idea | P2 | Task 000 | Общий integration gate; текущий workflow не поднимает Postgres (Task 058), journey coverage — Task 053. |
| 027 | Этапный чат — схема и бэкенд | in_progress | P1 | Task 018 | Базовый backend реализован; открытые gaps вынесены в Task 043/044/045/048. |
| 030 | Мёртвые кнопки в профиле | idea | P1 | — | Конфиденциальность/Уведомления/Настройки без обработчиков |
| 031 | Password reset backend | idea | P1 | — | Frontend мокает через setTimeout, backend endpoint отсутствует |
| 032 | Landing vs реальность | idea | P1 | — | Заявлена ручная верификация и круглосуточная модерация, по факту auto-approve |
| 033 | Email verification | idea | P1 | — | Не реализован, любой email принимается |
| 035 | Gender/lookingFor свободный текст | idea | P1 | — | Нет единого контракта frontend/backend/БД |
| 036 | Dockerfile без USER directive | idea | P2 | — | Backend и frontend работают от root |
| 037 | packageManager не закреплён | idea | P2 | — | Версия pnpm не зафиксирована в package.json |
| 038 | Мёртвый demo-mode код | idea | P2 | — | DemoSessionProvider/DemoGate существуют но нигде не подключены |
| 039 | Политика integration/e2e покрытия | idea | P3 | — | Обязательное покрытие критических сценариев |
| 040 | OAuth-кнопки декоративны | idea | P1 | — | Google/Apple без onClick, помечены Social placeholders |
| 042 | Race condition блокировка vs match | idea | P1 | — | matches.service.ts проверяет блок вне транзакции до создания match |
| 043 | Race condition game-answer | review | P1 | — | SELECT FOR UPDATE сериализует завершение; доказано race-тестом на реальном Postgres |
| 044 | Voice-limit bypass | idea | P1 | — | Лимит 90 сек обходится параллельными запросами |
| 045 | Starters seed | idea | P1 | — | conversation_starters таблица всегда пустая на чистой БД |
| 046 | Неатомарные write-пути | idea | P1 | — | register/like/match/message не атомарны с побочными эффектами |
| 047 | Удалённое фото остаётся доступным | idea | P1 | — | DB-запись удаляется раньше файла, ошибка проглатывается |
| 048 | Staged-chat contract alignment | idea | P2 | Task 027 | Nullable system sender расходится с frontend DTO; staged contract tests отсутствуют. |
| 049 | Fake healthcheck | idea | P2 | — | /health хардкод status ok без обращения к Postgres |
| 050 | Дополнительные мёртвые кнопки | idea | P2 | — | messages и profile — Like/More/Improve/Premium/Add interests |
| 052 | Переключатель языка неполон | idea | P2 | — | Не персистится, не обновляет html lang, разные instance провайдера |
| 053 | Critical real-DB/HTTP coverage | idea | P2 | — | Реальное покрытие заканчивается на Discovery; Like→Match→Chat→Block не имеет end-to-end journey tests |
| 054 | Дрейф документации | idea | P3 | — | Verified-baseline расходится с git-историей — процессный пункт |
| 055 | Database-доки отстали от миграций | idea | P3 | — | staged-chat и Task 021 не отражены |
| 056 | CI/DevOps проблемы | idea | P2 | — | Root-контейнеры, дефолтные креды, JWT плейсхолдеры, Hugo без PR-гейта |
| 057 | Privacy/Notification settings API | idea | P0 | — | PrivacySettings/NotificationSettings создаются в БД но API для их изменения нет |
| 058 | CI не может запустить e2e | idea | P2 | — | В workflow нет services блока с Postgres |
| 059 | Backend lint — это tsc --noEmit | idea | P2 | — | Реального линтера нет |
| 060 | ParseUUIDPipe непоследователен | idea | P2 | — | Используется не во всех контроллерах |
| 061 | Два флага видимости профиля | idea | P2 | — | isDiscoverable и PrivacySettings.discoverable рассинхронизированы |
| 062 | Report не привязан к контенту | idea | P3 | — | Только к пользователю целиком, хотя схема поддерживает контент |
| 063 | Юридические страницы /terms /privacy /help | idea | P0 | — | Страницы 404, но регистрация требует согласия с ними |
| 064 | Невидимый текст в модалке фильтров Discovery | idea | P1 | — | CSS-баг, весь текст невидим |
| 065 | Нет CD-пайплайна для приложения | idea | P2 | — | Только docs-site деплоится, backend/frontend — нет |

## Выполнено

| ID | Название | Статус | Priority | Evidence |
|---|---|---|---|---|
| 000 | Project documentation foundation | done | P0 | PR #24 / 6d3d399 |
| Step 20.2 | Profile photo storage boundary | done | P0 | PR #23 / ca50baf |
| 021 | Profile completion lifecycle | done | P0 | Branch commits `3abd405`–`852c67f`; checks and independent blind review passed. |

## Отложено

Нет записей.

## Заменено

Нет записей.
