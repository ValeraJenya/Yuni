# Project State

Last verified at: 2026-06-25
Verified on commit: ca50baf
Last merged task / PR: PR #23 — Profile photo storage boundary

## Baseline `main`

Этот раздел описывает подтверждённый baseline ветки `main`, а не незавершённую docs-работу в текущей ветке.

Подтверждённый baseline:

- Verified on commit: `ca50baf`;
- Last merged task / PR: PR #23 — Profile photo storage boundary;
- Task 000 не является частью commit `ca50baf`.

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

- Текущая рабочая ветка: `docs/project-documentation-foundation`.
- Task 000 существует в текущей ветке как незавершённая documentation task.
- Статус Task 000: `review`.
- Task 000 ещё не merged в `main`.

## Не включено

Этот snapshot не включает непроверенные findings из raw audit drafts.