---
title: "Архитектура"
weight: 30
---


Yuni использует монорепозиторий, чтобы frontend, backend, база данных, документация и инфраструктура развивались вместе, но оставались разделены по зонам ответственности.

## Структура монорепо

| Директория | Назначение |
|---|---|
| `apps/frontend` | Next.js frontend |
| `apps/backend` | NestJS backend |
| `database` | SQL-first схема, будущие миграции и seeds |
| `docs` | Документация по архитектуре, security, onboarding |
| `infra` | Будущие operational scripts |
| `docker-compose.yml` | Локальный Docker workflow |

## Состояние

Backend MVP реализован. Все основные домены работают как отдельные NestJS-модули. Production deployment и realtime не реализованы.

## Разделы

- [Backend]({{< relref "/architecture/backend" >}}) — структура backend, слои, module shape
- [Frontend]({{< relref "/architecture/frontend" >}}) — структура frontend, API clients, auth rules
- [Domain Model]({{< relref "/architecture/domain-model" >}}) — доменные блоки и границы ответственности
