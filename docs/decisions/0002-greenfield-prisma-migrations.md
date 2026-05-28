# 0002 Greenfield Prisma Migrations

## Status

Accepted.

## Context

Yuni starts with a new empty PostgreSQL database. The project does not migrate a legacy customer database and does not need to import old users, preserve old IDs, deduplicate old email/handle values, or clean up old bad data.

The previous foundation used `prisma db push` as a local convenience in documentation. That is not enough for a dating app foundation because the database must consistently enforce security and integrity rules across local development, CI, and future server deployments.

The SQL-first draft in `database/schema/schema.sql` already documents PostgreSQL-specific constraints that Prisma schema cannot fully express, such as expression indexes, partial indexes, unordered match pair uniqueness, and self-action checks.

## Decision

Prisma migrations are the main workflow for applying the Yuni database schema.

- `apps/backend/prisma/schema.prisma` is the ORM model for Prisma Client.
- `apps/backend/prisma/migrations` is the source of truth for applying schema changes.
- `database/schema/schema.sql` remains SQL-first reference/domain documentation.
- PostgreSQL-specific constraints and indexes are stored directly in `migration.sql`.
- `prisma db push` is not the main workflow.

## Consequences

Every developer can create the same greenfield database from migrations. Future schema changes will be reviewable and deployable through `prisma migrate deploy`.

Manual SQL in migrations is allowed when Prisma schema cannot represent a required PostgreSQL integrity rule. These rules must stay documented and covered by migration smoke checks.

No legacy migration scripts, import scripts, old user cleanup, old ID preservation, database dumps, or real PII are part of this workflow.
