# Task 000 - Project documentation foundation

## ID

000

## Название

Project documentation foundation

## Статус

done

## Приоритет

P0

## Owner

Valerii

## Executor

Codex

## Reviewer

Claude — independent blind review completed 2026-06-26; recheck: APPROVE

## Создана

2026-06-25

## Последнее обновление

2026-06-26

## Связанный audit finding / ADR / PR

None. Task 000 не формализует raw audit draft и не создаёт ADR.

## Проблема

Контекст теряется между чатами, AI-исполнителями и разработчиками. Из-за этого правила scope, review, quality gates и project state могут расходиться с фактическим состоянием репозитория.

## Цель

Создать repository-first documentation system, который задаёт вход в проект, task process, roadmap, quality gates, independent review protocol, ADR process и audit index process.

## Зависимости

- Owner подтвердил scope Task 000.
- Bootstrap-исключение разрешает создать правила до первого independent review.

## Блокирует

- Новые permanent task specs после Task 000.
- Регулярное independent blind review.
- Обновление project state и roadmap по единому процессу.

## Затрагиваемые модули

Documentation only.

## Разрешённый scope

Только 11 документов:

- `AGENTS.md`
- `docs/README.md`
- `docs/PROJECT_STATE.md`
- `docs/ROADMAP.md`
- `docs/QUALITY_GATES.md`
- `docs/AI_REVIEW_PROTOCOL.md`
- `docs/tasks/README.md`
- `docs/tasks/TEMPLATE.md`
- `docs/tasks/000-project-documentation-foundation.md`
- `docs/decisions/README.md`
- `docs/audits/README.md`

## Явно запрещённый scope

- code changes;
- Prisma schema/migrations;
- Docker;
- package files;
- API contract changes;
- frontend/backend behavior changes;
- формализация AUD-001;
- создание ADR-001;
- создание Task 021;
- чтение, изменение, staging или удаление raw audit draft.

## Факты

- Yuni - dating app monorepo.
- Последний известный merge в `main`: `ca50baf`, PR #23.
- PR #23 добавил `ProfilePhotoStorage` boundary для profile photos.
- Backend checks после merge PR #23: 17 suites passed, 166 tests passed; build passed; lint passed.

## Принятые решения

- Documentation source of truth живёт в репозитории.
- Task IDs постоянные и не зависят от порядка выполнения.
- Первый review после создания protocol должен быть blind.
- Lightweight mode разрешён только для isolated low-risk work.

## Открытые вопросы

- Практическая эффективность новой системы будет проверена на следующих задачах.
- Task 000 merged в `main` через PR #24 (`6d3d399`).

## Инварианты

- Source of truth не заменяется чатами.
- Docs не содержат secrets/PII.
- Планы не выдаются за реализацию.
- Bootstrap-исключение не создаёт прецедент обхода review.

## Security checks

- Не читать secrets, `.env`, cookies, tokens, database dumps, real user data.
- Не читать и не изменять raw audit draft.
- Не менять code, API, Prisma, Docker or package files.

## Scope-check

Task 000 ограничена документацией и создаёт только документы из разрешённого списка. Scope подтверждён owner-ом до создания обязательного process framework.

Allowed pre-existing untracked files:

- `docs/audits/2026-06-25-yuni-full-project-audit-draft.md` - pre-existing raw audit draft, запрещённый к чтению, изменению, staging и commit в рамках Task 000.

## Подтверждение scope-check

Кто подтвердил: Valerii, owner self-confirmation.
Дата: 2026-06-25.
Формат подтверждения: bootstrap-исключение; owner подтвердил scope Task 000 до начала работы, потому что сам process framework ещё не существовал.

## План реализации

1. Создать входные project docs.
2. Создать task system docs and template.
3. Создать independent review protocol.
4. Создать ADR and audit index process docs.
5. Проверить changed files and diff hygiene.

## План проверки

```bash
git diff --check
git status --short
git diff --name-only
git ls-files --others --exclude-standard
```

## Ручные проверки

- Созданы ровно 11 разрешённых документов.
- Нет изменений вне разрешённого списка.
- Raw audit draft не изменён и не staged.
- Allowlist для pre-existing untracked files содержит только `docs/audits/2026-06-25-yuni-full-project-audit-draft.md`; причина - raw audit draft, запрещённый к чтению, изменению, staging и commit в рамках Task 000.
- В staging добавлены только 11 разрешённых документов; raw audit draft исключён.
- Создан commit `d5c279a` с документационным фундаментом.
- Ветка `docs/project-documentation-foundation` запушена в `origin`.

## Definition of Done

- Все 11 документов созданы.
- Bootstrap-исключение явно описано.
- Full process и lightweight mode разделены.
- Independent blind review protocol описан.
- Validation commands выполнены.
- Independent blind review завершён; Task готова к PR и merge.
- Independent blind review завершён; findings закрыты либо явно отложены.
- PR создан, а итоговые merge evidence и status update внесены после слияния.

## Документация для обновления

Создаётся в рамках этой задачи:

- `AGENTS.md`
- `docs/README.md`
- `docs/PROJECT_STATE.md`
- `docs/ROADMAP.md`
- `docs/QUALITY_GATES.md`
- `docs/AI_REVIEW_PROTOCOL.md`
- `docs/tasks/README.md`
- `docs/tasks/TEMPLATE.md`
- `docs/decisions/README.md`
- `docs/audits/README.md`

## Evidence после выполнения

- Independent blind review Claude, 2026-06-26: VERDICT: APPROVE.
- Документационный фундамент merged в `main` через PR #24, merge commit `6d3d399`.
- Branch: `docs/project-documentation-foundation` pushed to `origin`.
- Claude recheck, 2026-06-26: VERDICT: APPROVE; F-001, F-003, F-004 и F-005 закрыты.
- Task 000 merged в `main` через PR #24 (`6d3d399`), 2026-06-26.
- Owner подтвердил, что `docs/audits/2026-06-25-yuni-full-project-audit-draft.md` уже существовал в working tree до создания ветки `docs/project-documentation-foundation`.
- Файл untracked, поэтому это подтверждение owner-а, а не Git history evidence.
- Файл не читался, не менялся, не staged и не commit в рамках Task 000.

## Не проверялось

- Практическая работа системы на нескольких будущих задачах.

## Known limitations

- Task 000 не создаёт task files для 021-026.
- Task 000 не создаёт ADR-001 или AUD-001.

## История статуса

- 2026-06-25: Task 000 создана как bootstrap task.
- 2026-06-25: документационный фундамент создан, ожидается independent review.
- 2026-06-26: независимый blind review Claude завершён с VERDICT: APPROVE.
- 2026-06-26: Claude recheck подтвердил закрытие F-001, F-003, F-004 и F-005.
- 2026-06-26: Task 000 merged в `main` через PR #24 (`6d3d399`); статус `done`.
