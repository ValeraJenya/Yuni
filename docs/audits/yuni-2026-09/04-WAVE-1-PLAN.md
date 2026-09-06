# Yuni — Wave 1 Plan

Дата подготовки: 2026-09-06. Координационный план; audit commit и tag: **Pending**, определяются отдельным шагом до запуска.
Основания: [Pre-Audit Plan](00-PRE-AUDIT-PLAN.md), [Audit Charter](01-AUDIT-CHARTER.md), [Baseline](02-BASELINE.md), [Findings Register](03-FINDINGS.md) и repo-skill `yuni-audit`.
Scope создания: только этот документ; аудит, создание `passes/`, отчётов проходов, findings, tag и commit не выполняются. `AGENTS.md` не изменяется по ограничению владельца: план конкретизирует charter, не заменяя общие правила проекта.

## 1. Goal

- Выявить наиболее системные риски до детального frontend/backend-аудита тремя независимыми проходами.
- Не исправлять код и не добавлять findings в центральный реестр до cross-review.
- Работать относительно одного зафиксированного audit commit; исторический baseline не назначает SHA первой волны автоматически.

## 2. Shared rules

- Перед каждым pass активировать `.agents/skills/yuni-audit/SKILL.md`; прочитать `AGENTS.md`, charter, baseline, registry и документы только затронутой области.
- Зафиксировать branch, полный `git rev-parse HEAD`, дату/часовой пояс и исходный `git status -sb`; сверить SHA с общим audit commit и разрешение tag в тот же commit.
- Начинать с чистого checkout исходников; координатор до запуска задаёт точные пути, вопросы, проверки и output для каждого агента. Не смешивать незакоммиченный код с evidence audit SHA.
- При общем checkout учитывать только заранее разрешённые отчёты других pass как ожидаемые новые файлы; не читать их до окончания первичного анализа. Не очищать чужие изменения; при неожиданном diff остановить зависимую работу.
- Сначала использовать доступные MCP-инструменты CodeGraph для навигации; сверять symbols/relations с исходным кодом на audit SHA. Документацию считать источником заявлений, а не доказательством реализации.
- Отделять `Confirmed`, `Inferred` и `Unknown` как оценку evidence/причины от lifecycle-статуса finding; не превращать baseline observations в findings без новой проверки.
- Не изменять production code, tests, configs, package files или lockfile; каждый pass пишет только в свой output-файл. Не создавать commit, tag, PR и не выполнять публикацию из pass.
- Не запускать разрушительные команды и не использовать реальную БД без подтверждённых изоляции, безопасности и разрешения на конкретные операции; использовать synthetic fixtures.
- Проверять реальные scripts и побочные записи до запуска checks. Проверки с записью разрешать только в согласованной изолированной копии; не запускать baseline целиком автоматически.
- Не открывать `.env`, tokens, cookies, private keys, dumps или реальные PII. При возможном чувствительном содержимом прекратить чтение/вывод, сообщить безопасное описание без значений.
- При недоступности CodeGraph продолжить через `rg`/`rg --files` и чтение кода, записать ограничения; не менять tooling configuration ради прохода.
- Неразрешимые противоречия evidence, потребность изменить поведение или небезопасная проверка требуют остановки зависимого шага и решения владельцев по skill. Независимые безопасные checks продолжать; FAIL/BLOCKED/SKIPPED не считать PASS.

Отсутствие заранее согласованных SLO, RPO/RTO и production topology не блокирует запуск Wave 1: эти решения остаются отдельными вопросами последующих этапов. Требования единого audit SHA, scope и безопасности проверок сохраняются.
Разделы master-checklist 121–124 не включаются полностью в Wave 1: они относятся к отдельному Consistency/Idempotency pass. Пересекающиеся критические риски и invariants отмечать для последующей проверки, не переносить всю failure matrix в три первичных прохода.

## 3. Pass A — Architecture and Spaghetti Code

Scope:

