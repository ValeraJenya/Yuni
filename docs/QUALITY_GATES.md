# Quality Gates

Quality gates применяются по task spec. Не выдумывать команды: использовать только существующие scripts и текущие project commands.

## Git

- Проверить ветку и `git status`.
- Проверить expected changed files.
- Проверить expected staged files перед commit/PR.
- Не использовать `git add .` и `git add -A`.
- Не допускать случайные файлы, dumps, build artifacts, raw audit drafts.
- Выполнить `git diff --check`.

## Untracked files

- Результат `git ls-files --others --exclude-standard` должен сравниваться с явным allowlist в task spec.
- Untracked файл допустим только если task spec указывает точный путь и причину.
- Любой untracked файл вне allowlist является blocker до ручного объяснения или удаления.
- Raw audit draft не становится автоматически допустимым для всех задач: он должен быть прямо указан как pre-existing allowed file в конкретной task spec.

## Docs-only

Docs-only задача не обязана запускать backend/frontend tests, если task spec не требует этого.

Минимальные проверки для docs-only task:

```bash
git diff --check
git status --short
git diff --name-only
git ls-files --others --exclude-standard
```

## Backend

Использовать только если task затрагивает backend или task spec явно требует.

Доступные project commands:

```bash
corepack pnpm --filter backend test
corepack pnpm --filter backend build
corepack pnpm --filter backend lint
corepack pnpm check:backend
```

Для Prisma workflow использовать существующие scripts из `package.json`; не запускать migrations без task scope.

## Frontend

Использовать только если task затрагивает frontend или task spec явно требует.

Доступные project commands:

```bash
corepack pnpm check:frontend
corepack pnpm --dir apps/frontend lint
corepack pnpm --dir apps/frontend typecheck
corepack pnpm --dir apps/frontend build
```

## Docker/integration

Использовать только если task затрагивает Docker, local workflow или integration behavior.

Доступные project commands:

```bash
corepack pnpm docker:config
corepack pnpm docker:build
corepack pnpm docker:migrate
```

Destructive local reset commands требуют явного task scope.

## Security

Перед PR проверить:

- нет secrets, tokens, cookies, private keys;
- нет PII, real user photos, private messages, database dumps;
- нет internal storage data, local filesystem paths или raw Prisma rows в public API/docs;
- owner checks, rate limits, privacy, block/report behavior не ослаблены;
- media changes сохраняют safe filename, MIME/magic bytes, size limits and path traversal protection.

## Documentation

- `PROJECT_STATE.md` обновляется при изменении состояния проекта.
- `ROADMAP.md` обновляется при изменении task status, priority, dependencies или completed work.
- `AGENTS.md` обновляется или явно подтверждается, что workflow/quality gates/security/docs structure не изменились.
- Связанные architecture/security/API/onboarding docs обновляются, если меняется contract или behavior.