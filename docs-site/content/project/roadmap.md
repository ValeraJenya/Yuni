---
title: "Roadmap"
weight: 20
---


## Правила

- Task ID — постоянный идентификатор, не порядок выполнения
- Приоритет определяет порядок выполнения
- Зависимость блокирует начало задачи

**Status:** `idea` | `research` | `ready` | `in_progress` | `review` | `blocked` | `done` | `deferred` | `superseded`

**Priority:** `P0` | `P1` | `P2` | `P3`

## Сейчас

| ID | Название | Статус | Комментарий |
|---|---|---|---|
| 024 | Atomic block and match lifecycle | in_progress | Матчевая часть реализована; закрытие Conversation остаётся |
| 027 | Этапный чат — схема и бэкенд | in_progress | Базовая реализация есть; остаются concurrency, voice-limit, starters и contract gaps |

## Запланировано

| ID | Название | Статус | Priority | Зависимости | Notes |
|---|---|---|---|---|---|
| 021 | Profile completion lifecycle | research | P0 | Task 000 | Уточнить состояние completion, discoverability и обязательных полей |
| 022 | Frontend media URL resolution | research | P1 | Task 000 | Проверить единый способ resolution backend media URLs на frontend |
| 023 | Safe image processing and media lifecycle | idea | P1 | Task 000 | EXIF stripping, image sanitization, pending/private lifecycle |
| 024 | Atomic block and match lifecycle | in_progress | P1 | Task 000 | PR #31 атомарно создаёт Block и закрывает active Match; Conversation не закрывается, а unblock восстанавливает доступ к старой переписке |
| 025 | Production deployment readiness | idea | P1 | Task 000 | Deployment architecture, secrets, HTTPS, reverse proxy |
| 026 | PostgreSQL integration checks in CI | idea | P2 | Task 000 | CI checks with real PostgreSQL service |
| 027 | Этапный чат — схема и бэкенд | in_progress | P1 | Task 018 | Базовый backend реализован; открытые gaps вынесены в Task 043/044/045/048 |

## Выполнено

| ID | Название | Статус | Priority | Evidence |
|---|---|---|---|---|
| 000 | Project documentation foundation | done | P0 | PR #24 / 6d3d399 |
| Step 20.2 | Profile photo storage boundary | done | P0 | PR #23 / ca50baf |

## Отложено

Нет записей.

## Заменено

Нет записей.
