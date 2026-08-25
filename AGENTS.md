# AGENTS.md

Version: 1.3
Last updated: 2026-08-25

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
2. `CLAUDE.md` — единственный источник истины по frontend design tokens, anti-AI-slop checklist и обязательному visual QA в задачах с изменением вёрстки. Здесь эти правила не дублируются.
3. `docs/PROJECT_STATE.md`.
4. `docs/ROADMAP.md`.
5. Актуальная task spec из `docs/tasks/`.
6. Связанные architecture/security/API/onboarding документы.
7. Связанные ADR и audit findings.
8. Code, tests and current diff.

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

### Что не пишем в документацию

В долговечные документы (`ROADMAP.md`, `PROJECT_STATE.md`, страницы задач) не попадают утверждения, истинные только на момент написания: «PR не открыт», «ветка готова к пушу», «осталось запушить». Такое утверждение становится ложью в момент мержа, и обновлять его некому — тот, кто мержит, документ уже не редактирует.

Состояние ветки и PR живёт в git и на GitHub, где оно актуально по определению. В документ попадает только то, что останется правдой после мержа: номер PR, хеш мержа, что именно сделано.

Полный каталог классов дрейфа — `docs-site/content/tasks/054.md`.

## Scope rules

- Не начинать код без scope-check.
- Задачи, затрагивающие `auth`, `profiles`, `discovery`, `media`, `database/migrations`, API, Docker/CI/CD, security или PII, требуют явного подтверждения scope-check от owner-а или reviewer-а до начала кода.
- Для isolated non-critical задач executor может продолжить сам после фиксации scope-check в task spec, PR description или task note.
- При сомнении использовать полный процесс.
- Не расширять scope молча.
- Если нужна работа вне scope, остановиться и обновить task spec или получить явное согласование.
- Не выдавать планы, идеи и future work за реализованный функционал.
- Факт, решение, план и открытый вопрос должны быть отделены друг от друга.

### Границы правки

- Правка не меняет поведение, вёрстку или конфигурацию за пределами
  заявленного дефекта.
- Если для починки пришлось задеть смежное — это выносится в отчёт и в
  task spec отдельным пунктом, а не растворяется в диффе.
- При исправлении вёрстки проверяется не только то состояние, где дефект
  виден: как минимум вьюпорт с дефектом и по одному в каждую сторону от
  него. Правка, проверенная на одной высоте окна, считается непроверенной.
- Если дефект — одна сторона двустороннего ограничения, вторая сторона
  проверяется явно и фиксируется в evidence.

## Git workflow

Источник истины по Git-правилам — этот раздел. `CLAUDE.md` дублирует только само правило ветки и ссылается сюда.

- Никогда не коммитить напрямую в `main`.
- Никогда не пушить напрямую в `main`.
- Всегда работать в отдельной ветке и вливать изменения через PR.
- Если работа начата на `main`, сначала создать ветку и только потом коммитить.
- Не использовать rebase без отдельного согласования.
- Не использовать destructive Git-команды без согласования.
- Не использовать `git add .` и `git add -A`.
- Перед PR проверять expected changed/staged files.
- Не добавлять случайные файлы, dumps, build artifacts или raw audit drafts.

### Push / PR

- Коммитить в свою ветку можно и нужно (см. правило выше про обязательную
  отдельную ветку).
- Пушить свою ветку в origin можно и нужно: `main` защищён правилами
  репозитория, ветка на origin ничего не ломает, а review диффа идёт
  именно по запушенной ветке.
- Открывать Pull Request, мержить и пушить в `main` агент не должен ни при
  каких условиях — это делает владелец после того, как посмотрит diff.

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

`@testing-library/react` разрешён для тестов хуков и чистой логики, требующей React-рендерера. Тесты на рендер компонентов — отдельное решение, пока не принятое: у них выше стоимость поддержки, и вводить их надо осознанно, а не потому что библиотека уже в зависимостях. Введён в Task 079 для пина bootstrap-механизма auth-сессии.

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