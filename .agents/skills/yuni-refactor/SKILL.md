---
name: yuni-refactor
description: Safely implement approved Yuni refactors, reduce coupling and spaghetti code, improve maintainability without unintended behavior changes, and remove only verified unused dependencies. Use only with explicit scope and acceptance criteria.
---

# Yuni refactor

## 1. When to use

- Используй для accepted audit finding, подтверждённой code-review проблемы или явно согласованного технического долга.
- Выполняй безопасное упрощение либо удаление подтверждённо неиспользуемой зависимости только при явных scope и acceptance criteria; finding сам по себе не разрешает изменения.

## 2. Preconditions

- Прочитай `AGENTS.md`, локальные инструкции, относящиеся ADR из `docs/decisions/`, `docs/QUALITY_GATES.md` и `docs/AI_REVIEW_PROTOCOL.md`.
- Зафиксируй branch, полный commit SHA и `git status -sb`; определи исходные пользовательские изменения и не включай их в свою работу.
- Определи точный scope, сохраняемое externally observable behavior, acceptance criteria и обязательные проверки из задания и фактических scripts.
- Проверь scope-check: для критических областей из `AGENTS.md` получи явное подтверждение owner/reviewer до кода, даже при сохранении поведения. Используй уже данное согласование, не запрашивай его повторно.
- Получи owner approval до изменения product behavior; без него сохрани поведение или останови зависимую работу.
- Убедись, что работа идёт в правильной отдельной ветке; если нужно создать ветку, используй `codex/` по умолчанию. Не коммить и не пушь в `main`.
- Не начинай широкий рефакторинг при грязном рабочем дереве; согласуй изоляцию. Не выполняй автоматический reset, stash или удаление чужих изменений.
- Для audit remediation прочитай исходный отчёт и `docs/audits/yuni-2026-09/03-FINDINGS.md`; перепроверь проблему на текущем SHA, не реализуй baseline observations автоматически.

## 3. Refactoring principles

- Сохраняй externally observable behavior, если изменение не согласовано; делай минимальный законченный diff.
- Не смешивай рефакторинг, массовое форматирование и новую функцию; не переписывай рабочий модуль целиком без доказанной необходимости.
- Не создавай abstraction ради меньшего числа строк и новый слой без доказанного снижения coupling или устранения реального дублирования.
- Предпочитай понятный код clever-коду; сохраняй module boundaries и проверяй существующий подход Yuni вместо навязывания нового.
- Не ослабляй validation, authorization, privacy и data integrity; сохраняй применимые owner/block/report/rate-limit/serializer/media invariants из `AGENTS.md`.
- Не подавляй ошибки и не используй type assertions или отключение lint вместо правильного решения.
- Считай документацию источником заявлений; проверяй реализацию по code/configuration, schema/migrations, runtime, tests и CI. Не принимай generic best practice автоматически.

## 4. Anti-spaghetti workflow

1. Определи responsibility проблемного участка и доказанные последствия coupling.
2. Построй callers, callees и impact area через MCP CodeGraph; проверь связи по исходному коду. При недоступности используй `rg`/`rg --files` и явно укажи ограничения.
3. Найди дублируемую доменную логику и проверь, действительно ли это одно бизнес-правило.
4. Определи подходящую границу модуля по подтверждённым контрактам и ADR, не выдумывай архитектурное решение.
5. Проверь существующий подход Yuni и применимость альтернатив.
6. Предложи маленький план в пределах согласованного scope.
7. Меняй одну responsibility за шаг; не переноси прежнее смешение ответственности в новый файл.
8. После каждого шага запускай релевантные проверки; повторяй более широкие checks при новых изменениях или рисках.

Применяй следующие предпочтения только при доказанной пользе в scope, не как требование переписать код:

- Предпочитай ранние returns глубокой вложенности и небольшие именованные функции монолитной процедуре.
- Делай data flow явным вместо скрытых side effects; держи domain logic вне UI/transport в рамках подтверждённых границ.
- Поддерживай единый источник бизнес-правила; предпочитай dependency injection скрытым глобальным зависимостям.
- Предпочитай composition необоснованному inheritance; обоснуй каждую новую abstraction.

## 5. Dependency-removal workflow

- Удаляй пакеты только в явно согласованном scope; один статический поиск не доказывает ненужность.
- Определи workspace и runtime/dev/peer/optional роль пакета; проверь imports, require, dynamic import и type-only usage.
- Проверь package scripts, configuration files, Next.js, NestJS, Prisma, Jest и build-конфигурацию.
- Проверь CI, Docker, peer/optional requirements, CLI-инструменты, generated code и build-time usage.
- Выполни `pnpm why <package>` в соответствующем workspace; проверь transitive consumers, не считай отсутствие direct import доказательством.
- Запиши evidence отсутствия использования по всем каналам, SHA, границы поиска и обоснование безопасности удаления.
- Если доказательств недостаточно, оставь зависимость и укажи `Unknown` либо предложение `Deferred` с причиной; не меняй статус registry без разрешения владельцев.
- Удаляй через pnpm только из правильного workspace, по одному пакету или небольшой логической группе, отдельным понятным изменением.
- Не редактируй lockfile вручную; проверь, что package manager не внёс несвязанные обновления.

После удаления выполни и зафиксируй:

