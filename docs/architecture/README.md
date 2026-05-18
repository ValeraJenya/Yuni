# Architecture

Yuni uses a monorepo-style structure so frontend, backend, database, documentation, and infrastructure can evolve together while staying in separate areas of responsibility.

- Frontend code lives in `apps/frontend`.
- Backend code will live in `apps/backend`.
- Database schema, migrations, and seeds live under `database`.
- Documentation lives under `docs`.
- Docker and support scripts live under `infra`.

The current focus is a safe foundation for future development. Backend and database implementation details will be documented as they are added.

## Documents

- [Domain Model](./domain-model.md) - MVP domain blocks and their responsibility boundaries.
