# Yuni

Yuni is a dating app project organized as a shared repository for frontend, backend, database, documentation, and infrastructure work.

## Project Structure

- `apps/frontend` - current Next.js frontend prototype and UI.
- `apps/backend` - backend foundation placeholder. The NestJS application will be added here later.
- `database` - database schema, migrations, and seed data will live here.
- `docs` - architecture, API, security, onboarding, and decision notes.
- `infra` - infrastructure-related docker and script assets.

Backend implementation, database schema, migrations, and seeds are intentionally not implemented yet. They will be added in later foundation steps.

## Frontend

Run the frontend from the repository root:

```bash
pnpm dev
```

Or directly from `apps/frontend`:

```bash
pnpm --dir apps/frontend dev
```
