# Yuni — Validation Environment Decision Draft

## 1. Purpose and status

This document is the technical decision draft for **DEC-005** from [Wave 1 Followups](07-WAVE-1-FOLLOWUPS.md). It defines a disposable environment for future runtime validation of RV-01–RV-09. It does not approve a validation run, change the status of DEC-005, or authorize migrations, resets, Docker, PostgreSQL, tests, or application startup.

Status: **Draft / Pending owner decision**. The owners must still approve DEC-005, a specific validation scope, and each destructive operation.

The design applies to code commit `fed276a97fd84f29032c5eac1b11447bb1f3ed4c` or to an explicitly named remediation commit. The future validation report must record its actual SHA; evidence cannot be transferred automatically between commits.

## 2. Non-negotiable safety contract

- Use synthetic users, messages, photos, credentials, keys, and fixtures only. Never read or import production, staging, local working, or user data.
- Run only from a dedicated validation worktree. Do not run runtime validation from the shared checkout.
- Use a database whose name contains `audit` or `validation`; the proposed name is `yuni_validation_test`. It also satisfies the existing e2e suffix guard (`_test`).
- Provide all validation values explicitly through a separate, untracked validation environment file or process environment. The normal root `.env` must not be loaded, copied, inherited implicitly, or used as a credential source.
- Use a separate temporary media directory inside the validation worktree, such as `<validation-worktree>/apps/backend/uploads`. It must contain synthetic files only and must not be a junction, symlink, or path outside that worktree.
- Disable external providers by absence of their credentials and by an explicit local-only allowlist. Any configured HTTP endpoint, queue, mail, object store, webhook, analytics, or similar provider must be disabled or replaced by a local mock before startup. If its behavior cannot be shown local-only, STOP.
- `DATABASE_URL` and `TEST_DATABASE_URL` must both resolve to the same verified validation database for DB/e2e work. The existing e2e setup falls back from `TEST_DATABASE_URL` to `DATABASE_URL`, sets `NODE_ENV=test`, and runs `prisma migrate deploy`; the explicit pair avoids an accidental fallback.
- `prisma migrate deploy`, seed, reset, drop, volume removal, and media cleanup are allowed only after the fail-safe gate in §4 succeeds. `prisma migrate dev` is never part of validation.
- Every command, its working directory, relevant redacted environment-variable names, SHA, exit code, duration, generated artifacts, cleanup result, and stop condition must be recorded in the future validation report. Do not record values of secrets, URLs containing credentials, cookies, or synthetic tokens.

`AGENTS.md` is not changed: this document applies the existing read-only and destructive-command rules to a future separately authorized environment; it does not introduce a project-wide workflow change.

## 3. Required validation variables

The validation env file is a local, untracked input and is not a copy of `.env`. It must use safe synthetic placeholders, restrictive local endpoints, and the names below.

| Variable | Required value / guard |
| --- | --- |
| `NODE_ENV` | `test` for e2e/runtime validation. |
| `DATABASE_URL` | Explicit PostgreSQL URL for `yuni_validation_test`; never inherited from root `.env`. |
| `TEST_DATABASE_URL` | The same validation target as `DATABASE_URL`; checked before e2e setup. |
| `VALIDATION_ENVIRONMENT` | Exact marker `yuni-audit-validation`; commands must require it. |
| `VALIDATION_DATABASE_NAME` | Exact database name `yuni_validation_test`; checked against parsed URL. |
| `VALIDATION_WORKTREE_ROOT` | Canonical absolute path of the dedicated validation worktree. |
| `VALIDATION_MEDIA_ROOT` | Canonical path below `VALIDATION_WORKTREE_ROOT`, used only for synthetic uploads. |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Fresh synthetic values supplied only to the validation process; never logged. |
| `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` | Local-only validation origin(s). |
| `VALIDATION_EXTERNAL_PROVIDERS` | Exact marker `disabled`; a provider presence check must fail closed. |

