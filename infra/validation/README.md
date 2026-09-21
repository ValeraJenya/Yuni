# DEC-005 PostgreSQL-only safety infrastructure

**DEC-005 = Pending. RV-01–RV-09 = Not run.** This preparation does not authorize runtime. Code baseline: **deeee2c98951976c2064bf80e1a02c7a941be24f**. The future report must also identify the separate, committed infrastructure HEAD approved for execution.

Only Docker option A is implemented. Local PostgreSQL fallback B, migrations, seeds, arbitrary SQL, RV, application tests, backend/frontend/workers and media writes are outside this runner. Nothing here modifies ordinary Yuni infrastructure.

## Scope and files

Existing files changed: this README, guard.ps1, compose.validation.yml, .env.validation.example and [08-VALIDATION-ENVIRONMENT.md](../../docs/audits/yuni-2026-09/08-VALIDATION-ENVIRONMENT.md).

New-file allowlist for this hardening task:

- safety.psm1 — shared input, topology, process and ownership policy.
- preflight.ps1 — the sole supported DEC-005 preflight lifecycle.
- tests/safety.tests.ps1 — dependency-free synthetic offline tests.

AGENTS.md remains unchanged: these controls implement its existing scope, secrets and destructive-operation rules for this isolated tool; they do not change project-wide development or review policy.

## Fixed isolation contract

- Project: yuni-validation; environment marker: yuni-audit-validation.
- Only service validation-postgres, container yuni-validation-postgres, image postgres:16-alpine.
- Exact endpoint **127.0.0.1:56032/yuni_validation_test**; container port 5432. Host 5432, aliases, alternate hosts/databases and query overrides are rejected.
- Separate local volume yuni-validation-postgres-data and named bridge yuni-validation-network. No internal network, extra service, bind mount, extra port, external resource or privilege setting.
- Both DATABASE_URL and TEST_DATABASE_URL are mandatory, identical and match the explicit validation credentials. No root .env fallback.
- Compose uses JSON syntax (a YAML subset), allowing dependency-free structural validation before Docker. Future rendered JSON is checked independently. Unknown fields/defaults fail closed, including unsupported Compose-version output.
- Every resource carries project labels, io.yuni.validation.environment and a fresh runner-generated io.yuni.validation.run.

## Inputs for a separately approved future run

Use PowerShell 7.4+ with -NoProfile, trusted Git/Docker executables and a clean **registered linked worktree** at an owner-selected absolute path. The shared checkout is forbidden. Supply the expected worktree and full infrastructure HEAD independently; the baseline is not inferred from the terminal directory.

In that future worktree only, the operator creates ignored infra/validation/.env.validation from the synthetic example. Generate a fresh validation-only password of 32–128 ASCII letters/digits/underscore/hyphen; no quotes, interpolation or copied working credentials. Keep the same password in both URLs. Credentials must not appear in command arguments, stdout, chat or evidence.

VALIDATION_WORKTREE_ROOT must match the explicit expected canonical local path. VALIDATION_MEDIA_ROOT must equal **<worktree>\apps\backend\uploads\dec-005** and be absent or empty. Ordinary uploads roots, relative/UNC paths, traversal, junctions and symlinks are rejected. This PostgreSQL-only run never creates, mounts or removes media. Future media use needs separate RV authorization.

Known sensitive inherited variables (DB/PG/Postgres, Docker/Compose, credentials/tokens/secrets, cloud/provider and proxy variables) cause STOP. Every native child receives a fresh allowlisted environment: OS paths/temp only, plus the runner's run ID for Compose. Docker uses an empty per-run client config and an explicit local Linux-engine named pipe; personal Docker contexts, registry credentials and root .env are not inputs. Keep the shell and Docker daemon exclusively under the operator's control during the run.

## Sole supported workflow

Baseline/worktree checks → inherited-environment rejection and static guard → explicit psql path/version gate → Compose topology/ownership gates → create stopped resources → ownership check → start validation-postgres → health → actual loopback publication → host TCP → host SQL identity → ordinary-resource comparison/evidence → fresh ownership checks → narrow cleanup.

These commands are a **proposal for separate approval**, not permission to execute now. Replace the path and infrastructure SHA with owner-approved values. The hardening diff must first be committed/reviewed through the normal workflow; a dirty working tree is rejected.

