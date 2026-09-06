---
name: yuni-code-review
description: Review Yuni code changes for correctness, security, maintainability, architectural consistency, spaghetti code, test gaps, performance risks, and unnecessary dependencies. Use for read-only review of diffs, branches, pull requests, modules, or proposed changes. Do not use to modify code.
---

# Yuni code review

## 1. When to use

- Используй для read-only review branch, pull request, git diff, нового модуля или функции и повторной проверки исправлений.
- Проверяй архитектурную согласованность, spaghetti code, тесты, performance и зависимости только в заявленном scope.

## 2. Do not use

- Не изменяй код, не выполняй массовый рефакторинг и не удаляй зависимости во время review.
- Не добавляй stylistic nitpicks, уже покрываемые formatter/linter; не назначай P0/P1 без конкретного evidence риска.

## 3. Required context

- Прочитай `AGENTS.md`, локальные инструкции, `docs/AI_REVIEW_PROTOCOL.md`, `docs/QUALITY_GATES.md` и относящиеся ADR из `docs/decisions/`.
- Зафиксируй ветку, полный SHA (`git branch --show-current`, `git rev-parse HEAD`) и `git status -sb`; отдели незакоммиченный diff от commit evidence.
- Определи scope, base/head для сравнения, фактический diff, changed files и ожидаемое поведение из задания/контракта. Для review модуля без diff перечисли точные файлы и ограничение метода.
- Выполняй первый независимый review blind: используй задание, SHA/diff, документы, файлы и checks без executor chat и скрытых рассуждений.
- Сначала используй MCP CodeGraph для поиска символов, связей и impact area; затем открой соответствующие исходники, callers/callees и тесты на проверяемой версии.
- Не считай граф доказательством без кода; при недоступности CodeGraph используй `rg`/`rg --files`, явно укажи ограничения, не меняй tooling configuration.
- Для audit-related review прочитай `docs/audits/yuni-2026-09/01-AUDIT-CHARTER.md`, `02-BASELINE.md` и `03-FINDINGS.md` в том же каталоге; используй baseline только как исходные наблюдения.
- Выбирай безопасные checks по фактическим scripts и scope; не запускай весь baseline автоматически. Проверки с записью выполняй только в согласованной изолированной копии с synthetic fixtures.
- Не открывай `.env`, secrets или реальные PII. При возможном секрете останови чтение/вывод и сообщи владельцу безопасное описание; при разрушительной проверке или неподтверждённой безопасности БД останови зависимую проверку.
- При неразрешимом evidence противоречии источников зафиксируй блокер и запроси решение владельца; продолжай только независимые разрешённые проверки.

## 4. Review priority

Проверяй в следующем порядке; не позволяй стилю отвлекать от функциональных проблем:

1. Correctness.
2. Security and authorization.
3. Data integrity.
4. Business behavior.
5. Architecture and coupling.
6. Test reliability.
7. Error handling.
8. Performance.
9. Dependency impact.
10. Readability and maintainability.

## 5. Spaghetti-code review

- Проверь циклы, направление слоёв, обход публичных интерфейсов модулей и зависимость domain logic от framework/UI деталей.
- Проверь бизнес-логику в controller/UI и доступ к БД из неподходящего слоя относительно подтверждённых границ Yuni.
- Ищи god-service/component/module, длинные функции, глубокую вложенность и utility-файлы без ясной ответственности.
- Проверь скрытые side effects, дублирование доменных правил, temporal coupling и shared mutable state.
- Оцени чрезмерный fan-in/fan-out и случаи, когда одна функция требует изменений во многих несвязанных местах.
- Проверь ненужные abstractions и premature generalization; не предписывай новую архитектуру по одному такому сигналу.
- Оцени cohesion, coupling, responsibility и impact radius с примерами последствий; количество строк само по себе не доказывает дефект.

## 6. Correctness and security review

- Проверь positive, negative и boundary cases, обработку ошибок, safe defaults и backward compatibility.
- Раздели authentication и authorization; проверь owner checks и доступ к чужим данным, не полагайся на frontend flags.
- Проверь validation внешнего ввода, privacy/visibility, block/report, anti-spam/rate limits и применимые media invariants из `AGENTS.md`.
- Проверь транзакции, частично выполненные операции, concurrency/races и восстановление после ошибок.
- Проверь serializers и отсутствие утечек внутренних ошибок, raw rows, secrets, PII и storage paths; используй только безопасное evidence.

