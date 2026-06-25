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

| ID | Название | Статус | Priority | Зависимости | Notes |
| --- | --- | --- | --- | --- | --- |
| 000 | Project documentation foundation | review | P0 | none | Bootstrap documentation task. |

## Запланировано

| ID | Название | Статус | Priority | Зависимости | Notes |
| --- | --- | --- | --- | --- | --- |
| 021 | Profile completion lifecycle | research | P0 | Task 000 | Уточнить состояние completion, discoverability и обязательных полей. |
| 022 | Frontend media URL resolution | research | P1 | Task 000 | Проверить единый способ resolution backend media URLs на frontend. |
| 023 | Safe image processing and media lifecycle | idea | P1 | Task 000 | EXIF stripping, image sanitization, pending/private lifecycle. Step 20.2 / PR #23 / ca50baf уже создал profile photo storage boundary как основу. |
| 024 | Atomic block and match lifecycle | idea | P1 | Task 000 | Проверить consistency block/match/chat side effects. |
| 025 | Production deployment readiness | idea | P1 | Task 000 | Deployment architecture, secrets, HTTPS, reverse proxy. |
| 026 | PostgreSQL integration checks in CI | idea | P2 | Task 000 | CI checks with real PostgreSQL service where useful. |

## Выполнено

| ID | Название | Статус | Priority | Evidence |
| --- | --- | --- | --- | --- |
| Step 20.2 | Profile photo storage boundary | done | P0 | PR #23 / ca50baf |

## Отложено

Нет записей.

## Заменено

Нет записей.