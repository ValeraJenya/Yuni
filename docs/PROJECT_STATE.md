# Project State

Last verified at: 2026-08-14
Verified on commit: fdd3fdc
Last merged task / PR: PR #66 — Remove dead demo mode (Task 038)

## Baseline `main`

Этот раздел описывает подтверждённый baseline ветки `main`.

Подтверждённый baseline:

- Verified on commit: `fdd3fdc`;
- Last merged task / PR: PR #66 — Remove dead demo mode (Task 038);
- Task 042 закрыт: advisory-лок по паре пользователей сериализует блокировку
  и создание match (PR #61); real-Postgres тест block-vs-match больше не
  `skipped`;
- Task 044 закрыт: остаток лимита голосовых пересчитывается под
  `SELECT ... FOR UPDATE` (приехало в PR #49, отмечено задним числом);
- Task 047 закрыт: файл фотографии удаляется до записи в БД, сбой удаления
  файла проваливает запрос (PR #62);
- Task 024 закрыт полностью: PR #38 закрывает `Conversation` вместе с `Match`,
  PR #53 закрыл read-path gap;
- Task 057 закрыт: `SettingsModule` с GET/PATCH `/settings/privacy` и
  `/settings/notifications` (PR #55 → #57, фикс импорта JwtModule в PR #58);
- Task 053 и 058 закрыты: CI поднимает Postgres 16 сервисом и прогоняет
  backend e2e; backend lint — отдельный ESLint, а не `tsc --noEmit`;
- Task 065 закрыт: workflow публикации образов backend/frontend в GHCR;
- Task 063 закрыт: `/terms`, `/privacy`, `/help` существуют и статически
  пререндерятся;
- Task 022 закрыт: все экраны резолвят относительные media URL (PR #41 и #64);
- Task 049 закрыт: `/health` проверяет Postgres и отдаёт 503 при недоступной
  базе (PR #65);
- Task 038 закрыт: мёртвый demo-mode удалён (PR #66);
- Task 046 частично: регистрация атомарна (PR #63), три пути остаются.
- Открытых P0 нет.

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
- media;
- settings;
- health.

## Profile photo architecture

Подтверждённое состояние после PR #23:

- `MediaService` использует `ProfilePhotoStorage`;
- local adapter отвечает за физическую запись и удаление файлов;
- current public URL contract: `/uploads/profile-photos/...`;
- local storage - development/MVP решение.

## Инвентарь тестов

По файлам репозитория зафиксированы:

- 19 unit-spec-файлов (197 тестов на момент проверки);
- 4 e2e-файла: `profile-completion.e2e-spec.ts`, `game-race.e2e-spec.ts`,
  `match-block-chat.e2e-spec.ts`, `settings.e2e-spec.ts`.

Это инвентаризация файлов, а не утверждение о количестве пройденных тестов: в рамках docs-only синхронизации проверки не запускались. Пропущенных (`skipped`) сценариев не осталось — последний, block-vs-match в `match-block-chat.e2e-spec.ts`, включён вместе с Task 042.

## Current limitations

Подтверждённые ограничения:

- image sanitization и EXIF stripping не реализованы;
- object storage/CDN не реализованы;
- pending/private media lifecycle не реализован;
- staged-chat starter seed отсутствует (Task 045);
- загрузки аудио нет вообще; `voiceDurationSec` присылает клиент, проверка
  реальной длительности и обрезка не реализованы (Task 068);
- production deployment architecture не реализована (образы публикуются, но
  окружения нет — Task 025);
- самостоятельное удаление аккаунта и экспорт данных отсутствуют (Task 067);
- восстановление пароля и подтверждение email не реализованы (Task 031, 033);
- фотографии публикуются без предмодерации, что расходится с лендингом (Task 032).

## Текущая работа

- Task 021 — `done`: backend вычисляет completion из семи обязательных полей и qualifying photo, Discovery использует общий predicate, `profiles.completed_at` удалена миграцией, frontend использует серверный процент. Independent blind review завершён: findings T021-01..03 исправлены и подтверждены как `resolved`.
- Task 024 — `done`: PR #38 закрывает `Conversation` атомарно вместе с `Match`, PR #53 закрыл read-path gap.
- Task 027 — `in_progress`: базовый staged-chat backend реализован, однако concurrency, voice validation, starter seed и contract evidence вынесены в отдельные задачи (043 и 044 закрыты, 045/048/068 открыты).
- Task 046 — `in_progress`: регистрация переведена на одну транзакцию (PR #63); like → match и два пути уведомлений остаются. Outbox признан избыточным — уведомления пишутся в ту же БД.
- Task 063 — `done`: `/terms`, `/privacy`, `/help` реализованы. Тексты составлены по фактическому инвентарю данных и содержат видимые TODO-блоки по нереализованным функциям; юридической экспертизы не проходили.
- Полный backlog и подтверждённые findings описаны в `docs/ROADMAP.md`.

## Не включено

Этот snapshot не включает непроверенные findings из raw audit drafts.