## 7. Test review

- Установи, защищает ли тест реальное поведение и почему он упадёт при неправильной реализации; отдели анализ assertions от выполненного теста.
- Проверь over-mocking, happy-path-only, слабые assertions, отсутствующие regression tests и привязку к implementation details.
- Найди случаи, где unit недостаточен и нужна integration/e2e проверка; mock-pass не доказывает runtime/DB-поведение.
- Не меняй код ради проверки силы теста; mutation testing допускай только как отдельно согласованную проверку в изолированной копии.
- Запиши выполненные команды, результаты и пропуски; не используй реальную БД без подтверждённых изоляции и разрешения на операции.

## 8. Dependency review

- Для подозрительного пакета определи workspace и тип: runtime/dev/peer/optional; проверь прямые, dynamic, require и type-only imports.
- Проверь scripts, configuration, CLI, CI, Docker, build, generated code и tests, а также transitive/peer requirements; используй `pnpm why <package>` в нужном workspace.
- Не считай отсутствие обычного import доказательством ненужности; явно фиксируй границы поиска.
- Присвой `Used`, если найден проверенный потребитель; `Probably used`, если есть признаки использования, но путь ещё не подтверждён.
- Присвой `Candidate for removal`, если поиск выявил основания для проверки удаления, но безопасность ещё не доказана.
- Присвой `Confirmed unused` только после проверки всех перечисленных каналов и отсутствия требований потребителей; укажи SHA и ограничения evidence.
- Присвой `Unknown`, если данных недостаточно; оставь пакет на месте при любом результате read-only review.

## 9. Evidence rules

- Для каждого замечания укажи файл, символ, конкретное поведение, evidence, риск, рекомендацию, confidence и способ проверки исправления.
- Привяжи evidence к SHA, устойчивому диапазону строк, команде/exit code/результату, runtime reproduction или test result; укажи условия и ограничения.
- Отдели `Confirmed` (прямое evidence), `Inferred` (обоснованная гипотеза) и `Unknown` (недостаточно данных) от lifecycle-статуса finding.
- Используй документацию как источник заявлений, а не доказательство реализации; проверяй код, конфигурацию, schema/migrations, tests и CI на соответствующем SHA.
- Обоснуй severity последствиями и условиями, confidence — силой evidence; не превращай baseline observation или generic best practice в finding без отдельной проверки.
- Связывай симптомы одной причины; сохраняй rejected hypotheses и основания. Предлагай применимое решение с альтернативами, не объявляй рекомендацию обязательной архитектурой.

## 10. Output format

Верни следующие пункты; при отсутствии результатов укажи «нет», не придумывай замечаний:

- Scope, полный commit SHA, comparison base/head и methods/checks used.
- Reviewed files and symbols.
- Blocking issues и non-blocking issues с evidence.
- Spaghetti-code observations и test gaps.
- Dependency candidates с классификацией и evidence.
- Rejected hypotheses с основаниями.
- Blind spots, blocked/skipped checks и минимальная следующая проверка.
- Verdict: `Approve`, `Approve with non-blocking comments`, `Changes required` или `Blocked by missing evidence`.

Выбери `Approve` при завершённых необходимых проверках без issues, второй verdict — только при неблокирующих замечаниях; `Changes required` — при доказанном блокирующем дефекте. Выбери `Blocked by missing evidence`, если отсутствует evidence, необходимое для решения; явно сохрани уже доказанные issues.
Не изменяй центральный findings registry без явного разрешения; для предложений audit findings используй prefix/template из `03-FINDINGS.md`. Не удаляй rejected записи и не объявляй исправление Verified без независимой проверки.
Сохраняй отчёт только в разрешённый output-файл либо верни в ответе; не выполняй commit, push, открытие PR или merge в рамках review.

## 11. Completion checklist

- [ ] Убедись, что код, tests и configuration не изменены.
- [ ] Просмотри весь scoped diff либо все заявленные файлы модуля; укажи пробелы, не заявляй полноту при пропусках.
- [ ] Проверь связанные вызовы, тесты и применимые security/data integrity invariants.
- [ ] Подтверди dependency claims и severity evidence; явно укажи uncertainty.
- [ ] Проверь финальный `git status -sb`, сравни с исходным и объясни появившиеся файлы; не исправляй чужие изменения.
