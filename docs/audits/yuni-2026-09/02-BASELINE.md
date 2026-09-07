# Yuni — Baseline, 2026-09-06

## 1. Scope и исходное состояние

Это read-only baseline по [Audit Charter](01-AUDIT-CHARTER.md) и [Pre-Audit Plan](00-PRE-AUDIT-PLAN.md). Ниже — результаты checks и baseline observations, не окончательные audit findings и не оценка production readiness.

| Параметр | Зафиксировано |
| --- | --- |
| Начало | 2026-09-06 19:09:26 +03:00, Europe/Moscow |
| Окончание инструментальных проверок | 2026-09-06 19:17:25 +03:00 |
| Ветка | `chore/pre-audit-setup` |
| Полный checked commit SHA | `80de2c161f58e821d28bf2eb1d0a6ff7fd6329aa` |
| Git status до начала | `## chore/pre-audit-setup`; tracked changes и untracked files отсутствовали |
| ОС | Windows, kernel `10.0.26200`, x64; `RuntimeInformation.OSDescription`: `Microsoft Windows 10.0.26200` |
| Единственный разрешённый новый файл проекта | `docs/audits/yuni-2026-09/02-BASELINE.md` |

Прочитаны план, charter, три `package.json`, `pnpm-workspace.yaml`, `docker-compose.yml`, все три `.github/workflows/*.yml`, Prisma schema/migration lock, Jest/TypeScript/Next.js/ESLint configs и e2e bootstrap. Заявления документации не принимались за доказательства реализации.

### Изоляция и ограничения

- Команды исполнялись в чистой временной копии точного SHA, полученной через `git archive --format=tar --output=<temp>/source.tar <SHA>` и распаковку вне `D:/Yuni`. Реальные `.env`, uploads, существующие `node_modules` и Git metadata в копию не переносились.
- CWD команд из таблиц — корень этой копии; `--dir apps/backend` / `--dir apps/frontend` переключает пакет. Исходный checkout оставался неизменным.
- Дочерние процессы наследовали только системные переменные Windows, пути инструментов и временных каталогов. App env, registry credentials и реальные секреты не наследовались и не выводились.
- Для Prisma передан synthetic `DATABASE_URL` на loopback, порт 1, несуществующую для этой проверки БД с суффиксом `_test`. Это синтаксический placeholder, а не подтверждение тестовой БД; e2e с ним не запускались.
- Служебные настройки: `CI=true`, `HUSKY=0`, `COREPACK_ENABLE_AUTO_PIN=0`, `NEXT_TELEMETRY_DISABLED=1`, `PRISMA_HIDE_UPDATE_MESSAGE=1`. Остальные app-переменные не задавались. Husky prepare явно пропущен: проверка install не подтверждает установку Git hooks.
- Install и generate выполнялись до использующих их checks. Backend и frontend очереди частично работали параллельно; длительности — wall-clock отдельных процессов, не performance benchmark. Сбой проверки не останавливал остальные.
- Не выполнялись migrations, seed, reset, удаление БД, Docker up/down, deployment, dev-серверы или commit. Временные build/cache/log artifacts находятся вне проекта.
- `AGENTS.md`, charter и остальные документы не менялись: scope владельца разрешает только новый baseline-отчёт; правила проекта этим проходом не изменяются.

## 2. Версии инструментов и зависимостей

| Инструмент | Команда | Фактическая версия |
| --- | --- | --- |
| Node.js | `node --version` | `v24.19.0` |
| pnpm | `pnpm --version` | `11.23.0` |
| Corepack | `corepack --version` | `0.35.0` |
| pnpm через Corepack | `corepack pnpm --version` | `11.23.0`; exit 0, 0.41 s |
| Docker CLI | `docker --version` | `29.7.2`, build `a7dcaa6` |
| Docker Compose | `docker compose version` | `v5.4.0` |
| Prisma CLI / Client | `pnpm --dir apps/backend exec prisma --version` | `6.19.3` / `6.19.3`; exit 0, 1.52 s; binary target `windows` |

Версии ниже прочитаны из фактически установленных `node_modules/<package>/package.json` после frozen install, а не выведены из диапазонов manifest.

