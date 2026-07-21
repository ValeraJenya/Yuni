---
title: "Текущее состояние"
weight: 10
---


Последняя проверка: 2026-07-21. Commit: `5779763`. Последний merged PR: PR #31 — Atomic block and match lifecycle (Task 024, partial).

## Baseline `main`

- Verified commit: `5779763`
- Last merged task / PR: PR #31 — Atomic block and match lifecycle (Task 024, partial)
- Task 027 staged-chat backend merged через PR #29
- PR #31 атомарно создаёт `Block` и завершает active `Match`, но не закрывает `Conversation`

## Реализованные backend-домены

- auth
- profiles
- discovery
- likes
- matches
- chat
- moderation
- notifications
- media

## Profile photo architecture

После PR #23:

- `MediaService` использует `ProfilePhotoStorage`
- Local adapter отвечает за физическую запись и удаление файлов
- Публичный URL: `/uploads/profile-photos/...`
- Local storage — development/MVP решение

## Инвентарь тестов

- 18 unit-spec-файлов + 1 e2e-файл (profile-completion.e2e-spec.ts)

Это inventory файлов, а не результат прогона; docs-only синхронизация не запускала проверки.

## Подтверждённые ограничения

- Image sanitization и EXIF stripping не реализованы
- Object storage/CDN не реализованы
- Pending/private media lifecycle не реализован
- Staged-chat starter seed отсутствует
- Game completion и voice totals имеют открытые concurrency gaps
- Настоящая загрузка, проверка длительности и обрезка voice media не реализованы
- Production deployment не реализован

## Активные задачи

- Task 024 — `in_progress`: Match lifecycle реализован, закрытие `Conversation` остаётся
- Task 027 — `in_progress`: базовый staged-chat backend есть, остаются concurrency/voice/seed/contract gaps

Полный backlog описан в [Roadmap]({{< relref "/project/roadmap" >}}).