- Построить фактическую карту модулей, основные data flows и trust boundaries; составить inventory условных компонентов по коду/configuration, не по примерам master.
- Не считать отсутствие Redis, queues, WSS, product AI, payments, replicas и других необязательных технологий проблемой; неподтверждённое наличие оставлять Conditional.
- Module boundaries, dependency direction и circular dependencies.
- God-services, god-components и god-modules; смешивание transport, UI, domain и data-access logic.
- Duplicated business rules, hidden side effects и temporal coupling.
- High fan-in/fan-out и excessive impact radius.
- Premature abstractions и framework leakage в domain logic.
- Большие файлы рассматривать только как сигнал; оценивать cohesion, coupling, responsibility и последствия, не создавать finding по числу строк.

Обязательные инструменты и методы:

- Использовать CodeGraph profile `graph`, если он доступен; проверить фактически доступные инструменты, не предполагать наличие профиля по старому отчёту о `core`.
- Исследовать symbol, callers, callees, dependencies и impact analysis через доступные инструменты; недоступные операции обозначить и компенсировать поиском исходников.
- Вручную проверить соответствующий код и подтверждённые границы; граф сам по себе не доказывает архитектурный дефект.

Output: `docs/audits/yuni-2026-09/passes/wave-1/01-ARCHITECTURE-SPAGHETTI.md`.
Владелец кандидатов: Pass A; ID-prefix: `ARCH`.

## 4. Pass B — Test Reliability

Scope:

- Использовать ограниченную репрезентативную выборку: обязательно рассмотреть auth/session, ownership/cross-user, transaction/rollback и meaningful frontend tests; указать критерии отбора и непроверенные области. Если нужных тестов нет, зафиксировать gap, не создавать их во время pass.
- Weak assertions, happy-path-only и excessive mocking.
- Tautological tests, tests of implementation details и expected values, повторяющие production algorithm.
- Missing negative/boundary cases, auth и cross-user permission tests.
- Transaction/rollback coverage и flaky/order-dependent tests.
- Meaningful frontend tests и e2e gaps; отделять наличие test script от реально защищённого поведения и coverage.
- Возможность выборочного mutation testing для проверки силы assertions.

Не проводить массовую мутацию проекта. Выполнять read-only анализ; при необходимости временной проверки сначала согласовать конкретный mutation scope и изолированную копию по charter. Не изменять baseline checkout и не подключать рабочие данные.
Исторические ограничения e2e/БД/Docker из baseline перепроверять безопасно; отсутствие подтверждённой среды оставлять BLOCKED, не считать unit/mock pass заменой integration evidence.

Output: `docs/audits/yuni-2026-09/passes/wave-1/02-TEST-RELIABILITY.md`.
Владелец кандидатов: Pass B; ID-prefix: `TEST`.

## 5. Pass C — Security and Data Integrity

Scope:

- Создать ограниченную auth/session policy matrix: сценарий, ожидаемое поведение access/refresh credentials, источник policy, фактическое evidence и ограничения.
- Unresolved logout/revocation/role-change policy отметить `Owner Decision Required`; не выводить ожидаемую policy только из текущего кода. Остановить зависящий от решения вывод и продолжить независимые безопасные проверки.
- Authentication, authorization, access to another user's data и JWT/refresh-session lifecycle.
- Input validation, file uploads, secrets и environment configuration.
- Rate limiting, serializers, error disclosure и insecure defaults; проверить критические data invariants в пределах выбранных workflows.
- Database constraints, transactions, race conditions и partial writes.
- Privacy, moderation и deletion flows; применимые owner, visibility, block/report, safe serializer и media invariants из `AGENTS.md`.

Не выводить secrets, tokens, PII или реальные значения environment variables. Анализировать код загрузки окружения, безопасные шаблоны и configuration logic; не открывать реальные `.env` и пользовательские данные. Воспроизведение выполнять только с synthetic inputs и подтверждённо безопасными операциями.

Output: `docs/audits/yuni-2026-09/passes/wave-1/03-SECURITY-DATA-INTEGRITY.md`.
Владелец кандидатов: Pass C; ID-prefix: `SEC`.

## 6. Required output structure

Каждый pass содержит следующие разделы; при отсутствии результатов указать «нет», не создавать фиктивных кандидатов:

