# AI_CONTEXT.md

Quick onboarding for any AI agent or LLM. Read this file first; follow links only when you need domain detail.

---

## 1. Что за проект

Yuni — dating app в монорепозитории. Стек: Next.js frontend, NestJS backend, PostgreSQL + Prisma, Docker Compose для локальной разработки. Production deployment не реализован. Разработка ведётся локально; CI запускается на GitHub Actions при PR и push в `main`. Verified state: commit `6d3d399`, 2026-06-26.

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
| Chat | conversations, messages, send | `done` |
| Moderation | block/unblock/list, report | `done` |
| Notifications | list, unread-count, mark read/all | `done` |

Backend: 17 spec files, 166 tests passed.

**Не реализовано (known limitations):**
- EXIF stripping и image sanitization
- Object storage / CDN (только local adapter в `uploads/`)
- Realtime / WebSocket для chat и notifications
- Production deployment architecture
- Email verification, password reset backend
- Admin/moderation panel
- Superlike
- Frontend tests (отсутствуют)

**Media помечена `partial`:** фото автоматически `approved` при upload (без очереди модерации); local adapter только.

---

## 3. Структура репозитория

```
/
├── apps/
│   ├── backend/          NestJS backend (modules под src/modules/)
│   │   ├── prisma/       schema.prisma + migrations (source of truth для БД)
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

| ID | Задача | Приоритет | Статус |
|---|---|---|---|
| 021 | Profile completion lifecycle | P0 | research — уточнить completion, discoverability, обязательные поля |
| 022 | Frontend media URL resolution | P1 | research — единый способ resolution backend media URLs на frontend |
| 023 | Safe image processing and media lifecycle | P1 | idea — EXIF stripping, image sanitization, pending/private lifecycle |

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