The existing root `.env.example` and `docker-compose.yml` default to ordinary local names and ports. They are not sufficient validation inputs: Compose defaults to database `yuni`, the root template uses `DATABASE_URL` for `yuni`, and the backend default ConfigModule does not load the root `.env` when invoked from `apps/backend`. Validation must therefore pass its own env file explicitly and must not rely on defaults.

## 4. Common preflight and database-name guard

Before every validation command, the runtime agent must perform and record this fail-safe gate. A failed or incomplete check is a STOP, not a warning.

1. Confirm a dedicated validation worktree: canonical current root equals `VALIDATION_WORKTREE_ROOT`; it is not the shared checkout; `git status --porcelain=v1` is clean before the run except for the agreed report location.
2. Confirm `VALIDATION_ENVIRONMENT=yuni-audit-validation` and `VALIDATION_EXTERNAL_PROVIDERS=disabled` are explicitly present in the launched process.
3. Parse `DATABASE_URL` and `TEST_DATABASE_URL` without logging credentials. Require PostgreSQL protocol, equality of host/port/database between the two, database name exactly `yuni_validation_test`, and no production/staging hostname allowlisted by the validation owner.
4. Confirm the database name contains `validation` and ends in `_test`; reject all other names, including `yuni`, `postgres`, an empty name, and values inferred from shell defaults.
5. Canonicalize `VALIDATION_MEDIA_ROOT`; require it below the validation worktree's `apps/backend/uploads` path, require no junction/symlink escape, and require an empty or already verified synthetic-only directory.
6. Confirm provider configuration is local-only or disabled. Missing proof is STOP.
7. Record the preflight result in the validation report before any migration, HTTP listener, DB write, media write, reset, or cleanup.

Only this gate may enable destructive commands. It does not itself authorize them: the approved RV scope must name the operation and its targets. A command must refuse to run if any gate value is absent or mismatched.

## 5. Option A — Preferred: isolated Docker PostgreSQL

Use Docker Compose with a dedicated project name and an explicit validation env file. Prefer a PostgreSQL-only stack first; start backend/frontend only when the approved RV needs an HTTP or browser boundary. The existing Compose file has a persistent named volume and a backend bind mount to `./apps/backend/uploads`; using it directly from the validation worktree makes those paths worktree-local, but the future execution plan must still use a validation-specific Compose invocation or overlay that names the validation volume and validates the media path.

| Area | Design |
| --- | --- |
| Prerequisites | Docker daemon is reachable; separate validation worktree is clean; validation env file passes §4; approved RV and destructive scope exist; no host production/staging connection is permitted. |
| Isolation guarantees | Unique Compose project name, proposed `yuni-audit-validation`; database `yuni_validation_test`; unique named volume derived from that project; network scoped to that project; media bind mount under the validation worktree; synthetic-only credentials and data. |
| Environment variables | All §3 variables, plus Compose-specific `POSTGRES_DB=yuni_validation_test`, synthetic `POSTGRES_USER`/`POSTGRES_PASSWORD`, a non-conflicting validation-only port, and `COMPOSE_PROJECT_NAME=yuni-audit-validation` passed explicitly rather than inherited. |
| Allowed commands after §4 | Read-only `docker compose config --quiet`; start only the approved services with explicit `--project-name` and `--env-file`; `prisma migrate deploy` only against the verified validation URL; approved RV command; read-only inspection and synthetic cleanup. Exact commands are chosen and recorded in the validation report. |
| Prohibited commands | Bare `docker compose up/down`; commands using root `.env`; `docker system prune`; unrelated project/volume removal; `prisma migrate dev`; unguarded reset/drop; publishing images; external network calls; host-path media mounts outside the validation worktree. |
| Database-name guard | Parse both DB URLs before Compose and before Prisma; require `yuni_validation_test`. Use `docker compose config --quiet` to validate interpolation and rely on static guard checks for the expected `POSTGRES_DB` without printing secret values. |
| Media/storage isolation | Use only the worktree-local `apps/backend/uploads` or a validation-specific local mount below it. Never mount the shared checkout's uploads directory. Before cleanup verify canonical path and synthetic-only inventory. |
| Cleanup | After the report captures results, stop the validation project, remove only its named volume and validation media directory after repeating §4, then confirm no containers, volume, database objects, or synthetic media remain. If the guard fails, retain artifacts and report the blocker rather than deleting. |
| Risks | Docker daemon/desktop availability; Compose defaults are unsafe without explicit env/project name; backend/frontend startup can create artifacts; mounted media and persistent volumes require exact targeting. |

