---
title: "Процесс"
weight: 110
---


Исходник: `docs/QUALITY_GATES.md`. Quality gates применяются согласно task spec. Используются только существующие scripts и текущие project commands.

## Git

- Проверить ветку и `git status`
- Проверить expected changed files
- Проверить expected staged files перед commit/PR
- Не использовать `git add .` и `git add -A`
- Не допускать случайные файлы, dumps, build artifacts, raw audit drafts
- Выполнить `git diff --check`

## Untracked files

- Результат `git ls-files --others --exclude-standard` сравнивается с allowlist в task spec
- Untracked файл допустим только если task spec указывает точный путь и причину
- Любой untracked файл вне allowlist — blocker до ручного объяснения или удаления

## Docs-only задача

Не обязана запускать backend/frontend tests, если task spec не требует.

Минимальные проверки:

```bash
git diff --check
git status --short
git diff --name-only
git ls-files --others --exclude-standard
```

## Backend

Использовать только если task затрагивает backend или task spec явно требует.

```bash
corepack pnpm --filter backend test
corepack pnpm --filter backend build
corepack pnpm --filter backend lint
corepack pnpm check:backend
```

## Frontend

Использовать только если task затрагивает frontend или task spec явно требует.

```bash
corepack pnpm check:frontend
corepack pnpm --dir apps/frontend lint
corepack pnpm --dir apps/frontend typecheck
corepack pnpm --dir apps/frontend build
```

## Docker/integration

Использовать только если task затрагивает Docker, local workflow или integration behavior.

```bash
corepack pnpm docker:config
corepack pnpm docker:build
corepack pnpm docker:migrate
```

Destructive local reset commands требуют явного task scope.

## Security

Перед PR проверить:

- Нет secrets, tokens, cookies, private keys
- Нет PII, real user photos, private messages, database dumps
- Нет internal storage data, local filesystem paths или raw Prisma rows в public API/docs
- Owner checks, rate limits, privacy, block/report behavior не ослаблены
- Media changes сохраняют safe filename, MIME/magic bytes, size limits и path traversal protection

## Documentation

- `PROJECT_STATE.md` обновляется при изменении состояния проекта
- `ROADMAP.md` обновляется при изменении task status, priority, dependencies или completed work
- `AGENTS.md` обновляется или явно подтверждается неизменность workflow/quality gates/security/docs structure
- Связанные architecture/security/API/onboarding docs обновляются при изменении contract или behavior

## Полный check перед PR

```powershell
corepack pnpm install --frozen-lockfile
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yuni_ci?schema=public"
corepack pnpm check
```

Выполняет: backend Prisma validate/generate, backend tests, backend build/lint, frontend lint/typecheck/build.
