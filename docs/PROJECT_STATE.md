# Project State

Last verified at: 2026-06-26
Verified on commit: 6d3d399
Last merged task / PR: PR #24 — Project documentation foundation (Task 000)

## Baseline `main`

Этот раздел описывает подтверждённый baseline ветки `main`.

Подтверждённый baseline:

- Verified on commit: `6d3d399`;
- Last merged task / PR: PR #24 — Project documentation foundation (Task 000);
- Task 000 merged в `main` через PR #24;
- PR #24 — docs-only изменение и не меняет backend code, API contract, Prisma или Docker; code baseline неизменен с `ca50baf` (PR #23).

## Факты baseline

Yuni - monorepo dating app. В репозитории есть:

- frontend application;
- NestJS backend;
- PostgreSQL/Prisma database layer;
- documentation;
- Docker Compose local workflow.

Текущий стек:

- React frontend;
- NestJS backend;
- PostgreSQL + Prisma;
- Docker Compose for local development.

Реализованные backend domains по состоянию на проверенный commit:

- auth;
- profiles;
- discovery;
- likes;
- matches;
- chat;
- moderation;
- notifications;
- media.

## Profile photo architecture

Подтверждённое состояние после PR #23:

- `MediaService` использует `ProfilePhotoStorage`;
- local adapter отвечает за физическую запись и удаление файлов;
- current public URL contract: `/uploads/profile-photos/...`;
- local storage - development/MVP решение.

## Последние известные проверки

После merge PR #23 были выполнены backend checks:

- backend test: 17 suites passed, 166 tests passed;
- backend build: passed;
- backend lint: passed.

## Current limitations

Подтверждённые ограничения:

- image sanitization и EXIF stripping не реализованы;
- object storage/CDN не реализованы;
- pending/private media lifecycle не реализован;
- production deployment architecture не реализована.

## Текущая работа

- Task 000 (project documentation foundation) merged в `main` через PR #24 (`6d3d399`) и закрыта со статусом `done`.
- Документация README/onboarding синхронизирована с фактическим состоянием кода: реализованные домены auth, profiles, discovery, likes, matches, chat, moderation, notifications и media. Это docs-only изменение без правок кода, API contract, Prisma или Docker.
- Активных продуктовых задач в работе нет; backlog задач 021–026 описан в `docs/ROADMAP.md`.

## Не включено

Этот snapshot не включает непроверенные findings из raw audit drafts.