~~~powershell
# Use the explicitly selected validation worktree, never the shared checkout.
$validationRoot = 'D:\Yuni-validation'
$baselineSha = 'deeee2c98951976c2064bf80e1a02c7a941be24f'
$infrastructureSha = '<approved-full-infrastructure-commit-SHA>'
$validationEnv = "$validationRoot\infra\validation\.env.validation"
# Static only: does not invoke Docker.
pwsh -NoProfile -File "$validationRoot\infra\validation\preflight.ps1" -ExpectedWorktreeRoot $validationRoot -BaselineSha $baselineSha -ExpectedHeadSha $infrastructureSha -EnvFile $validationEnv

# ONLY after separate approval covering creation, TCP/SQL identity probe and owned cleanup:
pwsh -NoProfile -File "$validationRoot\infra\validation\preflight.ps1" -ExpectedWorktreeRoot $validationRoot -BaselineSha $baselineSha -ExpectedHeadSha $infrastructureSha -EnvFile $validationEnv -Execute -OwnerApproval 'DEC-005 PostgreSQL-only preflight and owned cleanup'
~~~

The approval argument records the operator's acknowledgement; it cannot substitute for owner approval.

All Docker calls specify **--host npipe:////./pipe/dockerDesktopLinuxEngine** and the empty per-run **--config** directory. Every Compose call additionally specifies **--project-name yuni-validation --project-directory <worktree> --env-file <explicit validation env> -f <worktree>\infra\validation\compose.validation.yml**.

1. Read-only gates: Docker/Compose versions, container/network/volume inventory, Windows port use and excluded ranges, **compose … config --quiet**, locally cached image identity. No image pull. Unknown excluded-range output is STOP.
2. Internally capture **compose … config --format json** in memory and validate its entire topology. **Never print full rendered config with real validation input.** Native stdout/stderr and full inspect objects are not emitted or saved. Public checks remain **config --quiet**.
3. Require an empty validation namespace, then **compose … create --no-recreate --pull never validation-postgres**. This creates a stopped container; it cannot authorize adoption/recreation of an existing container. Inspect labels, IDs, volume creation identity, mounts, image and bindings before **docker container start <owned-ID>**.
4. Inspect health, actual published port (not merely HostConfig), bridge membership and consumers. Open and close a TCP socket only to 127.0.0.1:56032. Then run the fixed read-only identity query through the Windows host psql client. Require zero exit status, strict JSON parsing, database yuni_validation_test, user yuni_validation_user and server major 16. TCP alone cannot produce PASS. No application process runs.
5. Compare ordinary resource inventory before cleanup and persist evidence. Revalidate ownership, then **container stop --time 10 <owned-ID>**, **container rm <owned-ID>**, **network rm <owned-network-ID>**, **volume rm yuni-validation-postgres-data**. Before removal verify identity and absence of foreign consumers. No force flags, down -v, prune, reset or general-purpose command forwarding.
6. Verify owned resources are absent and preexisting resource names/IDs/states are unchanged. Ordinary Yuni containers are never stopped, inspected for credentials, restarted or connected to validation.

Every native CLI is assigned a Windows job; the deadline includes its descendants and redirected output. On failure the runner terminates that job and checks termination, never the existing Docker daemon. A request already submitted to the daemon may still complete: retain UNKNOWN state and evidence, do not assume rollback.

Any FAIL / UNKNOWN / AMBIGUOUS result aborts normal work. **Only a SQL-identity or subsequent ordinary-inventory comparison failure enters guarded cleanup**, with fresh ownership/consumer checks before deletion; the overall run remains failed even if cleanup succeeds. Earlier failures, unknown ownership or failed cleanup retain resources for separately approved recovery. No destructive command is retried. A new run rejects those resources; it never adopts them based only on a familiar name or project label.

## Evidence and remaining runtime gates

Future reports are created exclusively at **docs/audits/yuni-2026-09/passes/validation/dec005-<run-id>.json** in the selected worktree. They preserve baseline/infrastructure SHA, worktree, run ID, local Docker endpoint, project/marker, image ID, resource identities and selected ownership labels, commands without credentials, stage, timings/results, health/TCP/SQL identity and cleanup outcomes. The sqlIdentity block contains attempted, clientPath/clientVersion, fixed host/port/expectedDatabase, validated actualDatabase/currentUser/postgresVersion, exitCode, result and pgpassCleanup. Empty per-run Docker client directories remain; temporary pgpass must be deleted, and media is untouched. The operator retains the ignored credential input for the run and removes it separately after evidence review.

STATIC TEST coverage: URL/port/database rejection, required inputs, paths, environment policy, machine-readable topology, synthetic resource ownership, fail-stop ordering and cleared native child environment. Safe commands:

~~~powershell
pwsh -NoProfile -File infra/validation/tests/safety.tests.ps1
git diff --check
~~~

RUNTIME PREFLIGHT GATES, **not executed during hardening**: actual linked-worktree acceptance at the committed SHA; local Docker/Compose compatibility; daemon/image identity; empty resource namespace; current Windows port availability; rendered topology; real ownership/consumers; PostgreSQL health; published loopback/TCP and authenticated host SQL identity; removal and unchanged ordinary inventory.

Limitations requiring operator awareness:

- The mutex excludes other supported runners, not manual Docker commands or another administrator. Exclusive daemon use during the short lifecycle is a prerequisite. Concurrent changes cause STOP; malicious local admin/TOCTOU is outside the guarantee.
- Docker volumes expose no immutable UUID here: cleanup uses exact name, project/run labels, creation timestamp, local driver/options and consumer checks. Ambiguous/replaced volumes are retained.
- Clearing child environment does not sandbox trusted OS executables, Docker daemon settings, profiles already run in the parent, or the cached image. Use the fresh shell; approve image provenance separately. No automatic image download or implicit registry authentication.
- A bridge permits outbound traffic. Provider isolation here means **no application/backend/frontend/worker execution**, not the disabled marker alone. Future RV needs demonstrated provider/network isolation.
- TCP/health alone cannot pass this runner. Authenticated SQL identity still does not prove application readiness, race behavior or any RV result. DEC-005 acceptance is never automatic.

## Explicit host psql and private password file

Scope: add only a host SQL identity gate, its offline tests and DEC-005 docs. Production code, Compose topology, baseline/worktree policy and historical BLOCKED evidence are unchanged. The 77 original offline cases remain; additional fixtures cover capability, PG environment, private ACL/password cleanup, parsing and success/failure ordering. No runtime preflight is authorized by this change.

Set **VALIDATION_PSQL_PATH** in the explicit ignored validation env file to the canonical absolute path of a trusted Windows **psql.exe**, retaining its bundled DLLs. The example uses a generic placeholder. Missing/relative/nonexistent/wrong-basename paths fail the static guard; execution of only **--version** must report client major 16 before the first Docker command. There is no PATH search or fallback. The executable SHA256 is checked again before SQL; operators must protect the whole portable directory (including DLLs) from modification. This is a trusted host/tool gate, not protection against a malicious same-user process or administrator.

Every native child starts with an OS-only environment allowlist, not a copy of the parent's environment. The parent guard rejects nonempty PG* variables (including PGHOSTADDR, PGSERVICE, PGPASSFILE, PGOPTIONS and future libpq keys); no parent settings are permanently changed. Only the SQL child additionally receives the runner-created PGPASSFILE plus fixed PGCONNECT_TIMEOUT=5, PGCLIENTENCODING=UTF8 and PGAPPNAME=yuni-dec005-identity. Root .env, default pgpass/service files and psqlrc are not inputs; **-X -w** are mandatory. Password never enters argv, URI, stdout/stderr or evidence.

Immediately before SQL, create **passes/validation/pgpass-<run-id>/pgpass.conf** under the selected worktree. Windows creates protected directory/file ACLs before writing the single exact loopback/port/database/user/password record; verify that only the current operator SID has FullControl and owns the protected ACL. Administrators can still take ownership: this is a documented trusted-machine boundary. Failure to prove ACLs stops the probe. The owned file/directory are deleted in finally, without recursive deletion; cleanup failure makes the probe fail. An already existing scope is never adopted or removed.

The sole query is a built-in SELECT returning current_database(), current_user and version() as one JSON object; callers cannot pass SQL or connection overrides. Native output is captured privately, stderr is suppressed, malformed/extra/duplicate fields and credential-containing output fail closed. Only validated identity fields enter evidence. A 15-second job deadline and 5-second connection timeout bound execution.

Prepared tool reference: **EDB PostgreSQL 16.15-4 Windows x64**, [official ZIP](https://get.enterprisedb.com/postgresql/postgresql-16.15-4-windows-x64-binaries.zip), archive SHA256 **F5F55B03BD54CE0DD1C51D524B54C7E015ABD4D620AF27D6971288A2DBE4A8F8**. Provenance limitation: official EDB HTTPS source; no publisher checksum/signature confirmed. psql/libpq/OpenSSL files checked during preparation were NotSigned. The runner records actual client version/executable hash separately from this preparation reference; it does not claim to reverify the archive or all DLLs. Portable files and local provenance stay outside Git. Only psql --version was used in preparation; SQL connectivity remains unverified until a separately approved preflight.