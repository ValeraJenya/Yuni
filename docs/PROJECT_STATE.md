# Project State

Last verified at: 2026-08-20
Verified on commit: 42db25f
Last merged task / PR: PR #80 — User data export (Task 067a)

## Baseline `main`

Этот раздел описывает подтверждённый baseline ветки `main`.

Подтверждённый baseline:

- Verified on commit: `42db25f`;
- Last merged task / PR: PR #80 — User data export (Task 067a);
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
- Task 052 закрыт: один `LangProvider` в корневом layout, выбор языка живёт в
  `localStorage` и синхронизируется между вкладками (PR #68 / `55163e4`);
- Task 046 частично: регистрация атомарна (PR #63), like → match атомарен
  (PR #69 / `1323f0b`); остаются match → notifications и message →
  notification;
- Task 050 частично: неработающие кнопки в шапке диалога удалены
  (PR #72 / `26129ab`); остаётся «Добавить» в секции «Интересы»;
- Task 071 закрыт: `/hero-portrait.jpg` больше не подставляется как аватар,
  заглушки выбираются `defaultAvatarUrl` по полю `gender`
  (PR #73 / `90fe38a`);
- Task 030 закрыт: экраны `/settings/privacy` и `/settings/notifications`
  поверх Settings API из Task 057; премиум-элементы удалены
  (PR #74 / `8e1ec73`);
- Task 069 закрыт: профиль открывается в режиме просмотра, редактирование —
  отдельной панелью с явным сохранением (PR #75 / `4d2f9be`);
- Task 070 закрыт: `/onboarding` сразу после регистрации, форма общая с
  Task 069, гонка редиректов устранена (PR #76 / `2b0d847`);
- Task 072 и Task 045 закрыты одним сидом: `prisma/seed.ts` +
  `prisma/seed/**` — 9 персонажей с фото, готовый матч, диалоги на этапах 1 и
  2, четыре активные фразы в `conversation_starters` (PR #77 / `8feff3b`);
- Task 060 закрыт: `ParseUUIDPipe` на обоих `@Param('photoId')` в
  `media.controller.ts`, невалидный UUID в path даёт 400 вместо 500
  (PR #79 / `38d3e5a`);
- Task 067a закрыт: `GET /users/me/export` под `JwtAccessGuard`, состав
  выгрузки — allowlist по `select` (PR #80 / `42db25f`). Открыта 067b —
  удаление аккаунта;
- Помимо задач ROADMAP влиты две правки без номера: горизонтальный скролл на
  экранах авторизации (PR #70 / `2c188f6`) и motion-эффекты лендинга
  (PR #78 / `a5b2b15`). Визуальная проверка второй дала Task 074 и Task 075;
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
- health;
- users (только `GET /users/me/export`, Task 067a).

## Profile photo architecture

Подтверждённое состояние после PR #23:

- `MediaService` использует `ProfilePhotoStorage`;
- local adapter отвечает за физическую запись и удаление файлов;
- current public URL contract: `/uploads/profile-photos/...`;
- local storage - development/MVP решение.

## Инвентарь тестов

По файлам репозитория зафиксированы:

- 20 unit-spec-файлов;
- 6 e2e-файлов: `game-race.e2e-spec.ts`, `match-block-chat.e2e-spec.ts`,
  `media-path-params.e2e-spec.ts`, `profile-completion.e2e-spec.ts`,
  `settings.e2e-spec.ts`, `user-data-export.e2e-spec.ts`.

В отличие от прошлых синхронизаций, число unit-тестов здесь не переписано из
предыдущей версии документа, а взято из прогона на текущем `main` (`42db25f`):
`pnpm --filter backend test` → `Test Suites: 20 passed, 20 total`,
`Tests: 211 passed, 211 total`. E2E не запускались — им нужен реальный
Postgres, поэтому по ним зафиксирован только инвентарь файлов.

Пропущенных (`skipped`) сценариев в unit-прогоне нет; последний skip в e2e —
block-vs-match в `match-block-chat.e2e-spec.ts` — снят вместе с Task 042.

## Current limitations

Подтверждённые ограничения:

- image sanitization и EXIF stripping не реализованы;
- object storage/CDN не реализованы;
- pending/private media lifecycle не реализован;
- загрузки аудио нет вообще; `voiceDurationSec` присылает клиент, проверка
  реальной длительности и обрезка не реализованы (Task 068);
- production deployment architecture не реализована (образы публикуются, но
  окружения нет — Task 025);
- самостоятельное удаление аккаунта отсутствует (Task 067b); экспорт данных
  реализован в Task 067a, но выгружает фотографии метаданными и `publicUrl`,
  без самих файлов;
- интерфейса для экспорта нет: `GET /users/me/export` доступен только прямым
  запросом, кнопки в продукте не существует;
- фича «Интересы» не реализована: `Interest` и `ProfileInterest` есть в схеме,
  но ни одного эндпоинта нет, `UpdateProfileDto` их не принимает, а в коде
  backend они читаются только сериализатором экспорта (Task 050);
- realtime/WebSocket нет ни в чате, ни в уведомлениях: в `apps/backend/src`
  нет ни одного gateway;
- frontend-тестов нет вообще: в репозитории ни одного `*.test.*` или
  `*.spec.*` под `apps/frontend`;
- восстановление пароля и подтверждение email не реализованы (Task 031, 033);
- фотографии публикуются без предмодерации, что расходится с лендингом (Task 032).

## Текущая работа

- Task 021 — `done`: backend вычисляет completion из семи обязательных полей и qualifying photo, Discovery использует общий predicate, `profiles.completed_at` удалена миграцией, frontend использует серверный процент. Independent blind review завершён: findings T021-01..03 исправлены и подтверждены как `resolved`.
- Task 024 — `done`: PR #38 закрывает `Conversation` атомарно вместе с `Match`, PR #53 закрыл read-path gap.
- Task 027 — `in_progress`: базовый staged-chat backend реализован; concurrency, voice validation, starter seed и contract evidence вынесены в отдельные задачи. 043, 044 и 045 закрыты, открыты 048 и 068.
- Task 046 — `in_progress`: регистрация (PR #63) и like → match (PR #69) переведены на одну транзакцию; остаются match → notifications и message → notification. Outbox признан избыточным — уведомления пишутся в ту же БД.
- Task 050 — `in_progress`: кнопки в шапке диалога удалены (PR #72), премиум-элементы — вместе с Task 030 (PR #74). Остаётся «Добавить» в секции «Интересы», подключать не к чему до появления API.
- Task 054 — `in_progress`: эта синхронизация. Четвёртый заход подряд; процессные выводы фиксируются в PR задачи, а не только в статусах.
- Task 063 — `done`: `/terms`, `/privacy`, `/help` реализованы. Тексты составлены по фактическому инвентарю данных и содержат видимые TODO-блоки по нереализованным функциям; юридической экспертизы не проходили. TODO про доступ к данным ещё не снят: он правится, когда закрыты обе половины Task 067.
- Task 069 и Task 070 — `done`: профиль разделён на просмотр и редактирование, форма вынесена в `features/profile` и переиспользуется онбордингом `/onboarding`. Единственный источник списка полей и обязательности — `features/profile/form-state.ts`, поэтому расхождение с `PROFILE_COMPLETION_FIELDS` невозможно по построению.
- Task 030 — `done`: `/settings/privacy` и `/settings/notifications` работают поверх Settings API из Task 057. Переключение оптимистичное с откатом при ошибке запроса.
- Task 072 и Task 045 — `done`: демо-сид `pnpm --dir apps/backend prisma:seed` создаёт 9 анкет с фото, готовый матч и диалоги на этапах 1 и 2, наполняет `conversation_starters`. Guard отказывается запускаться при `NODE_ENV=production`, нелокальном `DATABASE_URL` и против базы `yuni_test`.
- Task 067a — `done`: `GET /users/me/export`. Инвентарь полей размечен колонкой «При удалении» как готовый вход для Task 067b.
- Task 074 и Task 075 — `idea`: заведены по итогам визуальной проверки PR #78, кода по ним нет.
- Полный backlog и подтверждённые findings описаны в `docs/ROADMAP.md`.

## Не включено

Этот snapshot не включает непроверенные findings из raw audit drafts.
