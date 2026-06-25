# AGENTS.md

Version: 1.0
Last updated: 2026-06-26

## Назначение

Этот файл - главный вход для Codex, Claude, нового разработчика и нового AI-чата в Yuni.

Yuni - dating app monorepo: React frontend, NestJS backend, PostgreSQL/Prisma, Docker Compose. Разработка сейчас локальная; production deployment ещё не реализован.

## Когда обновлять

Обновляй этот файл, если меняются:

- project workflow;
- quality gates;
- security rules;
- документационная структура;
- Git/review правила;
- требования к AI-исполнителям.

Если task меняет эти области, но `AGENTS.md` не меняется, в task evidence нужно явно написать почему.

## Порядок чтения

1. `AGENTS.md`.
2. `docs/PROJECT_STATE.md`.
3. `docs/ROADMAP.md`.
4. Актуальная task spec из `docs/tasks/`.
5. Связанные architecture/security/API/onboarding документы.
6. Связанные ADR и audit findings.
7. Code, tests and current diff.

## Источники истины

Приоритет источников:

1. Код в `main` + Prisma schema/migrations + доступная runtime configuration без секретов.
2. Автоматические тесты и результаты quality gates.
3. Последний audit с конкретным проверенным commit.
4. Task spec текущей задачи.
5. `PROJECT_STATE.md` и `ROADMAP.md`.
6. Остальная документация.
7. Чаты, AI-комментарии и устные договорённости.

Если источники противоречат друг другу, не гадать. Остановиться, зафиксировать evidence и запросить решение owner-а.

## Scope rules

- Не начинать код без scope-check.
- Задачи, затрагивающие `auth`, `profiles`, `discovery`, `media`, `database/migrations`, API, Docker/CI/CD, security или PII, требуют явного подтверждения scope-check от owner-а или reviewer-а до начала кода.
- Для isolated non-critical задач executor может продолжить сам после фиксации scope-check в task spec, PR description или task note.
- При сомнении использовать полный процесс.
- Не расширять scope молча.
- Если нужна работа вне scope, остановиться и обновить task spec или получить явное согласование.
- Не выдавать планы, идеи и future work за реализованный функционал.
- Факт, решение, план и открытый вопрос должны быть отделены друг от друга.

## Git workflow

- Не пушить напрямую в `main`.
- Работать через ветки.
- Не использовать rebase без отдельного согласования.
- Не использовать destructive Git-команды без согласования.
- Не использовать `git add .` и `git add -A`.
- Перед PR проверять expected changed/staged files.
- Не добавлять случайные файлы, dumps, build artifacts или raw audit drafts.

## Secrets, PII and user data

Запрещено открывать, логировать, коммитить или вставлять в документы:

- `.env`, secrets, cookies, tokens, private keys;
- real user PII;
- database dumps;
- реальные фото пользователей;
- private messages;
- internal storage keys или filesystem paths, если они не нужны для безопасного debug evidence.

Для examples использовать synthetic placeholders.

## Dating app safety rules

Для функциональности dating app всегда проверять:

- owner checks: frontend flags не являются доказательством прав;
- privacy settings and profile visibility;
- block/report behavior;
- anti-spam and rate limits;
- safe serializers: не отдавать raw Prisma rows, secrets, PII, `storageKey`, local paths;
- safe media handling: MIME/magic bytes, size limits, no original filename as storage name, no path traversal.

## Independent blind review

Для meaningful changes нужен independent review по `docs/AI_REVIEW_PROTOCOL.md`.

Первый review должен быть blind: reviewer получает branch/PR/diff, task spec, docs, checks and changed files, но не executor chat и не скрытые рассуждения.

Task 000 является bootstrap-исключением: этот файл создаётся до первого review protocol. Это не прецедент для будущих задач.

## Quality gates

См. `docs/QUALITY_GATES.md`.

Главное правило: выполняются только checks, применимые к task и явно указанные в task spec. Docs-only task не обязан запускать backend/frontend tests, если task spec не требует этого.

## Облегчённый режим

Облегчённый режим разрешён только для изолированных задач, которые не затрагивают:

```text
auth
profiles
discovery
likes
matches
chat
moderation
notifications
media
database
Prisma schema/migrations
API contract
Docker
CI/CD
deployment
security rules
rate limits
owner checks
PII
AGENTS.md
docs/QUALITY_GATES.md
docs/AI_REVIEW_PROTOCOL.md
docs/tasks/README.md
docs/tasks/TEMPLATE.md
PROJECT_STATE
ROADMAP
ADR
audit index
```

В облегчённом режиме:

- scope-check может быть 3-5 строк в PR description или task note;
- отдельный task spec не обязателен;
- допустим self-review по checklist;
- `ROADMAP.md` и `PROJECT_STATE.md` не обновляются, если merge не меняет состояние проекта.

Если есть сомнение, использовать полный процесс.