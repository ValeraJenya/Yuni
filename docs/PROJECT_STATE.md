# Project State

Last verified at: 2026-07-21
Verified on commit: 5779763
Last merged task / PR: PR #31 — Atomic block and match lifecycle (Task 024, partial)

## Baseline `main`

Этот раздел описывает подтверждённый baseline ветки `main`.

Подтверждённый baseline:

- Verified on commit: `5779763`;
- Last merged task / PR: PR #31 — Atomic block and match lifecycle (Task 024, partial);
- Task 027 staged-chat backend merged через PR #29;
- PR #31 атомарно создаёт `Block` и завершает active `Match`, но не закрывает `Conversation`, поэтому Task 024 остаётся `in_progress`.

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

## Инвентарь тестов

По файлам репозитория зафиксированы:

- 18 backend unit-spec файлов;
- 1 PostgreSQL e2e-файл: `profile-completion.e2e-spec.ts`.

Это инвентаризация файлов, а не утверждение о количестве пройденных тестов: в рамках docs-only синхронизации проверки не запускались.

## Current limitations

Подтверждённые ограничения:

- image sanitization и EXIF stripping не реализованы;
- object storage/CDN не реализованы;
- pending/private media lifecycle не реализован;
- staged-chat starter seed отсутствует;
- лимит голосовых этапа 2 и завершение игр имеют открытые concurrency gaps;
- настоящая загрузка, проверка длительности и физическая обрезка аудио не реализованы;
- production deployment architecture не реализована.

## Текущая работа

- Task 024 — `in_progress`: PR #31 реализовал транзакционный lifecycle Block/Match, но `Conversation` не закрывается.
- Task 027 — `in_progress`: базовый staged-chat backend реализован, однако concurrency, voice validation/limit, starter seed и contract evidence вынесены в отдельные задачи.
- Полный backlog и подтверждённые findings описаны в `docs/ROADMAP.md`.

## Не включено

Этот snapshot не включает непроверенные findings из raw audit drafts.
