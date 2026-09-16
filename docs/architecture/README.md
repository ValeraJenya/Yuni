# Architecture

Yuni использует монорепозиторий, чтобы frontend, backend, база данных, документация и инфраструктура развивались вместе, но оставались разделены по зонам ответственности.

- Frontend находится в `apps/frontend`.
- Backend находится в `apps/backend`.
- Authoritative схема и миграции находятся в `apps/backend/prisma`; `database/` — исторический SQL reference.
- Документация находится в `docs`.
- Локальный Compose находится в корне; отдельная validation infrastructure — в `infra/validation`.

Backend MVP реализован. Все основные домены работают как отдельные NestJS-модули; production deployment и realtime не реализованы.

## Документы

Статусы архитектурных утверждений: **CURRENT** — подтверждено кодом/config на указанном SHA; **TARGET** — требование к будущему состоянию, не реализованная функция; **PROPOSED** — вариант решения; **OPEN** — решение или evidence отсутствуют; **DEPRECATED** — заменённое описание со ссылкой на актуальное. Task statuses и статусы audit findings остаются отдельными словарями.

Сверка дополнения от 2026-09-16: [scope, evidence, coverage и открытые решения](./integration-2026-09-16.md). Статическая сверка не подтверждает live deployment и не заменяет runtime validation.

- [Domain Model](./domain-model.md) - доменные блоки MVP и границы ответственности.
- [Backend Foundation](./backend-foundation.md) - NestJS/Prisma foundation и базовые правила backend-слоя.
- [Backend Structure](./backend-structure.md) - текущая структура backend, роли слоев и стандарт module layout.
- [Frontend Structure](./frontend-structure.md) - текущая структура frontend, API client rules и auth state rules.
- [Module Boundaries](./module-boundaries.md) - правила границ модулей и допустимые cross-module interactions.
- [Program Flow Map](./program-flow-map.md) - карта текущих auth/profile/media flows от frontend до Prisma/serializers.
- [Scaling Roadmap](./scaling-roadmap.md) - поэтапная стратегия масштабирования без преждевременных микросервисов.
- [Foundation Hardening Plan](./foundation-hardening-plan.md) - master plan укрепления foundation.
- [Financial Flow](./financial-flow.md) - PROPOSED gift/balance/payout и concentration risks; финансовая функциональность не реализована.
- [Knowledge](../knowledge/README.md) - короткие объяснения терминов со ссылками на архитектурные источники.
