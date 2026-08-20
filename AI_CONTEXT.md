# AI_CONTEXT.md

Quick onboarding for any AI agent or LLM. Read this file first; follow links only when you need domain detail.

---

## 1. Что за проект

Yuni — dating app в монорепозитории. Стек: Next.js frontend, NestJS backend, PostgreSQL + Prisma, Docker Compose для локальной разработки. Production deployment не реализован: образы backend/frontend публикуются в GHCR, но окружения для деплоя нет. Разработка ведётся локально; CI запускается на GitHub Actions при PR и push в `main`. Verified state: commit `42db25f`, 2026-08-20 (последний merged PR — #80).

---

## 2. Текущее состояние

**Реализовано (backend + frontend + unit tests):**

| Домен | Backend endpoints | Статус |
|---|---|---|
| Auth | register, login, refresh, logout, me | `done` |
| Profiles | GET/PATCH me, GET :handle | `done` |
| Media | upload, list, set primary, delete | `partial` |
| Discovery | GET /cards (cursor, max 20) | `done` |
| Likes | like, skip/pass | `done` |
| Matches | GET /me, start conversation | `done` |
| Chat | conversations, messages, staged-chat metadata/games/starters | `partial` |
| Moderation | block/unblock/list, report | `done` |
| Notifications | list, unread-count, mark read/all | `done` |
| Settings | GET/PATCH privacy и notifications | `done` |
| Health | GET /health с проверкой Postgres | `done` |
| Users | GET /users/me/export (экспорт своих данных) | `partial` |

Инвентарь backend-тестов: 20 unit-spec-файлов и 6 e2e-файлов (`game-race`, `match-block-chat`, `media-path-params`, `profile-completion`, `settings`, `user-data-export`). Число unit-тестов на `42db25f` — 20 сьютов / 211 тестов, взято из прогона `pnpm --filter backend test`. По e2e зафиксирован только инвентарь файлов: им нужен реальный Postgres.

**Не реализовано (known limitations):**
- EXIF stripping и image sanitization
- Object storage / CDN (только local adapter в `uploads/`)
- Realtime / WebSocket для chat и notifications (ни одного gateway в `apps/backend/src`)
- Реальная загрузка, проверка длительности и обрезка voice media: `voiceDurationSec` — число от клиента
- Самостоятельное удаление аккаунта (Task 067b); экспорт есть, но без кнопки в интерфейсе и без файлов фотографий
- Интересы: `Interest`/`ProfileInterest` есть в схеме, эндпоинтов нет
- Production deployment architecture (образы публикуются, окружения нет)
- Email verification, password reset backend
- Admin/moderation panel
- Superlike (значение есть в enum `LikeKind`, эндпоинта нет)
- Frontend tests (отсутствуют)

**Закрыто с прошлой ревизии этого файла** — здесь стояли как открытые, но реализованы: staged-chat concurrency при завершении игр (Task 043) и при voice totals (Task 044), seed стартовых фраз (Task 045).

**Media помечена `partial`:** фото автоматически `approved` при upload (без очереди модерации); local adapter только.

---

## 3. Структура репозитория

```
/
├── apps/
│   ├── backend/          NestJS backend (modules под src/modules/)
│   │   ├── prisma/       schema.prisma + migrations (source of truth для БД) + seed/ (демо-данные)
│   │   └── uploads/      local media storage (не коммитится)
│   └── frontend/         Next.js frontend
├── database/             SQL-first historical reference (не authoritative)
├── docs/                 архитектура, security, API, testing, database
│   ├── architecture/     domain model, backend/frontend structure, flows
│   ├── api/README.md     полный API reference с curl-примерами
│   ├── database/         Prisma schema guide, migrations, invariants
│   ├── security/         правила безопасности, data-exposure rules
│   └── testing/          карта критичных тест-сценариев по доменам
├── infra/                Docker и scripts
├── AGENTS.md             главный entry point для AI и новых разработчиков
├── AI_CONTEXT.md         этот файл
└── docs/PROJECT_STATE.md верифицированный snapshot состояния проекта
```

---

## 4. Ключевые правила работы

**Git:**
- Не пушить напрямую в `main`. Работать через ветки.
- Не использовать `git add .` или `git add -A`. Только именованные файлы.
- Не использовать rebase или destructive git команды без согласования owner-а.
- Перед commit проверять staged files на случайные dumps, secrets, audit drafts.

**Scope:**
- Начинать код только после scope-check. Задачи, затрагивающие `auth`, `profiles`, `discovery`, `media`, `database/migrations`, API, Docker/CI/CD, security или PII, требуют явного подтверждения.
- Не расширять scope молча. Не выдавать планы и future work за реализованное.
- При конфликте источников — остановиться и зафиксировать evidence.

**Security (обязательные проверки при любой PR с кодом):**
- `CurrentUser` из JWT — единственный trusted source userId. Frontend-переданные `userId`, `photoId`, `conversationId`, `isOwner`, `isAdmin` — untrusted input.
- Owner checks: `assertOwner`, `assertConversationMember`, `assertMatchParticipant`, `assertCanAccessProfile`, `assertCanAccessPhoto` — `apps/backend/src/common/security/`.
- Safe serializers: не отдавать raw Prisma rows. PII-поля (`email`, `passwordHash`, `token_hash`, `storageKey`, `ip_address`, `user_agent`, `birthDate` в публичных ответах) — никогда в response.
- Не коммитить `.env`, secrets, tokens, production credentials.

**Качество перед PR:**
```powershell
corepack pnpm check   # Prisma validate, backend tests, build, lint, frontend typecheck
```

---

## 5. Что сейчас в приоритете (backlog top-3)

Открытых P0 нет.

| ID | Задача | Приоритет | Статус |
|---|---|---|---|
| 074 | Главный CTA лендинга ниже сгиба | P1 | idea — на 1280×800 кнопка «Познакомиться» целиком за пределами первого экрана после PR #78 |
| 067b | Self-service удаление аккаунта | P1 | idea — экспорт закрыт в 067a, удаления нет; soft delete с анонимизацией |
| 027 | Этапный чат — схема и бэкенд | P1 | in_progress — 043, 044 и 045 закрыты, остаются 048 и 068 |
| 046 | Неатомарные write-пути | P1 | in_progress — регистрация и like → match закрыты, остаются два пути уведомлений |

Полный backlog: `docs/ROADMAP.md`.

---

## 6. Где читать подробности

| Документ | Что внутри |
|---|---|
| `AGENTS.md` | Workflow, scope rules, git rules, quality gates, security rules |
| `docs/PROJECT_STATE.md` | Верифицированный snapshot: что реализовано, известные limitations |
| `docs/ROADMAP.md` | Backlog задач с приоритетами и зависимостями |
| `docs/FEATURES.md` | Матрица фич: done/partial/planned по каждому домену |
| `docs/api/README.md` | Полный API reference: endpoints, request/response shapes, curl-примеры |
| `docs/architecture/README.md` | Domain model, backend/frontend structure, flows, module boundaries |
| `docs/database/README.md` | Prisma как source of truth, migrations, PostgreSQL-расширения |
| `docs/database/schema-and-migrations.md` | Таблицы, enums, SQL-инварианты, PII-поля, cascade behavior |
| `docs/security/README.md` | Security rules, data exposure, access-control patterns |
| `docs/testing/critical-scenarios.md` | Карта covered/not-covered тест-сценариев по всем доменам |

Порядок чтения для новой задачи: `AGENTS.md` → `PROJECT_STATE.md` → `ROADMAP.md` → task spec → связанные docs → код.

---

## 7. Как использовать этот файл

Этот файл читается один раз в начале сессии. После этого:

1. Если задача затрагивает конкретный домен — открой соответствующий документ из раздела 6.
2. Если задача — code change — обязательно проверь scope-check rules в `AGENTS.md`.
3. Если задача — docs-only — работай только с указанными файлами; не меняй существующие без явного scope.
4. При конфликте между этим файлом и кодом или `PROJECT_STATE.md` — доверяй коду и `PROJECT_STATE.md`.
5. Не пушь и не коммить без явной команды owner-а.
