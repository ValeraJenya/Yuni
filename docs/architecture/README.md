# Architecture

Yuni использует монорепозиторий, чтобы frontend, backend, база данных, документация и инфраструктура развивались вместе, но оставались разделены по зонам ответственности.

- Frontend находится в `apps/frontend`.
- Backend находится в `apps/backend`.
- SQL-first схема, будущие миграции и seeds находятся в `database`.
- Документация находится в `docs`.
- Docker и support scripts будут находиться в `infra`.

Текущий фокус - безопасная и понятная foundation-основа для дальнейшей разработки.

## Документы

- [Domain Model](./domain-model.md) - доменные блоки MVP и границы ответственности.
- [Backend Foundation](./backend-foundation.md) - NestJS/Prisma foundation и базовые правила backend-слоя.
