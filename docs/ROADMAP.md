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

| ID | Название | Статус | Комментарий |
| --- | --- | --- | --- |
| 024 | Atomic block and match lifecycle | in_progress | Матчевая часть реализована; закрытие Conversation остаётся |
| 027 | Этапный чат — схема и бэкенд | in_progress | Базовая реализация есть; остаются concurrency, voice-limit, starters и contract gaps |

## Запланировано

| ID | Название | Статус | Priority | Зависимости | Notes |
| --- | --- | --- | --- | --- | --- |
| 022 | Frontend media URL resolution | research | P1 | Task 000 | Только profile page resolves relative uploads; Discovery, matches и messages используют URL как есть. |
| 023 | Safe image processing and media lifecycle | idea | P1 | Task 000 | EXIF/sanitization/moderation lifecycle; orphaned public file after delete выделен в Task 047. |
| 024 | Atomic block and match lifecycle | in_progress | P1 | Task 000 | Матчевая часть реализована (PR #31). Conversation при блокировке не закрывается — остаётся scope задачи. |
| 025 | Production deployment readiness | idea | P1 | Task 000 | Deployment architecture, secrets, HTTPS, reverse proxy. |
| 026 | PostgreSQL integration checks in CI | idea | P2 | Task 000 | Общий integration gate; текущий workflow не поднимает Postgres (Task 058), journey coverage — Task 053. |
| 027 | Этапный чат — схема и бэкенд | in_progress | P1 | Task 018 | Базовый backend реализован; открытые gaps вынесены в Task 043/044/045/048. |
| 030 | Мёртвые кнопки в профиле | idea | P1 | — | Конфиденциальность/Уведомления/Настройки без обработчиков |
| 031 | Password reset backend | idea | P1 | — | Frontend мокает через setTimeout, backend endpoint отсутствует |
| 032 | Landing vs реальность | idea | P1 | — | Заявлена ручная верификация и круглосуточная модерация, по факту auto-approve |
| 033 | Email verification | idea | P1 | — | Не реализован, любой email принимается |
| 035 | Gender/lookingFor свободный текст | idea | P1 | — | Нет единого контракта frontend/backend/БД |
| 036 | Non-root Docker runtime | idea | P2 | — | Backend и frontend Dockerfile не задают `USER`. |
| 037 | Pin package manager | idea | P2 | — | Root `package.json` не фиксирует `packageManager`. |
| 038 | Resolve orphan demo mode | idea | P2 | — | DemoSessionProvider/DemoGate/mock profiles существуют, но не подключены; docs описывают demo mode как рабочий. |
| 039 | Critical integration/e2e policy | idea | P3 | Task 053 | Зафиксировать обязательное integration/e2e coverage для критических сценариев. |
| 040 | OAuth-кнопки декоративны | idea | P1 | — | Google/Apple без onClick, помечены Social placeholders |
| 042 | Race condition блокировка vs match | idea | P1 | — | matches.service.ts проверяет блок вне транзакции до создания match |
| 043 | Race condition game-answer | idea | P1 | — | Одновременные первые ответы могут не выставить completedAt |
| 044 | Voice-limit bypass | idea | P1 | — | Лимит 90 сек обходится параллельными запросами |
| 045 | Starters seed | idea | P1 | — | conversation_starters таблица всегда пустая на чистой БД |
| 046 | Неатомарные write-пути | idea | P1 | — | register/like/match/message не атомарны с побочными эффектами |
| 047 | Удалённое фото остаётся доступным | idea | P1 | — | DB-запись удаляется раньше файла, ошибка проглатывается |
| 048 | Staged-chat contract alignment | idea | P2 | Task 027 | Nullable system sender расходится с frontend DTO; staged contract tests отсутствуют. |
| 049 | Real database healthcheck | idea | P2 | — | `/health` всегда отвечает hardcoded `ok` без проверки PostgreSQL. |
| 050 | Remaining dead UI controls | idea | P2 | Task 030 | Messages/profile содержат дополнительные кнопки без действий. |
| 052 | Complete language switching | idea | P2 | — | Locale не сохраняется, не обновляет `html lang`, providers расходятся, часть текста hardcoded. |
| 053 | Critical real-DB/HTTP coverage | idea | P2 | Task 026, 058 | Реальное покрытие заканчивается на Discovery; Like→Match→Chat→Block не имеет end-to-end journey tests. |
| 054 | Verified-baseline drift prevention | idea | P3 | — | Ввести процесс, предотвращающий расхождение baseline/status docs с git history. |
| 055 | Database docs migration sync | idea | P3 | — | Database docs отстали от staged-chat migrations и Task 021. |
| 056 | CI/DevOps hardening | idea | P2 | — | Root containers, default Postgres/JWT values и Hugo без PR build gate. |
| 057 | Privacy/Notification settings API | idea | P0 | — | PrivacySettings/NotificationSettings создаются в БД но API для их изменения нет |
| 058 | PostgreSQL service for CI e2e | idea | P2 | Task 026 | Workflow не содержит `services: postgres` и физически не может запустить PostgreSQL e2e. |
| 059 | Real backend linting | idea | P2 | — | Backend `lint` запускает только `tsc --noEmit`; lint rules отсутствуют. |
| 060 | Consistent UUID parameter validation | idea | P2 | — | `ParseUUIDPipe` применяется непоследовательно между controllers. |
| 061 | Unified profile visibility state | idea | P2 | — | `isDiscoverable` и `PrivacySettings.discoverable` могут расходиться. |
| 062 | Content-linked reports | idea | P3 | — | Report API привязывает жалобу только к пользователю, хотя схема поддерживает content references. |
| 063 | Юридические страницы /terms /privacy /help | idea | P0 | — | Страницы 404, но регистрация требует согласия с ними |
| 064 | Невидимый текст в модалке фильтров Discovery | idea | P1 | — | CSS-баг, весь текст невидим |
| 065 | Application delivery pipeline | idea | P2 | Task 025 | Есть quality и Hugo deploy, но нет build/publish/deploy backend/frontend ни в одно окружение. |

## Выполнено

| ID | Название | Статус | Priority | Evidence |
| --- | --- | --- | --- | --- |
| 000 | Project documentation foundation | done | P0 | PR #24 / 6d3d399 |
| Step 20.2 | Profile photo storage boundary | done | P0 | PR #23 / ca50baf |
| 021 | Profile completion lifecycle | done | P0 | Branch commits `3abd405`–`852c67f`; checks and independent blind review passed. |

## Отложено

Нет записей.

## Заменено

Нет записей.
