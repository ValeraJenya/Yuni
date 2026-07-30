# Task 066 — Landing font, hero and design rules

## Статус

blocked

## Приоритет

P2

## Owner

Valer

## Executor

Codex

## Reviewer

Independent blind AI reviewer

## Создана

2026-07-28

## Последнее обновление

2026-07-28

## Проблема

Добавленный ранее `--font-display` не устранил неоднозначную цепочку font-token, а мобильная hero-секция использует чрезмерный минимальный размер заголовка, жёсткие цвета, accent-градиенты и неточный текст.

## Цель

Зафиксировать дизайн-правила, обеспечить явное разделение heading/body fonts и получить читаемую hero-секцию в viewport 390×844 с подтверждённой визуальной проверкой.

## Затрагиваемые модули

- `CLAUDE.md`;
- `AGENTS.md`;
- `apps/frontend/app/globals.css`;
- `apps/frontend/app/layout.tsx`;
- `apps/frontend/components/landing/hero.tsx`.

## Разрешённый scope

- design tokens и anti-slop правила;
- обязательный visual QA workflow;
- font variable wiring;
- текст и responsive layout hero-секции.

## Явно запрещённый scope

- auth, profiles, discovery, API, database, Docker, CI/CD, PII и product claims;
- редизайн остальных секций лендинга.

## Scope-check

Изменение изолировано на корневых design instructions и presentation-слое публичного лендинга. Оно не меняет данные, API, security/privacy behavior или пользовательские права. Owner подтвердил точный scope исходной постановкой 2026-07-28.

## План проверки

- `corepack pnpm --dir apps/frontend lint`;
- `corepack pnpm --dir apps/frontend typecheck`;
- `corepack pnpm --dir apps/frontend build`;
- `git diff --check`;
- `chrome-devtools-mcp`: viewport 390×844, `take_snapshot`, `take_screenshot`, `list_console_messages`;
- independent blind review по `docs/AI_REVIEW_PROTOCOL.md`.

## Definition of Done

- корневой `CLAUDE.md` содержит оба требуемых раздела;
- heading/body fonts связаны с `next/font` без неоднозначного промежуточного token;
- hero не переполняет мобильный viewport, использует semantic tokens и один solid accent;
- visual evidence и console result зафиксированы;
- применимые quality gates и blind review завершены.

## Документация для обновления

- `CLAUDE.md`;
- `AGENTS.md` — только ссылка на обязательные design/visual QA правила; общие workflow, security и Git rules не меняются;
- `PROJECT_STATE.md` и `ROADMAP.md` не обновляются: задача оформлена по полному процессу, но не меняет project capability/state, roadmap status, priority или dependencies.

## Evidence после выполнения

- `corepack pnpm --dir apps/frontend lint` — exit 0, 18 pre-existing warnings, 0 errors.
- `corepack pnpm --dir apps/frontend typecheck` — exit 0.
- `corepack pnpm --dir apps/frontend build` — exit 0.
- `git diff --check` — exit 0.
- Independent blind review: T066-02 исправлен; T066-01 остаётся verified до visual QA.
- Visual QA не выполнен: browser runtime падает до навигации с `windows sandbox: helper_unknown_error: setup refresh had errors`. Snapshot, screenshot и console evidence отсутствуют, поэтому задача не completed.

## История статуса

- 2026-07-28: created, scope-check confirmed by owner request, implementation started.
- 2026-07-28: blocked on browser visual QA; static checks passed; blind review T066-01 remains verified.
