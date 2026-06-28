---
title: "Текущее состояние"
weight: 10
---


Последняя проверка: 2026-06-26. Commit: `6d3d399`. Последний merged PR: PR #24 — Project documentation foundation (Task 000).

## Baseline `main`

- Verified commit: `6d3d399`
- Last merged task / PR: PR #24 — Project documentation foundation (Task 000)
- PR #24 — docs-only изменение; code baseline неизменён с `ca50baf` (PR #23)

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

## Последние проверки (после PR #23)

- Backend tests: 17 suites, 166 тестов — passed
- Backend build: passed
- Backend lint: passed

## Подтверждённые ограничения

- Image sanitization и EXIF stripping не реализованы
- Object storage/CDN не реализованы
- Pending/private media lifecycle не реализован
- Production deployment не реализован

## Активные задачи

Нет. Backlog описан в [Roadmap]({{< relref "/project/roadmap" >}}).