### Current availability

#### Port preflight update

Runtime preflight rejected host port `55432`: Windows reserves TCP ports `55372–55471`. Port `56032` was checked with `Get-NetTCPConnection` and `netstat` and is free. The validation infrastructure therefore uses `127.0.0.1:56032` for the host endpoint and retains PostgreSQL container port `5432`.

#### Host connectivity preflight

The validation PostgreSQL container was healthy and `HostConfig` contained the mapping `127.0.0.1:56032 -> 5432`. However, `NetworkSettings.Ports` reported `{"5432/tcp":[]}`, the validation network had `Internal=true`, and `Test-NetConnection 127.0.0.1:56032` returned `False`. The internal network is therefore incompatible with host-driven validation: the Windows-host runner must reach PostgreSQL only through the loopback binding. The implementation removes `internal:true` while retaining the dedicated named bridge network, volume, project, database, and loopback port restriction.

The initial baseline recorded Docker Desktop as unavailable. The later runtime preflight above is separate evidence collected after Docker became available; no migration, test, or production service operation is implied by this decision draft.
## 6. Option B — Fallback: local PostgreSQL audit database

Use a separately provisioned local PostgreSQL instance or database only when it can meet the same §4 gate. It is a fallback for a currently unavailable Docker daemon, not permission to use any already-running local database.

| Area | Design |
| --- | --- |
| Prerequisites | Local PostgreSQL endpoint is explicitly identified by the owner; its database is exactly `yuni_validation_test`; a dedicated validation role/credentials and validation worktree exist; validation env passes §4; the approved RV names migrations and writes. |
| Isolation guarantees | Separate database and preferably a dedicated local role; no shared application database; explicit URL in validation env; synthetic-only fixtures; worktree-local media directory; external providers disabled/mocked/local-only. A database-name suffix alone is insufficient. |
| Environment variables | All §3 variables. `DATABASE_URL` and `TEST_DATABASE_URL` are explicit local validation URLs and must name the same `yuni_validation_test` target. No root `.env`, shell fallback, or ordinary local `yuni` URL is allowed. |
| Allowed commands after §4 | Read-only local connectivity/version check; approved `prisma migrate deploy`; approved e2e/RV command; guarded reset/drop only when its exact validation database is parsed and matched; safe synthetic media cleanup. Every command is reported. |
| Prohibited commands | Connecting to an unverified localhost database; `prisma migrate dev`; unguarded `prisma migrate reset`; broad server/database cleanup; use of a shared PostgreSQL superuser without owner approval; importing dumps; external providers or real assets. |
| Database-name guard | The command wrapper must parse the URL itself and reject unless both URL variables and `VALIDATION_DATABASE_NAME` equal `yuni_validation_test`. Before reset/drop, query only the target connection for its current database name and repeat the guard. |
| Media/storage isolation | Same as Option A: temporary directory below the validation worktree, canonicalized before writes and cleanup. The local database option never permits a shared `apps/backend/uploads` path. |
| Cleanup | Delete only synthetic rows via the approved reset/drop path after the repeated guard; then remove the validation media directory. Confirm the target database is empty or dropped, according to the approved scope, and record the outcome. Preserve artifacts if cleanup verification fails. |
| Risks | A local server can expose similarly named databases or privileged roles; URL/env fallback is easier to misconfigure; responsibility for isolation, lifecycle, and credential rotation stays with the owner. |

