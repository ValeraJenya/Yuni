---
title: "Yuni Documentation"
weight: 1
---


Yuni — dating app, монорепозиторий на React + NestJS + PostgreSQL/Prisma, развёртываемый локально через Docker Compose. Backend MVP реализован полностью: auth, profiles, media, discovery, likes, matches, chat, moderation, notifications. Production deployment не реализован.

**Стек:** Next.js (React) · NestJS · PostgreSQL · Prisma · Docker Compose

**Текущее состояние:** MVP backend — 9 доменов, 17 spec-файлов, 166 тестов. Production deployment, realtime/WebSocket и object storage/CDN в планах.

## Разделы

- [О проекте]({{< relref "/project/" >}}) — описание, стек, статус
- [Этапы разработки]({{< relref "/stages/" >}}) — история PR, roadmap, идеи
- [Архитектура]({{< relref "/architecture/" >}}) — обзор, backend, frontend, domain model
- [Backend-модули]({{< relref "/modules/" >}}) — auth, profiles, media, discovery, likes, matches, chat, moderation, notifications
- [API]({{< relref "/api/" >}}) — endpoints, rate limits, pagination
- [База данных]({{< relref "/database/" >}}) — схема, миграции, инварианты
- [Безопасность]({{< relref "/security/" >}}) — правила, serializers, data exposure
- [Тестирование]({{< relref "/testing/" >}}) — критичные сценарии
- [Онбординг]({{< relref "/onboarding/" >}}) — быстрый старт, Docker, ручной запуск
- [ADR — Решения]({{< relref "/decisions/" >}}) — architecture decision records
- [Процесс]({{< relref "/process/" >}}) — quality gates
