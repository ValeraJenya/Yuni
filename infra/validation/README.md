# Yuni validation PostgreSQL infrastructure

This directory defines the disposable PostgreSQL-only foundation for future Yuni runtime validation. It implements the preferred Docker option in [the DEC-005 draft](../../docs/audits/yuni-2026-09/08-VALIDATION-ENVIRONMENT.md). It does not authorize RV-01–RV-09, migrations, application startup, destructive database commands, or use of production, staging, development, or user data.

The stack is intentionally separate from ordinary Yuni Compose:

- Compose project: `yuni-validation`.
- Service: `validation-postgres` only; no frontend or backend service is defined.
- PostgreSQL: `postgres:16-alpine`.
- Database: `yuni_validation_test`.
- Host binding: `127.0.0.1:55432` to container port `5432`; host port `5432` is never used.
- Storage and network: `yuni-validation-postgres-data` and `yuni-validation-network`.

## Local validation input

In a dedicated validation worktree only, copy `.env.validation.example` to `.env.validation` and replace its synthetic password placeholder with a fresh synthetic validation-only value. Do not copy, source, or inherit the root `.env`. `.env.validation` is already ignored by the repository-wide `.env.*` rule and must remain untracked.

Set `VALIDATION_WORKTREE_ROOT` and `VALIDATION_MEDIA_ROOT` to canonical paths inside that dedicated worktree before any runtime work. The media root must be within `apps/backend/uploads`, must contain only synthetic files, and must not be a junction or symlink.

## Safe workflow

Each future command runs from the validation worktree and uses the explicit project name, env file, and Compose file below. Replace `$validationEnv` only with that worktree's untracked `infra/validation/.env.validation`.

```powershell
$validationEnv = 'infra/validation/.env.validation'
$validationCompose = 'infra/validation/compose.validation.yml'

# Preflight: this only validates inputs and exits non-zero on any mismatch.
.\infra\validation\guard.ps1 `
  -EnvFile $validationEnv `
  -ComposeFile $validationCompose `
  -ProjectName yuni-validation

# Inspect only; this does not create containers, volumes, or networks.
docker compose `
  --project-name yuni-validation `
  --env-file $validationEnv `
  -f $validationCompose config
```

After DEC-005, the relevant Owner Decisions, and a specific RV scope are approved, the future workflow is strictly:

1. **Preflight** — verify dedicated validation worktree and a clean Git state; confirm synthetic-only data, local-only providers, canonical validation media root, and no root `.env` input.
2. **Guard** — run `guard.ps1`; any failure is a STOP. Run it again immediately before a migration, reset/drop, cleanup, or another destructive action.
3. **Compose config** — run the read-only `docker compose ... config` command above and verify only `validation-postgres`, host binding `127.0.0.1:55432`, database `yuni_validation_test`, validation network, and validation volume appear.
4. **Start validation PostgreSQL** — only under the approved RV scope, repeat the guard, then run:

   ```powershell
   docker compose `
     --project-name yuni-validation `
     --env-file $validationEnv `
     -f $validationCompose up -d validation-postgres
   ```

5. **Health verification** — after another successful guard, use read-only Compose status/health inspection. Do not start backend or frontend unless the approved RV explicitly requires it.
6. **Validation only** — run only approved validation commands against the guarded `DATABASE_URL` and `TEST_DATABASE_URL`. Do not run a migration, Prisma command, test, DB command, or application process without separate authorization.
7. **Cleanup** — only after the approved work is reported and `guard.ps1` passes again, run:

   ```powershell
   docker compose `
     --project-name yuni-validation `
     --env-file $validationEnv `
     -f $validationCompose down -v
   ```

`down -v` must never be used without a fresh successful guard. It applies only to the explicitly named `yuni-validation` project; do not substitute another project name, use bare `docker compose`, or run broad Docker cleanup commands such as `docker system prune`.

## Guard behaviour

`guard.ps1` performs no Docker, PostgreSQL, Prisma, migration, test, reset, delete, or cleanup operation. It fails closed unless the following inputs agree:

- project name is `yuni-validation`;
- env markers are `yuni-audit-validation` and `disabled` for external providers;
- database name is exactly `yuni_validation_test`, contains `validation`, and both optional DB URLs resolve to it on host port `55432`;
- host binding value is exactly `55432`, never `5432`;
- the compose file exists, declares PostgreSQL 16 Alpine and the expected project name, binds only `127.0.0.1`, and has no reference to `yuni-postgres-1`, `yuni_postgres_data`, or the ordinary Yuni network;
- `DATABASE_URL` and `TEST_DATABASE_URL`, if set, are both set, point to the same target, and contain no production/staging target marker.

The guard checks input configuration; it does not grant authorization. Record its result, all future commands, working directory, redacted targets, SHA, exit codes, durations, artifacts, cleanup result, and any stop condition in the validation report.
