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
|---|---|---|---|
| 027 | Этапный чат — схема и бэкенд | in_progress | Базовая реализация есть; остаются concurrency, voice-limit, starters и contract gaps |
| 053 | Critical real-DB/HTTP coverage | review | Real DB/HTTP e2e для Match → Block → Chat стабилизируются на CI; block-vs-match сценарий skip до Task 042 |

## Запланировано

| ID | Название | Статус | Priority | Зависимости | Notes |
| --- | --- | --- | --- | --- | --- |
| 022 | Frontend media URL resolution | research | P1 | Task 000 | Только profile page resolves relative uploads; Discovery, matches и messages используют URL как есть. |
| 023 | Safe image processing and media lifecycle | idea | P1 | Task 000 | EXIF/sanitization/moderation lifecycle; orphaned public file after delete выделен в Task 047. |
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
| 042 | Race condition блокировка vs match | idea | P1 | — | matches.service.ts проверяет блок вне транзакции до создания match; real-Postgres тест уже есть (skipped) в match-block-chat.e2e-spec.ts |
| 044 | Voice-limit bypass | idea | P1 | — | Лимит 90 сек обходится параллельными запросами |
| 045 | Starters seed | idea | P1 | — | conversation_starters таблица всегда пустая на чистой БД |
| 046 | Неатомарные write-пути | idea | P1 | — | register/like/match/message не атомарны с побочными эффектами |
| 047 | Удалённое фото остаётся доступным | idea | P1 | — | DB-запись удаляется раньше файла, ошибка проглатывается |
| 048 | Staged-chat contract alignment | idea | P2 | Task 027 | Nullable system sender расходится с frontend DTO; staged contract tests отсутствуют. |
| 049 | Fake healthcheck | idea | P2 | — | /health хардкод status ok без обращения к Postgres |
| 050 | Дополнительные мёртвые кнопки | idea | P2 | — | messages и profile — Like/More/Improve/Premium/Add interests |
| 052 | Переключатель языка неполон | idea | P2 | — | Не персистится, не обновляет html lang, разные instance провайдера |
| 054 | Дрейф документации | idea | P3 | — | Verified-baseline расходится с git-историей — процессный пункт |
| 055 | Database-доки отстали от миграций | idea | P3 | — | staged-chat и Task 021 не отражены |
| 056 | CI/DevOps проблемы | idea | P2 | — | Root-контейнеры, дефолтные креды, JWT плейсхолдеры, Hugo без PR-гейта |
| 057 | Privacy/Notification settings API | idea | P0 | — | PrivacySettings/NotificationSettings создаются в БД но API для их изменения нет |
| 060 | ParseUUIDPipe непоследователен | idea | P2 | — | Используется не во всех контроллерах |
| 061 | Два флага видимости профиля | idea | P2 | — | isDiscoverable и PrivacySettings.discoverable рассинхронизированы |
| 062 | Report не привязан к контенту | idea | P3 | — | Только к пользователю целиком, хотя схема поддерживает контент |
| 063 | Юридические страницы /terms /privacy /help | idea | P0 | — | Страницы 404, но регистрация требует согласия с ними |
| 064 | Невидимый текст в модалке фильтров Discovery | idea | P1 | — | CSS-баг, весь текст невидим |

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

## Отложено

Нет записей.

## Заменено

Нет записей.