- `pnpm install --frozen-lockfile` либо эквивалентную проверку согласованности lockfile.
- Lint, typecheck, tests и build затронутого workspace по реальным scripts; для отсутствующей команды укажи NOT CONFIGURED и согласованную альтернативу.
- Prisma validate/generate, если применимо к backend; учитывай generated artifacts в expected changed files.
- `docker compose config --quiet`, если пакет связан с инфраструктурой; используй безопасные synthetic значения, не открывай/не выводи `.env` или реальные secrets.
- Поиск оставшихся упоминаний пакета, проверку CI/config и diff package manifest/lockfile.

## 6. Tests and behavior protection

- До рефакторинга найди существующие тесты и проверь, защищают ли assertions изменяемое поведение, а не implementation details.
- При необходимости сначала добавь regression test в согласованном scope и зафиксируй исходный результат; не ослабляй тест ради прохождения неправильного изменения.
- Если критическое поведение не защищено, останови изменение этого поведения до появления проверяемой защиты; предложи необходимый тест и согласуй расширение scope, если оно нужно.
- После изменения запускай релевантные unit tests, negative/boundary cases и сравнивай поведение до/после.
- Запускай integration/e2e только при подтверждённых изоляции, synthetic fixtures и безопасности операций; имя тестовой БД не доказывает безопасность.
- Фиксируй точные команды, exit codes, результаты и невыполненные проверки; при падении продолжай независимые безопасные checks, не заявляй успех всего изменения.

## 7. Performance rules

- Не оптимизируй без доказанного bottleneck; не добавляй memoization автоматически и не усложняй алгоритм ради теоретического выигрыша.
- Перед performance-refactor зафиксируй измерение, SHA, inputs и условия; после повтори сравнимый замер.
- Оцени memory, database queries, network и bundle/build size вместе с целевой метрикой; отдели измеренный эффект от предположения.

## 8. Change boundaries

Получай отдельное явное разрешение на следующие изменения, если они ещё не включены в согласованный scope:

- API contract, database migration и authentication/authorization.
- Удаление публичного export, массовое переименование и смену framework/библиотеки.
- Product behavior, breaking change и большой cross-module rewrite.

Не расширяй scope молча; вынеси необходимое новое решение владельцам до зависимых изменений.

## 9. Validation matrix

Выбирай применимые проверки по заданию и фактическим scripts; не выдумывай команды и не запускай весь baseline автоматически:

| Область | Проверки |
| --- | --- |
| Backend | Lint; typecheck/build; unit tests; safe integration/e2e; применимые Prisma validate/generate. |
| Frontend | Lint; typecheck; tests; build; loading/error/empty states. При изменении вёрстки соблюдай `CLAUDE.md` visual QA и viewport/двусторонние ограничения из `AGENTS.md`. |
| Database | Schema validation; migration review; constraints; transaction behavior; query plan при заявленной оптимизации. Не запускай migrations на рабочей БД. |
| Dependencies | Install/lockfile check; lint/typecheck/tests/build; package search; CI/config verification и дополнительные проверки раздела 5. |

Выполняй checks с записью данных только в подтверждённом безопасном окружении. Обозначай неприменимое, NOT CONFIGURED, BLOCKED и SKIPPED отдельно от PASS.

## 10. Output format

Верни следующие сведения, не выдавая план за выполненную работу:

- Approved scope, branch, исходный и проверенный SHA, changed files and symbols.
- Что упрощено, какое поведение сохранено и какие изменения поведения явно одобрены.
- Удалённые зависимости и evidence безопасности по каждой либо «нет».
- Выполненные проверки, команды и результаты, включая блокеры и пропуски.
- Остаточные риски, follow-up findings/вопросы и документационное влияние.
- Git diff summary и финальный git status; отдели свои изменения от исходных.

Не редактируй центральный findings registry без явного разрешения и не удаляй Rejected записи. Не объявляй Implemented исправление Verified до независимого recheck.
Для meaningful changes выполни независимый первый blind review по `docs/AI_REVIEW_PROTOCOL.md`, передав diff, scope, документы и checks без executor chat/скрытых рассуждений.
Соблюдай Git workflow `AGENTS.md`: не используй `git add .`/`git add -A`, не выполняй rebase или destructive Git без согласования; PR и merge оставь владельцу.

## 11. Stop conditions

Останови зависимую работу и запроси решение владельцев, если:

- Scope расширяется либо требуется ещё не одобренное изменение product behavior.
- Нет безопасной тестовой среды для необходимой проверки или защиты критического поведения тестами.
- Обнаружено неразрешённое противоречие ADR/источников или невозможно сохранить backward compatibility в согласованных границах.
- Нельзя доказать безопасность удаления зависимости; оставь пакет на месте.
- Обнаружен возможный секрет/PII: прекрати чтение/вывод, не открывай `.env`, не копируй значения, сообщи только безопасное описание.
- Требуется разрушительная команда; не выполняй её по умолчанию.

Сохрани текущий diff и безопасное evidence блокера, не делай автоматический rollback/reset. Продолжай только независимую разрешённую работу; не запрашивай заново уже данное согласование.

## 12. Completion checklist

- [ ] Проверь, что scope не расширен, поведение сохранено либо изменение одобрено.
- [ ] Докажи, что spaghetti code уменьшен, а не перемещён; обоснуй новые abstractions.
- [ ] Подтверди evidence удаления зависимостей и изменение lockfile только package manager-ом, если применимо.
- [ ] Выполни обязательные проверки; при блокерах не объявляй работу полностью проверенной.
- [ ] Укажи документационное влияние; обновляй документы только в разрешённом scope.
- [ ] Проверь `git diff --check`, полный scoped diff и `git status -sb`; исключи случайные изменения и сверь expected changed/staged files.