| Пакет | Область | Установлено |
| --- | --- | --- |
| `@nestjs/core`, `@nestjs/common` | Backend | `10.4.22` |
| `@nestjs/config` | Backend | `3.3.0` |
| `@nestjs/jwt` | Backend | `10.2.0` |
| `prisma`, `@prisma/client` | Backend | `6.19.3` |
| `next` | Frontend | `16.2.0` |
| `react`, `react-dom` | Frontend | `19.2.4` |
| `tailwindcss` | Frontend | `4.2.0` |
| `@testing-library/react` | Frontend | `16.3.2` |
| `typescript` | Оба пакета | `5.7.3` |
| `jest` | Оба пакета | `29.7.0` |
| `ts-jest` | Оба пакета | `29.2.5` |
| `eslint` | Оба пакета | `9.39.4` |

Workspace содержит корень, `@yuni/backend`, `@yuni/frontend`; шаблон packages — `apps/*`. Lockfile имеет формат `9.0`. В корневом manifest не заданы `packageManager` и `engines`; локальная среда не идентична CI на Node 22 / Ubuntu.

## 3. Матрица основных проверок

`PASS` означает успешное завершение указанной команды, а не доказательство корректности всего приложения. `FAIL` — исполненная проверка с ошибкой. `BLOCKED` — отсутствует необходимое безопасное окружение. `SKIPPED` — сознательно не выполнено в этом scope. `NOT CONFIGURED` — отдельный механизм не определён. Для неисполненных проверок duration/exit code — `—`, а не ноль.

Время старта — 2026-09-06, UTC; для Moscow прибавить 3 часа.

| Проверка | Точная команда | Старт UTC | Статус | Exit | Время, s | Результат / evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Frozen install | `pnpm install --frozen-lockfile` | 16:11:09 | PASS | 0 | 50.65 | Все 3 workspace projects, +1082 packages; lockfile up to date, resolution skipped; native postinstall завершились; Husky пропущен через `HUSKY=0`. |
| Prisma validate | `pnpm --dir apps/backend prisma:validate` | 16:12:47 | PASS | 0 | 1.41 | `The schema at prisma/schema.prisma is valid`. Подключение к БД этим не проверяется. |
| Prisma generate | `pnpm --dir apps/backend prisma:generate` | 16:12:48 | PASS | 0 | 2.32 | Generated Prisma Client `6.19.3`; только временный `node_modules`. |
| Backend lint | `pnpm --dir apps/backend lint` | 16:12:51 | PASS | 0 | 24.37 | ESLint для `src/**/*.ts` и `test/**/*.ts`; diagnostics отсутствуют. |
| Backend unit tests | `pnpm --dir apps/backend test` | 16:13:15 | PASS | 0 | 45.51 | **20 suites, 220 tests passed**, snapshots 0. Jest execution time 34.339 s. |
| Backend e2e / DB integration | `pnpm --dir apps/backend test:e2e` — не запускалась | — | BLOCKED | — | — | Отдельная тестовая БД не подтверждена; Docker daemon недоступен. Bootstrap выполняет migrations, тесты пишут и очищают fixtures. |
| Backend build | `pnpm --dir apps/backend build` | 16:14:01 | PASS | 0 | 12.91 | `nest build`, diagnostics отсутствуют. |
| Backend typecheck, дополнительно для CI parity | `pnpm --dir apps/backend typecheck` | 16:14:14 | PASS | 0 | 3.64 | `tsc --noEmit`, diagnostics отсутствуют. |
| Frontend lint | `pnpm --dir apps/frontend lint` | 16:13:34 | PASS | 0 | 34.58 | **0 errors, 17 warnings**; подробности ниже. |
| Frontend typecheck | `pnpm --dir apps/frontend typecheck` | 16:14:17 | PASS | 0 | 19.02 | `next typegen && tsc --noEmit`; route types generated successfully. |
| Frontend tests | `pnpm --dir apps/frontend test` | 16:14:36 | PASS | 0 | 34.74 | **8 suites, 60 tests passed**, snapshots 0. Jest execution time 33.104 s. |
| Frontend build | `pnpm --dir apps/frontend build` | 16:15:11 | PASS | 0 | 17.27 | Next.js/Turbopack production build; compilation и TypeScript прошли, static generation 17/17. |
| Backend coverage script | Отдельная команда отсутствует | — | NOT CONFIGURED | — | — | В manifest нет coverage script; Jest collection выключен, threshold не задан. |
| Frontend coverage script | Отдельная команда отсутствует | — | NOT CONFIGURED | — | — | Аналогично; произвольный `--coverage` не добавлялся по ограничению задачи. |
| Compose configuration | `docker compose config --quiet` | 16:12:11 | PASS | 0 | 0.41 | Успешная валидация и interpolation synthetic/default values без вывода rendered config. Это не проверка запуска контейнеров. |

