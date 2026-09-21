# DEC-005 PostgreSQL-only safety infrastructure

**DEC-005 = Pending. RV-01–RV-09 = Not run.** This preparation does not authorize runtime. Code baseline: **deeee2c98951976c2064bf80e1a02c7a941be24f**. The future report must also identify the separate, committed infrastructure HEAD approved for execution.

Only Docker option A is implemented. Local PostgreSQL fallback B, migrations, seeds, SQL, RV, application tests, backend/frontend/workers and media writes are outside this runner. Nothing here modifies ordinary Yuni infrastructure.

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

Static safety checks → guard PASS → runtime preflight gates PASS → create stopped resources → ownership checks → start only owned PostgreSQL → health/publication/TCP evidence → fresh ownership checks → narrow cleanup.

These commands are a **proposal for separate approval**, not permission to execute now. Replace the path and infrastructure SHA with owner-approved values. The hardening diff must first be committed/reviewed through the normal workflow; a dirty working tree is rejected.

~~~powershell
# Use the explicitly selected validation worktree, never the shared checkout.
$validationRoot = 'D:\Yuni-validation'
$baselineSha = 'deeee2c98951976c2064bf80e1a02c7a941be24f'
$infrastructureSha = '<approved-full-infrastructure-commit-SHA>'
$validationEnv = "$validationRoot\infra\validation\.env.validation"
# Static only: does not invoke Docker.
pwsh -NoProfile -File "$validationRoot\infra\validation\preflight.ps1" -ExpectedWorktreeRoot $validationRoot -BaselineSha $baselineSha -ExpectedHeadSha $infrastructureSha -EnvFile $validationEnv

# ONLY after separate approval covering creation, TCP probe and owned cleanup:
pwsh -NoProfile -File "$validationRoot\infra\validation\preflight.ps1" -ExpectedWorktreeRoot $validationRoot -BaselineSha $baselineSha -ExpectedHeadSha $infrastructureSha -EnvFile $validationEnv -Execute -OwnerApproval 'DEC-005 PostgreSQL-only preflight and owned cleanup'
~~~

The approval argument records the operator's acknowledgement; it cannot substitute for owner approval.

All Docker calls specify **--host npipe:////./pipe/dockerDesktopLinuxEngine** and the empty per-run **--config** directory. Every Compose call additionally specifies **--project-name yuni-validation --project-directory <worktree> --env-file <explicit validation env> -f <worktree>\infra\validation\compose.validation.yml**.

1. Read-only gates: Docker/Compose versions, container/network/volume inventory, Windows port use and excluded ranges, **compose … config --quiet**, locally cached image identity. No image pull. Unknown excluded-range output is STOP.
2. Internally capture **compose … config --format json** in memory and validate its entire topology. **Never print full rendered config with real validation input.** Native stdout/stderr and full inspect objects are not emitted or saved. Public checks remain **config --quiet**.
3. Require an empty validation namespace, then **compose … create --no-recreate --pull never validation-postgres**. This creates a stopped container; it cannot authorize adoption/recreation of an existing container. Inspect labels, IDs, volume creation identity, mounts, image and bindings before **docker container start <owned-ID>**.
4. Inspect health, actual published port (not merely HostConfig), bridge membership and consumers. Open and close a TCP socket only to 127.0.0.1:56032. No SQL or application process runs. Health/TCP do not prove authenticated SQL access; that remains separate evidence.
5. Revalidate ownership, then **container stop --time 10 <owned-ID>**, **container rm <owned-ID>**, **network rm <owned-network-ID>**, **volume rm yuni-validation-postgres-data**. Before removal verify identity and absence of foreign consumers. No force flags, down -v, prune, reset or general-purpose command forwarding.
6. Verify owned resources are absent and preexisting resource names/IDs/states are unchanged. Ordinary Yuni containers are never stopped, inspected for credentials, restarted or connected to validation.

Every native CLI is assigned a Windows job; the deadline includes its descendants and redirected output. On failure the runner terminates that job and checks termination, never the existing Docker daemon. A request already submitted to the daemon may still complete: retain UNKNOWN state and evidence, do not assume rollback.

Any FAIL / UNKNOWN / AMBIGUOUS result aborts the sequence. **No automatic cleanup follows failure.** Partial creation/failed cleanup leaves resources for separately approved recovery with preserved evidence. A new run rejects those resources; it never adopts them based only on a familiar name or project label.

## Evidence and remaining runtime gates

Future reports are created exclusively at **docs/audits/yuni-2026-09/passes/validation/dec005-<run-id>.json** in the selected worktree. They preserve baseline/infrastructure SHA, worktree, run ID, local Docker endpoint, project/marker, image ID, resource identities and selected ownership labels, commands without credentials, stage, timings/results, health/TCP and cleanup outcomes. Empty per-run Docker client directories remain alongside evidence; no media or SQL artifacts are produced. The operator retains the ignored credential input for the run and removes it separately after evidence review.

STATIC TEST coverage: URL/port/database rejection, required inputs, paths, environment policy, machine-readable topology, synthetic resource ownership, fail-stop ordering and cleared native child environment. Safe commands:

~~~powershell
pwsh -NoProfile -File infra/validation/tests/safety.tests.ps1
git diff --check
~~~

RUNTIME PREFLIGHT GATES, **not executed during hardening**: actual linked-worktree acceptance at the committed SHA; local Docker/Compose compatibility; daemon/image identity; empty resource namespace; current Windows port availability; rendered topology; real ownership/consumers; PostgreSQL health; published loopback/TCP; removal and unchanged ordinary inventory.

Limitations requiring operator awareness:

- The mutex excludes other supported runners, not manual Docker commands or another administrator. Exclusive daemon use during the short lifecycle is a prerequisite. Concurrent changes cause STOP; malicious local admin/TOCTOU is outside the guarantee.
- Docker volumes expose no immutable UUID here: cleanup uses exact name, project/run labels, creation timestamp, local driver/options and consumer checks. Ambiguous/replaced volumes are retained.
- Clearing child environment does not sandbox trusted OS executables, Docker daemon settings, profiles already run in the parent, or the cached image. Use the fresh shell; approve image provenance separately. No automatic image download or implicit registry authentication.
- A bridge permits outbound traffic. Provider isolation here means **no application/backend/frontend/worker execution**, not the disabled marker alone. Future RV needs demonstrated provider/network isolation.
- TCP plus container environment/health is not authenticated SQL identity, application readiness, race behavior or an RV result. DEC-005 acceptance is never automatic.
