---
title: "ADR — Решения"
weight: 100
---


Исходник: `docs/decisions/README.md`. Architecture Decision Records фиксируют значимые решения, их контекст и условия пересмотра.

## Существующие decision records

- [0001 PostgreSQL Domain Foundation](https://github.com/ValeraJenya/Yuni/blob/main/docs/decisions/0001-postgresql-domain-foundation.md)
- [0002 Greenfield Prisma Migrations](https://github.com/ValeraJenya/Yuni/blob/main/docs/decisions/0002-greenfield-prisma-migrations.md)

## Когда нужен ADR

ADR нужен, если решение влияет на:

- Архитектурные границы
- API contract
- Database schema/migrations
- Security model
- Deployment/infrastructure
- Long-term development workflow

## Структура ADR

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

- ADR не делает решение вечным
- Поле `Пересмотреть если` обязательно
- Если ADR заменён, новый ADR должен ссылаться на старый
- ADR должен отделять факты от решений и future work
- ADR не должен содержать secrets, PII, database dumps или real user data