### Дополнительные диагностические команды

| Команда | Статус | Exit | Время, s | Результат |
| --- | --- | --- | --- | --- |
| `docker info --format {{.ServerVersion}}` | BLOCKED | 1 | 0.37 | Docker API недоступен: `dockerDesktopLinuxEngine` pipe не найден. |
| `corepack pnpm --filter frontend exec tsc --noEmit` | PASS | 0 | 8.56 | Точная команда CI, выполнена до `next typegen` и build на копии без `.next`; diagnostics отсутствуют. |
| `corepack pnpm --filter backend list --depth -1 --json` | PASS | 0 | 0.44 | Selector разрешается в `@yuni/backend`. |
| `corepack pnpm --filter frontend list --depth -1 --json` | PASS | 0 | 0.47 | Selector разрешается в `@yuni/frontend`. |
| `pnpm --dir apps/backend exec jest --showConfig` | PASS | 0 | 0.79 | `collectCoverage=false`, `coverageThreshold=null`; Node environment. |
| `pnpm --dir apps/frontend exec jest --showConfig` | PASS | 0 | 0.75 | `collectCoverage=false`, `coverageThreshold=null`; Node по умолчанию, override jsdom в auth-context test. |
| `node ../env-probe.cjs` | PASS, диагностический probe | 0 | 1.47 | Default backend CWD не загрузил root `.env`; root CWD positive control загрузил synthetic fixture. Не проверка полноценного запуска приложения. |

Ошибка Docker, безопасная выдержка:

```text
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

Все исполненные package checks прошли. Ошибок исходного кода, приводящих к падению этих команд, в данном проходе не получено; недоступность daemon классифицирована как BLOCKED, а не как дефект Yuni.

## 4. Baseline observations: окружение

### Корневой `.env` при CWD `apps/backend`

**Автоматически не загружается в проверенной конфигурации.** Корневой script `dev:backend` вызывает `pnpm --dir apps/backend dev`, а `apps/backend/src/app.module.ts` передаёт в `ConfigModule.forRoot` `isGlobal`, `cache`, `validate`, `load`, но не `envFilePath`.

Установленный `@nestjs/config@3.3.0`, `dist/config.module.js:64–66`, по умолчанию использует `resolve(process.cwd(), '.env')`. Runtime probe вызвал настоящий ConfigModule с проектными `validateEnv`, `appConfig`, `authConfig`, без NestFactory, HTTP listener или Prisma connection.

Метод воспроизведения probe (`env-probe.cjs` — временный диагностический harness, не новый project script):

1. Загрузить `ts-node` с backend tsconfig, ConfigModule и три указанных проектных экспорта из изолированной копии.
2. Удалить из env дочернего процесса app-ключи из `ValidatedEnv`.
3. Перехватить только `fs.existsSync`/`fs.readFileSync` для `.env`: root-path возвращает synthetic `DATABASE_URL` и две synthetic JWT-заглушки достаточной длины; backend-path сообщает отсутствие файла. Реальные `.env` не читаются и не создаются.
4. При CWD `<copy>/apps/backend` вызвать `ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv, load: [appConfig, authConfig] })`.
5. Очистить app env и повторить с CWD `<copy>` как positive control.

Наблюдения:

```text
backend-cwd: consulted apps/backend/.env; databaseLoaded=false; accessSecretLoaded=false
Invalid backend environment:
- DATABASE_URL must be a PostgreSQL connection string
- JWT_ACCESS_SECRET must be at least 32 characters long
- JWT_REFRESH_SECRET must be at least 32 characters long
root-cwd-control: consulted .env; validation-passed; databaseLoaded=true; accessSecretLoaded=true
```

Exit 0 означает, что диагностический harness завершился, включая ожидаемое исключение negative case; он не означает успешную загрузку root `.env` из backend CWD. При внешнем экспорте переменных shell backend может получить их независимо от `.env`. Полный startup здесь не запускался; будущая задача должна отдельно выбрать и проверить способ загрузки окружения.

### `NODE_ENV` в корневом `.env.example`

Ключ отсутствует. Для локального запуска не является обязательным: `env.validation.ts` и `app.config.ts` предусматривают development-default. Compose задаёт его явно, e2e bootstrap устанавливает test-mode. Его добавление полезно как документация режима; для production режим должен задаваться явно. Отсутствие ключа само по себе не объясняет ошибки загрузки `DATABASE_URL`/JWT.

### `TEST_DATABASE_URL` в корневом `.env.example`

Ключ отсутствует и не требуется обычному backend runtime. Он используется в `test/profile-completion-e2e-environment.cjs:4` с fallback на `DATABASE_URL`; guard требует PostgreSQL URL и суффикс базы `_test` или `_ci`.

Для воспроизводимого локального e2e полезно документировать отдельный synthetic placeholder и способ передачи переменной процессу. Одного добавления в `.env.example` недостаточно: bootstrap читает `process.env`, отдельной загрузки root `.env` в нём нет. Суффикс имени — защитный guard, но не доказательство изоляции или разрешения на запись.

### Почему e2e заблокирован

Ни отдельный endpoint тестовой БД, ни её безопасная принадлежность не подтверждены. CLI Docker доступен, но daemon не отвечает. Реальные `.env` и DB credentials не использовались. `globalSetup` e2e вызывает `prisma migrate deploy`; шесть suites запускают временный HTTP listener, создают данные и выполняют cleanup. Запуск этих tests на неподтверждённой БД исключён. Migrations и DB readiness baseline остаются непроверенными.

## 5. Baseline observations: тесты и coverage

| Категория | Фактическая конфигурация / файлы | Что подтверждено |
| --- | --- | --- |
| Backend unit | `jest.config.cjs`, `src/**/*.spec.ts`; 20 файлов | 220 tests выполнены. Есть service/policy/serializer/security/rate-limit/config tests; Prisma и filesystem подменяются в соответствующих suites. |
| Backend HTTP e2e и DB integration | `jest.e2e.config.cjs`, `test/**/*.e2e-spec.ts`; 6 файлов | Существуют `profile-completion`, `media-path-params`, `match-block-chat`, `game-race`, `settings`, `user-data-export`; запуск BLOCKED. |
| Отдельный integration script | Не определён | NOT CONFIGURED; DB integration/race cases находятся в e2e-suite, не исчезают из inventory из-за отсутствия отдельного script. |
| Frontend unit/contract/smoke | `jest.config.js`, `**/*.test.ts`; 8 файлов | 60 tests выполнены: form-state, required-fields contract, message-render, auth-api, utils, avatar, smoke и auth-context. |
| Frontend React/jsdom | `lib/auth-context.test.ts`, `@jest-environment jsdom`, React Testing Library | Проверка AuthProvider/useAuth с API mock; не browser e2e и не общее покрытие визуальных компонентов. |
| Browser e2e / visual regression runner | Scripts/config Playwright/Cypress не обнаружены | NOT CONFIGURED в проверенном наборе scripts/config; ручной visual QA этим baseline не выполнялся. |
| Coverage collection/report/threshold | Оба `jest --showConfig`: collection false, threshold null; отдельные coverage scripts отсутствуют | NOT CONFIGURED как project check. Jest поддерживает coverage, но наличие runner не означает измеренное покрытие. Проценты и coverage reports в этом проходе не получены. |

Зелёные unit tests не подтверждают реальные DB constraints, migrations, transaction races или HTTP security wiring. Анализ силы assertions и полноты сценариев относится к следующему проходу аудита.

## 6. Baseline observations: предупреждения и generated files

- Frontend lint: 17 warnings, 0 errors — 10 `@next/next/no-img-element`, 4 `react-hooks/set-state-in-effect`, 1 `react-hooks/purity`, 2 `@typescript-eslint/no-unused-vars`. Это baseline warning count, без присвоения audit severity.
- Примеры точных мест: `app/(app)/profile/page.tsx:365` и `components/ui/carousel.tsx:98` — state in effect; `components/ui/sidebar.tsx:611` — `Math.random` во время render; `components/ui/use-toast.ts:18` и `hooks/use-toast.ts:18` — unused-vars. Пути в этом пункте относительно `apps/frontend`.
- Prisma CLI предупреждает о deprecated `package.json#prisma` и предстоящем удалении этой формы конфигурации в Prisma 7. Validate/generate текущей `6.19.3` проходят; миграция конфигурации не выполнялась.
- Next build сообщил отсутствие build cache; это ожидаемо для чистой временной копии, build прошёл.
- Сравнение Git blob hashes всех tracked файлов копии с audit SHA после checks выявило ровно одно изменение: `apps/frontend/next-env.d.ts`, импорт `./.next/dev/types/routes.d.ts` заменён на `./.next/types/routes.d.ts` в результате Next tooling. Это произошло только в копии; исходный checkout не менялся.
- Во временной копии созданы зависимости, Prisma Client, backend `dist`, frontend `.next` и TypeScript/cache artifacts. Такие побочные записи объясняют использование изоляции. Lockfile и остальные tracked файлы копии совпали с audit SHA.

## 7. Соответствие GitHub Actions

Сопоставлена конфигурация workflows на checked SHA, а не результат удалённого CI run. Remote jobs не запускались.

| Workflow / шаг | Локальное соответствие и ограничение |
| --- | --- |
| `quality-gates.yml`: Node setup, Corepack | CI использует Ubuntu и Node 22, baseline — Windows и Node 24.19.0. Corepack/pnpm не закреплены корневым `packageManager`; здесь pnpm и Corepack pnpm оба 11.23.0. `corepack enable` локально не выполнялся, так как shims уже доступны. |
| Frozen install | CI: `corepack pnpm install --frozen-lockfile`; локально та же операция через pnpm. Изоляционная разница: `HUSKY=0`, Git hooks не устанавливались. |
| Prisma validate/generate | CI: `corepack pnpm --dir apps/backend prisma:validate` и `prisma:generate`; проверены те же scripts. |
| Backend tests/build/lint/typecheck | CI: `corepack pnpm --filter backend test`, `build`, `lint`, `typecheck`; локально те же scripts через `--dir apps/backend`. Selector `backend` отдельно подтверждён. |
| Backend migrations и e2e | CI объявляет отдельный Postgres service и передаёт `DATABASE_URL`/`TEST_DATABASE_URL`; сначала `prisma:migrate:deploy`, затем `test:e2e`. GlobalSetup также вызывает migrate deploy. Локально эти DB-операции BLOCKED; повторный deploy не оценивался как defect. |
| Frontend tests/lint/build | CI: `corepack pnpm --filter frontend test`, `lint`, `build`; локально соответствующие scripts прошли. Selector `frontend` подтверждён. |
| Frontend typecheck | CI напрямую вызывает `corepack pnpm --filter frontend exec tsc --noEmit`; local script вызывает `next typegen && tsc --noEmit`. Обе команды прошли, но CI-шаг сам не генерирует route types. Они не являются идентичными проверками. |
| Root aggregate scripts | `check:backend` не включает e2e и backend typecheck; `check:frontend` не включает tests. Поэтому один root `check` не эквивалентен полному quality-gates workflow; baseline использовал отдельные scripts. |
| Coverage | Отдельного coverage шага в workflows нет. |
| Compose | `docker compose config --quiet` проверен локально; quality-gates workflow не содержит такого шага. |
| `application-images.yml` | Build/push GHCR images, без deployment приложения. В baseline SKIPPED: публикация не входит в scope, daemon недоступен; image builds не подтверждены. |
| `hugo-deploy.yml` | Hugo build и GitHub Pages deployment документации. SKIPPED: это не запрошенные app checks; публикация не выполнялась. |

## 8. Итог и состояние рабочего дерева

- Все выполненные package scripts завершились с exit 0; frontend lint имеет 17 warnings. Backend: 220 passed; frontend: 60 passed.
- BLOCKED: безопасный запуск backend e2e/DB integration и доступ к Docker daemon. Проверка Compose syntax/interpolation при этом PASS.
- Coverage scripts/thresholds не настроены; процент покрытия неизвестен. Root `.env` не подхватывается default ConfigModule из backend CWD; это отдельное наблюдение, не исправленное в baseline.
- Перед созданием отчёта повторный `git status -sb` всё ещё показывал только `## chore/pre-audit-setup`. Checks не добавили tracked/untracked файлов в исходный checkout.
- После создания: единственное изменение — untracked `docs/audits/yuni-2026-09/02-BASELINE.md`; staged changes и изменения существующих tracked файлов отсутствуют. Commit не создавался, checked SHA не изменялся.
- Финальные команды: `git status -sb`, `git diff --check`, `git diff -- docs/audits/yuni-2026-09/02-BASELINE.md`. `git diff --check` прошёл без diagnostics. Для нового untracked файла обычный `git diff` пуст; содержимое дополнительно проверено без whitespace diagnostics через `git diff --no-index --check -- /dev/null docs/audits/yuni-2026-09/02-BASELINE.md`, без staging.

Baseline фиксирует выполненные проверки и их ограничения. E2e/migrations, контейнерный runtime, полнота тестового покрытия и production readiness этим результатом не подтверждены.