## 7. Destructive-operation protocol

Reset, drop, migration, seed, cleanup, and volume removal require all of the following in the same validation report:

1. Approved RV scope and explicit destructive operation.
2. Successful §4 preflight immediately before the command.
3. A command wrapper that checks the environment marker, exact parsed database name, canonical worktree/media root, and local-only provider marker before invoking Prisma, SQL, Docker, or filesystem deletion.
4. A narrow target: one validation database, one validation Compose project/volume, or one canonical validation media directory. Never use globs or broad cleanup commands.
5. Recorded command, redacted target identity, exit code, duration, result, and post-cleanup verification.

If an operation produces an unexpected artifact, leaves an uncertain DB/media state, needs a new migration, needs a different environment value, or could touch non-synthetic data, STOP. Do not attempt automatic cleanup or a second destructive command.

## 8. Definition of Ready for DEC-005

DEC-005 can be marked complete, and RV-01–RV-09 can become eligible for separate authorization, only when all conditions below are evidenced and approved by the owners:

- An owner chooses Option A or Option B and names the dedicated validation worktree, database endpoint, database name, media root, and responsible operator.
- The chosen database is demonstrably `yuni_validation_test`, separate from production, staging, shared local development, and user data; `DATABASE_URL` and `TEST_DATABASE_URL` pass the equality/name guard.
- A dedicated validation env file/process input exists outside Git, is explicit at launch, and does not load or inherit the working root `.env`.
- Docker option: daemon availability, unique project/volume/network, and effective Compose values are verified without secrets. Local option: database role/endpoint ownership and isolation are verified.
- Media root is inside the validation worktree, canonicalized, empty or synthetic-only, and has a guarded cleanup plan.
- External providers are shown disabled, mocked, or local-only; any unverified provider is a STOP.
- A reusable preflight/command guard is specified and reviewed for migrations, reset/drop, volumes, and media cleanup; no destructive command can bypass it.
- The future validation report template records preflight, environment fingerprint, commands, migrations, fixtures, results, cleanup, blind spots, and stop conditions without values of credentials or user data.
- Each intended RV has its own approved scope and any required owner policy decision: at minimum DEC-001 before RV-01, DEC-002 before session-dependent cases, DEC-003 before media-policy-dependent cases, and DEC-006 before token-policy-dependent cases.

Meeting Definition of Ready authorizes neither a run nor remediation. It establishes only that owners may approve an individual RV under the documented safeguards.

## 9. Recommendation for this computer

Use **Option B, the local PostgreSQL audit database**, if and only if it can satisfy Definition of Ready and the §4 guard. Docker is not currently available: client `29.7.2` is installed, but the Docker daemon is unreachable. If no separately owned local `yuni_validation_test` database and validation worktree can be verified, do not run any RV yet.

When the daemon becomes reachable, Option A becomes the preferred implementation because its project-scoped containers, network, and volume make cleanup and isolation easier to demonstrate. The decision remains Pending until the owners choose an option and approve the concrete scope.

## 10. Evidence and limitations

This document was prepared from [Followups](07-WAVE-1-FOLLOWUPS.md), [Baseline](02-BASELINE.md), current `docker-compose.yml`, `.env.example`, backend Jest/e2e configuration, Prisma schema/scripts, and `AGENTS.md`. Baseline showed Docker daemon and e2e/DB integration as BLOCKED; it also showed that backend CWD does not automatically load the root `.env`. The e2e setup requires a PostgreSQL URL with a database ending `_test` or `_ci` and invokes `prisma migrate deploy`.

The initial document preparation did not start a Docker service, PostgreSQL connection, migration, seed, reset/drop, media write, runtime test, or application listener; the later runtime-preflight evidence is recorded separately above. No real environment file, credentials, secrets, or user data were read. Production code and project configuration were not changed.
