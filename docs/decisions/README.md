# ADR Process

Architecture Decision Records фиксируют значимые решения, их контекст и условия пересмотра.

## Существующие decision records

Эти decision records проверены в baseline `main` на commit `ca50baf`. Task 000 не изменяет их содержимое; ссылки сохранены как навигация к уже tracked historical records.

- [0001 PostgreSQL Domain Foundation](./0001-postgresql-domain-foundation.md)
- [0002 Greenfield Prisma Migrations](./0002-greenfield-prisma-migrations.md)

## Когда нужен ADR

ADR нужен, если решение влияет на:

- архитектурные границы;
- API contract;
- database schema/migrations;
- security model;
- deployment/infrastructure;
- long-term development workflow.

## Структура ADR

Каждый ADR должен содержать:

```text
ID
Название
Статус: proposed / accepted / superseded / deprecated
Принято
Commit / PR
Контекст
Проблема
Решение
Последствия
Не решает
Альтернативы
Связанные задачи
Связанные документы
Пересмотреть если
```

## Правила

- ADR не делает решение вечным.
- Поле `Пересмотреть если` обязательно.
- Если ADR заменён, новый ADR должен ссылаться на старый.
- ADR должен отделять факты от решений и future work.
- ADR не должен содержать secrets, PII, database dumps или real user data.

## Task 000

Task 000 создаёт только ADR process. ADR-001 в рамках Task 000 не создаётся.
