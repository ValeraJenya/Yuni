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
| 021 | Profile completion lifecycle | research | P0 | Task 000 | Уточнить состояние completion, discoverability и обязательных полей. |
| 022 | Frontend media URL resolution | research | P1 | Task 000 | Только profile page resolves relative uploads; Discovery, matches и messages используют URL как есть. |
| 023 | Safe image processing and media lifecycle | idea | P1 | Task 000 | EXIF/sanitization/moderation lifecycle; orphaned public file after delete выделен в Task 047. |
| 024 | Atomic block and match lifecycle | in_progress | P1 | Task 000 | PR #31 атомарно создаёт Block и закрывает active Match; Conversation не закрывается, а unblock восстанавливает доступ к старой переписке. |
| 025 | Production deployment readiness | idea | P1 | Task 000 | Deployment architecture, secrets, HTTPS, reverse proxy. |
| 026 | PostgreSQL integration checks in CI | idea | P2 | Task 000 | Общий integration gate; текущий workflow не поднимает Postgres (Task 058), journey coverage — Task 053. |
| 027 | Этапный чат — схема и бэкенд | in_progress | P1 | Task 018 | Базовый backend реализован; открытые gaps вынесены в Task 043/044/045/048. |
| 030 | Profile account/settings actions | idea | P1 | — | Privacy, notifications, settings/details и другие account actions на profile page не работают. |
| 031 | Password reset backend flow | idea | P1 | — | Forgot-password UI имитирует успех через `setTimeout`; backend flow отсутствует. |
| 032 | Honest verification/moderation claims | idea | P1 | Task 023, 033 | Landing обещает manual verification и 24/7 moderation, но photos auto-approve, email verification отсутствует. |
| 033 | Email verification | idea | P1 | — | Регистрация принимает произвольный email; verification lifecycle отсутствует. |
| 035 | Canonical gender/lookingFor values | idea | P1 | — | Backend хранит free text, frontend ожидает ограниченный enum-like набор. |
| 036 | Non-root Docker runtime | idea | P2 | — | Backend и frontend Dockerfile не задают `USER`. |
| 037 | Pin package manager | idea | P2 | — | Root `package.json` не фиксирует `packageManager`. |
| 038 | Resolve orphan demo mode | idea | P2 | — | DemoSessionProvider/DemoGate/mock profiles существуют, но не подключены; docs описывают demo mode как рабочий. |
| 039 | Critical integration/e2e policy | idea | P3 | Task 053 | Зафиксировать обязательное integration/e2e coverage для критических сценариев. |
| 040 | Google/Apple OAuth controls | idea | P1 | — | Кнопки Google/Apple декоративны: handlers и backend OAuth отсутствуют. |
| 042 | Atomic block-check and match creation | idea | P1 | — | Между block check и созданием match возможна гонка. |
| 043 | Atomic staged-game completion | idea | P1 | Task 027 | Concurrent first answers могут не выставить `ChatGame.completedAt`. |
| 044 | Concurrency-safe voice limits | idea | P1 | Task 027 | Параллельные sends обходят 90 сек; нет server-verified audio duration/trimming. |
| 045 | Conversation starter seed | idea | P1 | Task 027 | `conversation_starters` не наполняется; clean DB возвращает пустой список. |
| 046 | Atomic critical write paths | idea | P1 | — | Register/like/match/message не атомарны со всеми зависимыми side effects. |
| 047 | Reliable profile-photo deletion | idea | P1 | Task 023 | DB row удаляется раньше файла; storage error подавляется, а static serving не сверяется с БД. |
| 048 | Staged-chat contract alignment | idea | P2 | Task 027 | Nullable system sender расходится с frontend DTO; staged contract tests отсутствуют. |
| 049 | Real database healthcheck | idea | P2 | — | `/health` всегда отвечает hardcoded `ok` без проверки PostgreSQL. |
| 050 | Remaining dead UI controls | idea | P2 | Task 030 | Messages/profile содержат дополнительные кнопки без действий. |
| 052 | Complete language switching | idea | P2 | — | Locale не сохраняется, не обновляет `html lang`, providers расходятся, часть текста hardcoded. |
| 053 | Critical real-DB/HTTP coverage | idea | P2 | Task 026, 058 | Реальное покрытие заканчивается на Discovery; Like→Match→Chat→Block не имеет end-to-end journey tests. |
| 054 | Verified-baseline drift prevention | idea | P3 | — | Ввести процесс, предотвращающий расхождение baseline/status docs с git history. |
| 055 | Database docs migration sync | idea | P3 | — | Database docs отстали от staged-chat migrations и Task 021. |
| 056 | CI/DevOps hardening | idea | P2 | — | Root containers, default Postgres/JWT values и Hugo без PR build gate. |
| 057 | Privacy and notification settings API | idea | P0 | — | UI настроек существует без backend API и persistence. |
| 058 | PostgreSQL service for CI e2e | idea | P2 | Task 026 | Workflow не содержит `services: postgres` и физически не может запустить PostgreSQL e2e. |
| 059 | Real backend linting | idea | P2 | — | Backend `lint` запускает только `tsc --noEmit`; lint rules отсутствуют. |
| 060 | Consistent UUID parameter validation | idea | P2 | — | `ParseUUIDPipe` применяется непоследовательно между controllers. |
| 061 | Unified profile visibility state | idea | P2 | — | `isDiscoverable` и `PrivacySettings.discoverable` могут расходиться. |
| 062 | Content-linked reports | idea | P3 | — | Report API привязывает жалобу только к пользователю, хотя схема поддерживает content references. |
| 063 | Required legal and help pages | idea | P0 | — | `/terms`, `/privacy` и `/help` возвращают 404, хотя регистрация требует согласия. |
| 064 | Discovery filter modal contrast | idea | P1 | — | Текст в filter modal визуально сливается с фоном из-за CSS. |
| 065 | Application delivery pipeline | idea | P2 | Task 025 | Есть quality и Hugo deploy, но нет build/publish/deploy backend/frontend ни в одно окружение. |

## Выполнено

| ID | Название | Статус | Priority | Evidence |
| --- | --- | --- | --- | --- |
| 000 | Project documentation foundation | done | P0 | PR #24 / 6d3d399 |
| Step 20.2 | Profile photo storage boundary | done | P0 | PR #23 / ca50baf |

## Отложено

Нет записей.

## Заменено

Нет записей.
