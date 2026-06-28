---
title: "Тестирование"
weight: 80
---


Исходник: `docs/testing/critical-scenarios.md`. Карта критичных тест-сценариев Yuni по состоянию на 2026-06-26.

Все тесты — unit-уровень с mock Prisma. Интеграционных и e2e тестов нет.

**Статусы:** `covered` — покрыт unit-тестом; `not-covered` — теста нет; `needs-recheck` — частично покрыт или покрыт на уровне mock-а, требует интеграционного теста с реальной БД.

## Итоговая сводка по доменам

| Домен | Покрыто | Не покрыто | Needs-recheck |
|---|---|---|---|
| Auth | register, login, refresh, logout, PII | дубль email/handle, login disabled user | parallel refresh race |
| Owner checks | assertOwner, assertFound, assertCanAccessProfile, assertCanAccessPhoto | assertConversationMember, assertMatchParticipant | — |
| Serializers | PII exclusion, private mode | — | — |
| Profiles | getMe, updateMe, getByHandle, block/private access | PATCH с запрещёнными полями (DTO-уровень) | — |
| Media | upload validation (MIME, size, signature, limit), owner checks, storage cleanup | EXIF stripping, path traversal | — |
| Discovery | все фильтры, pagination, safe shape | — | — |
| Likes | happy path, все negative, block, cooldown, constraint | — | parallel race |
| Matches | happy path, все negative, normalization, constraint | pagination | parallel race |
| Chat | membership, block bypass, closed conversation, DTO, idempotent start | — | conversation race |
| Moderation | block/unblock/report, side effects, DTO, idempotency | admin review workflow | block race |
| Notifications | create/list/mark-read, block filter, settings, safe shape | — | — |
| HTTP/Controller | — | JwtAccessGuard enforcement, DTO whitelist, rate limit wiring | — |

## Auth

Spec: `apps/backend/src/modules/auth/auth.service.spec.ts`

| Сценарий | Статус |
|---|---|
| Регистрация взрослого пользователя | `covered` |
| Регистрация до 18 лет | `covered` |
| birthDate в формате не YYYY-MM-DD | `covered` |
| birthDate в будущем | `covered` |
| Вход с верными credentials | `covered` |
| Вход с неверным паролем | `covered` |
| Refresh: single-use rotation | `covered` |
| Refresh: повторное использование отозванного токена | `covered` |
| Refresh: истёкший токен | `covered` |
| Logout: idempotent revoke | `covered` |
| Регистрация с дублирующимся email | `not-covered` |
| Регистрация с дублирующимся handle | `not-covered` |
| Вход disabled/deleted пользователя | `not-covered` |
| Race: два параллельных refresh | `needs-recheck` |

## Profiles

Spec: `apps/backend/src/modules/profiles/profiles.service.spec.ts`

| Сценарий | Статус |
|---|---|
| GET /profiles/me для активного пользователя | `covered` |
| GET /profiles/me для disabled/deleted | `covered` |
| PATCH /profiles/me: только переданные поля | `covered` |
| GET /profiles/:handle: block → 404 | `covered` |
| GET /profiles/:handle: private/non-discoverable → 403 | `covered` |
| PATCH с запрещёнными полями | `not-covered` |

## Media

Spec: `apps/backend/src/modules/media/media.service.spec.ts`

| Сценарий | Статус |
|---|---|
| Загрузка без файла / неверный MIME / > 5 MB | `covered` |
| Валидные JPEG/PNG/WebP сигнатуры | `covered` |
| Первое фото = approved primary | `covered` |
| set-primary: чужое фото | `covered` |
| delete primary: следующее фото промотируется | `covered` |
| EXIF/metadata stripping | `not-covered` |
| Path traversal в local storage | `not-covered` |

## Discovery

Spec: `apps/backend/src/modules/discovery/discovery.service.spec.ts`

Все фильтры покрыты: self-exclusion, inactive users, non-discoverable, нет фото, block, active LIKE/SKIP cooldown, active match, expired = не блокирует, pagination, safe shape.

## Likes / Matches / Chat / Moderation / Notifications

Детальные таблицы по каждому домену — в `docs/testing/critical-scenarios.md`.

## Отсутствующее покрытие

### HTTP/Controller layer

| Риск | Что нужно |
|---|---|
| `JwtAccessGuard` блокирует неаутентифицированные запросы | Controller-level или e2e тест |
| `ValidationPipe` отклоняет лишние DTO поля | e2e тест с реальным HTTP-запросом |
| Rate limits применены к нужным endpoints | Controller-level или e2e тест |
| Cookie-only refresh flow | e2e тест |

### Integration / E2E

| Риск | Что нужно |
|---|---|
| `likes_no_overlapping_active_interactions` (btree_gist) | Интеграционный тест с реальной PostgreSQL |
| `matches_no_overlapping_active_pairs` (btree_gist) | Интеграционный тест с реальной PostgreSQL |
| Duplicate email/handle при регистрации под нагрузкой | Интеграционный тест |
| `lower(email)` / `lower(handle)` case-insensitive | Интеграционный тест |

### Frontend tests

Frontend spec-файлов нет.
