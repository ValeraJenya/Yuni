---
name: yuni-audit
description: Run evidence-based read-only technical audit passes for Yuni, including architecture, spaghetti code, testing reliability, security, backend, frontend, database, performance, DevOps, and documentation. Do not use for implementing fixes or ordinary feature development.
---

# Yuni audit

## 1. When to use

- Используй для запуска конкретного технического audit-pass Yuni, повторной проверки finding или cross-review результатов.
- Выполняй только выбранный проход; не превращай локальную проверку в полный аудит.

## 2. Do not use

- Не используй для обычной разработки функций, автоматического исправления проблем или массового рефакторинга.
- Не создавай выводы о проекте без проверяемого evidence.

## 3. Required inputs

Прочитай перед работой файлы относительно корня репозитория:

- `AGENTS.md`.
- `docs/audits/yuni-2026-09/01-AUDIT-CHARTER.md` — метод, severity, confidence и review.
- `docs/audits/yuni-2026-09/02-BASELINE.md` — исходное состояние и ограничения проверок.
- `docs/audits/yuni-2026-09/03-FINDINGS.md` — ID prefixes, статусы и detailed finding template.
- Затем прочитай документы, локальные инструкции и код только затронутой области; расширяй чтение по доказанным зависимостям в пределах scope.

## 4. Preflight

- Зафиксируй дату, ветку через `git branch --show-current`, полный SHA через `git rev-parse HEAD` и исходный `git status -sb`.
- Подтверди audit-pass, проверяемые вопросы, границы и точный разрешённый output-файл из задания; запроси недостающий обязательный scope до зависимых действий.
- Сверь выбранный SHA с baseline и предыдущим evidence; явно укажи различия, не смешивай результаты разных commits.
- Не изменяй production code, tests или configuration; сохраняй только согласованный audit output. Не включай чужие незакоммиченные изменения в evidence фиксированного SHA.
- До запуска checks проверь реальные scripts, побочные записи и доступ к БД. Используй согласованную изолированную копию и synthetic fixtures для проверок с записью; не запускай весь baseline автоматически.

## 5. Evidence workflow

- Проверяй по порядку charter: runtime behavior → production code/configuration → schema/migrations → tests → CI; документацию используй только как источник заявлений.
- Для каждого вывода отдельно пометь `Confirmed` (прямое evidence), `Inferred` (обоснованная гипотеза) или `Unknown` (данных недостаточно); не смешивай эту оценку со статусом finding.
- Запиши checked SHA, paths, symbols, устойчивые строки, предусловия, команду, результат и ограничения воспроизведения. Для запущенного check сохрани exit code и длительность.
- Отдели реально исполненные проверки от предложенных; явно обозначь BLOCKED/SKIPPED и blind spots. Не считай mock-тест доказательством runtime/DB-поведения.
- При обычном падении check сохрани безопасное evidence и продолжай независимые разрешённые проверки; условия остановки применяй по разделу 10.

- Возвращай доказанно корректный ограниченный invariant как assurance candidate с evidence, negative checks, coverage boundaries, commit SHA, environment, датой и reverification trigger; отсутствие finding или только зелёный тест недостаточны.
- Используй правила `docs/audits/yuni-2026-09/06-ASSURANCE-REGISTER.md`; не редактируй Assurance Register без явного разрешения. Candidate не означает независимое подтверждение.

## 6. CodeGraph workflow

- Сначала используй доступные MCP-инструменты CodeGraph для поиска символов, зависимостей и impact area; начни с symbol search, затем запроси связи или контекст.
- Открой релевантный исходный код и проверь каждую используемую связь на выбранном SHA; не считай граф достаточным доказательством.
- При недоступности CodeGraph продолжай через `rg`/`rg --files` и чтение кода; явно запиши недоступность и ограничения поиска. Не меняй конфигурацию tooling ради аудита.

## 7. Finding workflow

- Описывай одну основную проблему на finding по шаблону `03-FINDINGS.md`; отделяй наблюдение, risk, root cause и решение для Yuni.
- Используй prefix и короткий формат ID из `03-FINDINGS.md`; согласуй выделение ID с основной моделью, проверь коллизии и не переименовывай существующие ID.
- Обоснуй severity последствиями и условиями возникновения; не назначай P0/P1 только из-за сложности или размера файла.
- Перепроверь baseline observation отдельно перед предложением finding. Свяжи симптомы одной причины и дубли; не копируй observations в findings автоматически.
- Не редактируй центральный registry без явного разрешения; сохрани предложения и ссылки в разрешённом output-файле. Не удаляй Rejected findings или историю review.
- Оставляй новые выводы `Proposed` до независимого подтверждения; при cross-review используй статусы registry. Не приравнивай реализацию исправления к `Verified`.
- Выполняй первый независимый review blind по `docs/AI_REVIEW_PROTOCOL.md`: используй scope, SHA/diff, файлы и checks без executor chat и скрытых рассуждений.

## 8. Best-practice workflow

- Не превращай generic recommendation в обязательное правило автоматически.
- Укажи конкретную проблему, применимость к Yuni, существующее решение, альтернативы и компромиссы внедрения.
- Предпочитай официальную документацию и первичные источники; фиксируй версию/дату и проверяй применимость, а не только авторитет источника.
- Возвращай предложение со статусом `Candidate` до cross-review; принятие владельцами и изменение ADR/guideline/skill оформляй отдельно от read-only прохода.

## 9. Audit-pass output

Верни в согласованном output-файле следующие разделы; при отсутствии результатов укажи «нет», не придумывай записи:

- Scope и полный commit SHA.
- Methods/tools used, включая ограничения CodeGraph.
- Files and symbols reviewed.
- Confirmed findings с evidence и результатом независимого review.
- Proposed findings с evidence и недостающей проверкой.
- Rejected hypotheses с основанием отклонения и сохранёнными связями.
- Blind spots and blocked checks.
- Best-practice candidates.
- Assurance candidates с evidence, границами проверки и условиями recheck.
- Recommended next verification: минимальные проверки оставшихся вопросов.

## 10. Stop conditions

Останови затронутую проверку и запроси решение владельцев до её продолжения, если:

- Противоречие источников нельзя разрешить имеющимся evidence и безопасной дополнительной проверкой.
- Требуется разрушительная команда; не выполняй её в рамках read-only scope.
- Требуется реальная production/test database без подтверждённой изоляции, безопасности и разрешения на конкретные операции; суффикс имени БД не является подтверждением.
- Требуется изменить product behavior; вынеси это в отдельное решение, не исправляй во время аудита.
- Обнаружены возможные секреты или персональные данные; прекрати чтение/вывод чувствительного содержимого, сообщи только безопасное описание без значений.

Зафиксируй блокер и его влияние на выводы; продолжай только независимые разрешённые проверки, которым он не препятствует.

## 11. Completion checklist

- [ ] Убедись, что source code, tests и configuration не изменены.
- [ ] Проверь воспроизводимость evidence и привязку к SHA; обозначь невыполненные проверки.
- [ ] Обоснуй severity и явно укажи uncertainty.
- [ ] Свяжи дубли, сохрани ID и историю отклонённых выводов.
- [ ] Проверь финальный `git status -sb` и `git diff --check`; сопоставь changed/untracked files с разрешённым output.
- [ ] Проверь соответствие output charter и шаблону registry; не объявляй незавершённые или заблокированные проверки успешными.