- Audit pass name, branch, полный commit SHA и date с часовым поясом.
- Scope, methods and tools, включая фактические возможности/ограничения CodeGraph.
- Files and symbols reviewed; явно указать непроверенную часть scope.
- Confirmed candidate findings — кандидаты с непосредственно проверенным evidence наблюдения, ещё не подтверждённые findings центрального реестра.
- Proposed candidate findings — кандидаты с непроверенной частью интерпретации; указать недостающее evidence.
- Rejected hypotheses с причинами отклонения.
- Blocked checks and blind spots.
- Best-practice candidates с проблемой Yuni, применимостью, альтернативами и компромиссами; статус Candidate до cross-review и отдельного принятия владельцами.
- Assurance candidates — ограниченные invariants с evidence и coverage boundaries по `06-ASSURANCE-REGISTER.md`; не записывать в реестр без явного разрешения.
- Recommended next verification.
- Final git status со сравнением с исходным и списком ожидаемых output-файлов.

Для кандидатов использовать будущие prefixes `ARCH`, `TEST`, `SEC` и шаблон `03-FINDINGS.md`. Координатор перед запуском проверяет коллизии и выделяет диапазоны номеров; ID после назначения не менять и не переиспользовать.
Для каждого кандидата указать поведение, ожидаемый invariant, file/symbol/строки на SHA, проверяемое evidence, reproduction/verification, risk, severity P0–P3, confidence и root cause с uncertainty; рекомендации и tests required оформлять по registry template.
Для выполненных checks сохранить точную команду, условия, exit code, результат и длительность; отделить реально выполненное от предложенного. P0/P1 обосновать риском, а не размером/сложностью файла.
До независимого cross-review все кандидаты остаются предложениями вне registry; термин Confirmed в разделе evidence не переводит finding в статус Confirmed. Автоматически не добавлять их в `03-FINDINGS.md`.

## 7. Overlap rules

- Архитектурная причина остаётся у Architecture pass; недостаток тестовой защиты — у Test pass; security impact — у Security pass.
- Не копировать одну проблему целиком в три отчёта; сохранять самостоятельные последствия и связывать кандидатов cross-reference.
- До завершения первичного анализа фиксировать только замеченное пересечение областей; координатор добавляет сопоставление ID на отдельном cross-review, не раскрывая чужие выводы заранее.
- Спорную ownership передавать на Synthesis review; объединять по доказанной общей причине, сохранять ID/aliases и основания отклонения дублей, не стирать историю.

## 8. Execution order

1. Отдельным подготовительным шагом зафиксировать audit commit и tag; проверить совпадение tag с полным SHA. До этого не запускать pass. Создание данного плана не фиксирует commit/tag.
2. Подготовить три задания с одним SHA, конкретными scope/путями, разрешёнными checks и output; запустить три pass независимо. Изолировать побочные записи и исключить одновременное изменение общих файлов/окружений.
3. Не передавать одному агенту выводы другого до завершения первичного анализа; первый независимый review проводить blind по `docs/AI_REVIEW_PROTOCOL.md`, без executor chat и скрытых рассуждений.
4. После получения трёх отчётов провести отдельный cross-review evidence, контрпримеров, severity, overlap и ownership; неразрешённые противоречия передать владельцам, не подтверждать голосованием.
5. Только после cross-review и явного разрешения на изменение registry отдельным шагом перенести подтверждённые findings в `03-FINDINGS.md`, сохранив источники и review history. Исправления оформить отдельными задачами.

## 9. Completion criteria

- [ ] Созданы все три output-файла с обязательной структурой.
- [ ] Все pass использовали один полный commit SHA, соответствующий audit tag.
- [ ] Production code, tests, configs и package files не изменены; выходы и побочные записи учтены.
- [ ] Blind spots и blocked/skipped checks явно указаны; ограничения не выданы за успешные проверки.
- [ ] Кандидаты имеют воспроизводимое evidence и обоснованную uncertainty/severity.
- [ ] Проведён отдельный cross-review, связаны пересечения и сохранены rejected hypotheses.
- [ ] Подтверждённые findings внесены в центральный реестр отдельным разрешённым шагом; если подтверждённых findings нет, это явно зафиксировано без вымышленных записей.
