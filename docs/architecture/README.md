# Architecture

Yuni использует монорепозиторий, чтобы frontend, backend, база данных, документация и инфраструктура развивались вместе, но оставались разделены по зонам ответственности.

- Frontend находится в `apps/frontend`.
- Backend находится в `apps/backend`.
- SQL-first схема, будущие миграции и seeds находятся в `database`.
- Документация находится в `docs`.
- Docker и support scripts будут находиться в `infra`.

Backend MVP реализован. Все основные домены работают как отдельные NestJS-модули; production deployment и realtime не реализованы.

## Документы

- [Domain Model](./domain-model.md) - доменные блоки MVP и границы ответственности.
- [Backend Foundation](./backend-foundation.md) - NestJS/Prisma foundation и базовые правила backend-слоя.
- [Backend Structure](./backend-structure.md) - текущая структура backend, роли слоев и стандарт module layout.
- [Frontend Structure](./frontend-structure.md) - текущая структура frontend, API client rules и auth state rules.
- [Module Boundaries](./module-boundaries.md) - правила границ модулей и допустимые cross-module interactions.
- [Program Flow Map](./program-flow-map.md) - карта текущих auth/profile/media flows от frontend до Prisma/serializers.
- [Scaling Roadmap](./scaling-roadmap.md) - поэтапная стратегия масштабирования без преждевременных микросервисов.
- [Foundation Hardening Plan](./foundation-hardening-plan.md) - master plan укрепления foundation.
