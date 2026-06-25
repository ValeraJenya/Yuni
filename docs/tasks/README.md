# Task System

## Правила

- Historical project steps 1-20 не переименовываются.
- Task 000 - bootstrap task для repository-first документации.
- Новые task specs после Task 000 используют постоянные IDs.
- IDs не меняются при изменении приоритета.
- Task status и priority - разные вещи.
- Dependencies и blockers обязательны для значимых задач.

## Роли

- Owner - человек, принимающий scope и merge decision.
- Executor - разработчик или AI, выполняющий задачу.
- Reviewer - независимый проверяющий по `docs/AI_REVIEW_PROTOCOL.md`.

## Параллельная работа

- Один executor ведёт не более одной implementation-задачи со статусом `in_progress`.
- Implementation и independent review могут идти параллельно.
- Две implementation-задачи могут идти параллельно только при непересекающихся modules, API contracts, Prisma/Docker scope.
- `PROJECT_STATE.md`, `ROADMAP.md` и `docs/audits/README.md` обновляются последовательно при финализации, а не одновременно в нескольких implementation branches.

## State updates

State documents обновляются последовательно перед merge или сразу после него:

- `PROJECT_STATE.md` - если изменилось фактическое состояние проекта.
- `ROADMAP.md` - если изменились task status, priority, dependencies или completed work.
- `docs/audits/README.md` - если появился reviewed audit или изменился finding status.

## Lightweight mode

См. `AGENTS.md`. Если задача затрагивает risk areas, использовать полный task spec.