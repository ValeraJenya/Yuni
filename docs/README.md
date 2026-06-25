# Документация Yuni

Этот раздел хранит repository-first документацию проекта. Чаты и устные договорённости не заменяют документы и код.

## Порядок чтения

1. `AGENTS.md`
2. `docs/PROJECT_STATE.md`
3. `docs/ROADMAP.md`
4. Актуальная task spec из `docs/tasks/`
5. Связанные architecture/security/API/onboarding документы
6. Связанные ADR и audit findings

## Основные документы

- `PROJECT_STATE.md` - краткий проверенный снимок текущего состояния проекта.
- `ROADMAP.md` - единый список задач, приоритетов, статусов и зависимостей.
- `QUALITY_GATES.md` - practical checklist перед PR.
- `AI_REVIEW_PROTOCOL.md` - правила independent blind review.

## Папки

- `tasks/` - task specs. Новые задачи после Task 000 используют постоянные IDs.
- `decisions/` - ADR process и future decision records.
- `audits/` - audit index process и future reviewed audit findings.
- `architecture/` - текущие архитектурные карты и module boundaries.
- `api/` - текущий backend API contract.
- `security/` - security rules, data exposure rules and safety invariants.
- `onboarding/` - локальная разработка и workflow для новых участников.

Raw/unreviewed audit drafts не являются подтверждёнными findings и не должны использоваться как источник истины без commit, evidence и review.