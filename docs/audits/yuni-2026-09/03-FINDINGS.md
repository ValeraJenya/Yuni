# Yuni — Findings Register

## 1. Purpose

Центральный реестр результатов всех технических audit-проходов Yuni. Метод проверки, severity и confidence определяются [Audit Charter](01-AUDIT-CHARTER.md); исходное состояние и ограничения проверок — в [Baseline](02-BASELINE.md).

В реестр допускаются только записи с проверенным evidence конкретного наблюдения. Наличие evidence не означает подтверждение всей интерпретации: спорный вывод хранится как `Proposed` до cross-review, а не публикуется как доказанный дефект. Гипотезы без проверенного источника остаются в рабочих материалах прохода вне реестра.

ID после создания не меняется и не переиспользуется, включая отклонённые и объединённые записи. При создании шаблона реальные findings не добавлялись. Интеграция Wave 1 ниже отдельно разрешена владельцем; baseline observations автоматически в findings не превращаются.

Scope создания: только `03-FINDINGS.md`, без изменения других файлов и коммита. Формат коротких ID и восемь статусов ниже заданы владельцем для этого реестра и уточняют его ведение относительно charter. `AGENTS.md` и charter не изменяются по прямому ограничению scope; общие правила Git, security и independent review сохраняются.

## 2. ID prefixes

| Prefix | Domain |
| --- | --- |
| ARCH | Архитектура и spaghetti code |
| TEST | Тестирование |
| SEC | Безопасность |
| BE | Backend и API |
| DB | База данных |
| FE | Frontend |
| PERF | Производительность |
| OPS | DevOps, CI/CD и production readiness |
| DOC | Документация и AI-контекст |
| CROSS | Проблема, затрагивающая несколько областей |

Формат: `ARCH-001`, `TEST-001`, `SEC-001` и далее. Нумерация независима внутри каждого prefix, последовательная, минимум три цифры. Основная модель выделяет ID перед внесением записи, чтобы избежать коллизий между агентами.

Выбирать один основной domain; `CROSS` использовать для единой проблемы без одного основного domain, а не для дублирования записей из нескольких областей. Для внешних ссылок указывать путь этого реестра вместе с ID. Если после review меняется domain, первоначальный ID сохраняется.

## 3. Statuses

| Status | Значение |
| --- | --- |
| Proposed | Evidence наблюдения проверено, но вывод, риск или интерпретация требуют независимой проверки либо разрешения противоречия. |
| Confirmed | Reviewer подтвердил проблему и достаточность evidence. Решение о реализации исправления ещё не принято. |
| Accepted | Владельцы приняли проблему к исправлению и согласовали подход/критерии приёмки; это не означает реализацию или принятие best practice. |
| Rejected | Запись отклонена или объединена с другой; причина и ссылка на основную запись сохраняются. Не означает автоматически доказанный false positive. |
| In Progress | Выполняется отдельно согласованная remediation-задача; аудит сам не разрешает менять код. |
| Implemented | Изменение реализовано, указан fix commit, но независимая проверка критериев ещё не завершена. |
| Verified | Исправление независимо проверено на указанном commit, критерии приёмки и необходимые checks пройдены. |
| Deferred | Подтверждённая проблема отложена явным решением владельцев; записаны причина, остаточный риск и условие/дата пересмотра. |

Обычный путь: `Proposed → Confirmed → Accepted → In Progress → Implemented → Verified`. Отклонение, объединение или отсрочка требуют записи в Review history. При неудачной проверке исправления вернуть `In Progress`; если пересматривается сам вывод — `Proposed`. Историю прежнего подтверждения не стирать.

Master register и detailed entry должны иметь одинаковый текущий статус. Эти статусы не переводятся в lifecycle общего audit index механически: `Confirmed` подтверждает дефект, `Verified` — исправление; соответствие оформляется по смыслу с evidence и task reference.

## 4. Master register

### Wave 1 integration provenance

Перенос решений [Synthesis / Red-Team](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), §§4–14, выполнен 2026-09-07 по явному разрешению владельца. Это интеграция результатов, не новый аудит и не повторная source/runtime verification.

- Synthesis result commit: `f2e94711b710262a58c88ca65416c12aaae6fc51` (`f2e9471`).
- Last verified code commit (C): `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`.
- Primary reports commit (R): `bac836bb06b536e9805fa382ab3272f4d49adec1`; synthesis input HEAD (S): `a756c5a4d721638b786c50903c2857fb6fd1e632`.
- Checklist source SHA256 (H): `44FD1F11FA3953AF03E51C8EFD6233996F1C51C58193ABC106BB252BEBF51B6E`; refs перенесены только из Synthesis §13, это не утверждение полного coverage sections.
- Verification environment/date/reviewer (E): source-only Windows NT 10.0.26200.0, PowerShell 7.6.5, Node v24.19.0, 2026-09-07 Europe/Moscow; Codex Synthesis / Red-Team в отдельном worktree. Dependencies отсутствовали, pnpm Unknown, CodeGraph binding BLOCKED; runtime/tests не исполнялись.
- A = [Architecture](passes/wave-1/01-ARCHITECTURE-SPAGHETTI.md); T = [Test Reliability](passes/wave-1/02-TEST-RELIABILITY.md); Q = [Security / Data Integrity](passes/wave-1/03-SECURITY-DATA-INTEGRITY.md). A/T/Q — reports на R о коде C, не имена reviewer-ов.
- Общие поля каждой detailed entry: Applicability = Applicable now; Last verified commit = C; Checklist source SHA = H; Verification environment/date/reviewer = E. Источник independent verdict — Synthesis §4/13 на result commit выше. Source paths/строки ниже относятся к C, не к commit интеграции.
- Assessment result = FAIL только в подтверждённой static/suite boundary для девяти Confirmed; у SEC-003 BLOCKED. Это не failed executable test. Reproduction/runtime — not run; безопасные планы вынесены в [07-WAVE-1-FOLLOWUPS.md](07-WAVE-1-FOLLOWUPS.md).
- Reverification trigger каждой записи: изменение затронутого source/tests, schema/config/dependency либо policy; повторить source trace и относящиеся RV на новом полном SHA. Команды/результаты исходного static review — Synthesis §3; здесь они не повторялись.
- Accepted-risk owner/date и fix commit: N/A, риск не принимался, исправлений нет. Все рекомендации остаются предложениями; best practices — Candidates из Synthesis §15. Владельцы принимают policy/validation scope по DEC-001–006 отдельно.

По прямому заданию интеграции master учитывает **10 самостоятельных findings**. SEC-002 и SEC-004 сохраняются только как merged sources/aliases ниже и в canonical history: отдельных master/detailed findings для них нет. Это уточняет общий способ хранения дублей для данного переноса; исходные IDs не удалены и не переиспользуются.

| Merged source ID | Canonical finding | Source / Synthesis decision |
| --- | --- | --- |
| SEC-002 | ARCH-001 | Q + A; Synthesis §4–5/13: Merge with another finding; Rejected только как исходный alias по merge, не false positive. Сохранены DB/disk divergence и post-commit compensation. |
| SEC-004 | ARCH-002 | Q + A; Synthesis §4–5/13: Merge with another finding; Rejected только как исходный alias по merge, не false positive. Сохранены stale success/rejection, logout/new identity и waiter/retry. |

AGENTS.md и charter не изменяются по allowlist владельца: перенос не вводит workflow/security rules или Accepted best practices.

| ID | Domain | Title | Severity | Confidence | Status | Source pass | Related findings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ARCH-001](#arch-001) | Backend / Media orchestration | Post-commit upload error удаляет committed asset | P2 | High | Confirmed | A + Q; Synthesis §4/13 | SEC-002 (merged source), TEST-001 |
| [ARCH-002](#arch-002) | Frontend / auth state orchestration | Stale auth completion нарушает memory-session ordering | P2 | High (source) | Confirmed | A + Q; Synthesis §4/13 | SEC-004 (merged source), TEST-002, TEST-003, SEC-001 |
| [ARCH-003](#arch-003) | Frontend / chat state | Late send меняет messages/draft другого выбранного chat | P2 | High (source) | Confirmed | A; Synthesis §4/13 | TEST-003 |
| [ARCH-004](#arch-004) | Backend maintainability | Actor eligibility copies требуют согласованного сопровождения | P3 | High (duplication) | Confirmed | A; Synthesis §4/13 | DEC-004 (owner/target policy) |
| [TEST-001](#test-001) | Testing / transaction caller boundaries | Transaction tests не различают root/tx на selected caller boundaries | P2 | High | Confirmed | T; Synthesis §4/13 | ARCH-001, SEC-002 (merged source), SEC-003 |
| [TEST-002](#test-002) | Testing / backend auth integration | Auth cookie/guard contract не закреплён integration journey | P2 | High (inventory) | Confirmed | T; Synthesis §4/13 | SEC-001, ARCH-002, SEC-004 (merged source) |
| [TEST-003](#test-003) | Testing / frontend auth | Hook tests не наблюдают session transitions/retry | P2 | High | Confirmed | T; Synthesis §4/13 | ARCH-002, SEC-004 (merged source), TEST-002, ARCH-003 |
| [TEST-004](#test-004) | Testing / concurrency oracle | Block/like e2e oracle отвергает legal forbidden response | P2 | High (assertion structure) | Confirmed | T; Synthesis §4/13 | SEC-003, TEST-001 |
| [SEC-001](#sec-001) | Security / backend auth owner proof | Logout использует locator как право на revoke | P2 | High (conditional source) | Confirmed | Q; Synthesis §4/13 | TEST-002, ARCH-002, SEC-004 (merged source) |
| [SEC-003](#sec-003) | Security / moderation-chat consistency | Concurrent conversation creation может пережить block closing | P1 provisional | Medium (outcome); High (source) | Proposed | Q; Synthesis §4/13 | TEST-004, TEST-001 |

## 5. Detailed finding template

Ниже — шаблон для будущих записей, не finding. При создании записи заполнить основные поля; неприменимое обозначить `N/A` с причиной. Условные поля ниже включать только когда применимы; недостающие данные обозначать Unknown, не выдумывать значения. Severity: `P0–P3`; Confidence: `High / Medium / Low` по charter. Source pass должен ссылаться на конкретный отчёт/проход и checked commit, а не только на имя агента.

```markdown
## [ID] Title

- Domain:
- Severity:
- Confidence:
- Status:
- Source pass:
- Affected files:
- Affected symbols:
- Related findings:
- Best-practice candidate:
- Checklist references:
- Checklist source SHA:
- Applicability:
- Assessment result:
- Last verified commit:
- Verification environment:
- Verification date:
- Reverification trigger:
- Remediation horizon:

### Current behavior

Наблюдаемое поведение и ожидаемый invariant/контракт с источником ожидания. Если удобно структурировать, использовать условное поле ниже вместо повторения invariant в тексте:

- Protected invariant:

### Evidence

Указать полный checked commit SHA, дату, условия проверки и конкретный проверяемый источник:

- file path относительно репозитория;
- symbol;
- line range, если стабильно на указанном commit;
- команду, exit code и результат;
- runtime reproduction с synthetic inputs;
- test result с именем suite/test и границами mock-ов;
- CodeGraph relation с исходным и целевым символами, сверенную по коду на checked SHA;
- либо другой проверяемый источник с точной ссылкой и ограничениями.

Выбрать применимые виды evidence; все виды одновременно не обязательны. Отделить прямое наблюдение от интерпретации. Ссылка на документацию сама по себе не доказывает реализацию.

### Reproduction or verification

Предусловия, безопасные шаги, ожидаемый и фактический результат; указать, что реально выполнялось, а что остаётся непроверенным.

### Risk and impact

Последствия, затронутые пользователи/данные и обоснование severity. Условные поля конкретизируют этот раздел, не дублируют его текст:

- Failure or attack scenario:
- Likelihood:
- Accepted-risk owner:
- Accepted-risk review condition/date:

### Root cause

Указать отдельно статус причины: Confirmed / Inferred / Unknown. Он не заменяет Status finding. Подтверждённую причину связать с evidence; для Inferred описать недостающую проверку, для Unknown не выдумывать объяснение.

### Recommended solution for Yuni

Описать решение один раз в полях ниже с учётом существующей архитектуры; если подходы совпадают, Target fix ссылается на Minimal fix. Рекомендация не разрешает автоматическое исправление.

- Minimal fix:
- Target fix:

Условные поля, только если применимы:

- Decision owner:
- Dependencies:
- Estimated complexity:

### Alternatives considered

Альтернативы, включая сохранение текущего поведения, и причины выбора.

### Tests required

Invariants, negative/boundary cases, тип тестов и применимые checks. Не выдавать план тестов за выполненную проверку.

### Documentation impact

Затрагиваемые ADR, инструкции, task docs, skills или reference implementations и причины обновления.

### Acceptance criteria

Проверяемые условия устранения проблемы и отсутствия регрессий; ссылка на remediation-задачу после её создания.

### Review history

Для каждого решения: дата, reviewer/owner, прежний и новый статус, основание и evidence. После реализации — fix commit и результаты независимой проверки; при объединении — основной ID, при отсрочке — причина, остаточный риск и условие пересмотра.
```

## 6. Registry rules

- `Status` — lifecycle finding; `Assessment result` — результат указанной проверки: PASS / FAIL / BLOCKED / SKIPPED / N/A. PASS ограниченного invariant при достаточном evidence обычно относится к [Assurance Register](06-ASSURANCE-REGISTER.md), а не создаёт finding; один зелёный check не создаёт assurance, запись в реестр требует явного разрешения; PASS отдельного check не закрывает существующую проблему автоматически.
- BLOCKED не означает отсутствие проблемы или подтверждение корректности. N/A требует evidence отсутствия или неприменимости компонента; его обычно хранить в mapping. Отсутствие условной технологии не является finding.
- `Checklist references` хранит section/subsection IDs; `Checklist source SHA` — SHA256 immutable master-input, не Git SHA. `Last verified commit` — полный Git SHA фактически выполненной проверки, не автоматический статус Verified; environment/date/trigger уточняют условия и необходимость recheck. Неисполненное обозначать Unknown/not verified.
- `Applicability` использовать по mapping; `Remediation horizon` — now / before production / at scale либо Unknown до решения. Условные поля заполнять только по применимости; принятый риск требует owner и условия/даты review, но не означает Verified.
- Evidence может ссылаться на единые metadata проверки вместо повторения SHA/environment/date; risk, confidence, tests required и acceptance criteria сохраняются в своих разделах. Это уточнение шаблона не вводит обязательные оценки сложности или отдельные owner-решения для каждого finding.

- Один finding описывает одну основную проблему. Разные последствия одной причины связываются через Related findings, а не создают повторяющиеся записи; доказанные дубли получают `Rejected` со ссылкой на основной ID.
- Generic best practice без evidence конкретной проблемы Yuni не является finding. Best-practice candidate рассматривается отдельно по charter и не становится обязательным правилом автоматически.
- Высокий приоритет нельзя назначать только из-за размера или сложности файла: требуется обоснованный риск и влияние.
- Baseline observation становится finding только после отдельной проверки на явно указанном commit и проверки evidence; копирование текста из baseline недостаточно.
- Конфликтующие выводы сохраняются как `Proposed` до cross-review. Их не разрешают голосованием; используются evidence и дополнительная проверка, неразрешённый вопрос передаётся владельцам.
- Удаляемые/отклонённые findings не стираются: сохраняются ID, запись, Review history и статус `Rejected` с основанием. Связи и aliases при объединении не теряются.
- Исправление не означает `Verified`, пока не пройдена независимая проверка. `Implemented` требует ссылки на fix commit; `Verified` — результатов checks и выполнения Acceptance criteria.
- После смены статуса или добавления записи синхронизировать Master register, подробную запись и Summary counters. Счётчики не являются доказательством полноты аудита.
- Запрещено включать secrets, tokens, cookies, `.env`, private keys и персональные данные в evidence. Использовать synthetic fixtures и безопасные выдержки; не прикладывать реальные сообщения, фотографии или dumps.

## 7. Summary counters

Считаться по строкам master register, без template, ссылок и merged sources. Детерминированный результат: 10 canonical rows, 9 Confirmed, 1 Proposed. Изменение от предложенных Synthesis 12 IDs обусловлено прямым заданием владельца не создавать отдельные findings для двух merged sources; решения не переоценивались.

- Total: 10
- P0: 0
- P1: 1 — только SEC-003, Proposed / provisional; подтверждённых P1: 0
- P2: 8 — Confirmed
- P3: 1 — Confirmed (ARCH-004)
- Proposed: 1
- Confirmed: 9
- Accepted: 0
- In Progress: 0
- Implemented: 0
- Verified: 0
- Rejected: 0 — отдельных findings; 2 merged sources вне master
- Deferred: 0

Подтверждённых P0/P1 нет; это граница результатов Wave 1, не доказательство отсутствия таких проблем во всём проекте.

## 8. Wave 1 detailed findings

<a id="arch-001"></a>
### ARCH-001 — Post-commit upload error удаляет committed asset

- Severity: P2; Confidence: High; Status: **Confirmed**.
- Source pass: A + Q; Synthesis review: [§4/13, ARCH-001](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), metadata C/R/S/E/H выше.

**Current behavior / invariant:** Последующий profile read может упасть после успешного upload commit; общий catch удаляет уже committed asset. Ожидается сохранение photo/file при ошибке построения ответа после commit.

**Evidence (перенесено из Synthesis):** `apps/backend/src/modules/media/media.service.ts:62–129` — uploadProfilePhoto, save:78–82 → tx:85–116 → getSelfProfileView:119 → cleanup catch:122–128; getSelfProfileView:311–324. Storage adapter save:21–37 / delete:39–58 не откатывает row. Specs:275–331,361–392 не проверяют post-commit read failure.

**Risk / verification limits:** При успешном cleanup остаётся row без файла и ambiguous response/retry. Это условный source outcome, не наблюдённая потеря данных; частота отказов Unknown.

**Detailed decision / solution / tests / history:** поля ниже перенесены из Synthesis §13; ссылки §4/5/6/11/15 в них относятся именно к Synthesis. RV/DEC раскрыты в [Followups](07-WAVE-1-FOLLOWUPS.md).

- Domain: Backend / Media orchestration (ID Architecture сохраняется); Source pass A + Q; Severity P2, High, Confirmed. Related SEC-002 (alias), TEST-001. Best-practice candidate: нет отдельного. Checklist 2/92/98/104 + 19/20/35/36. Remediation horizon: now, предложено владельцам.
- Affected files/symbols: `apps/backend/src/modules/media/media.service.ts` — uploadProfilePhoto/getSelfProfileView; `apps/backend/src/modules/media/storage/local-profile-photo-storage.service.ts` — save/delete; соответствующие media/storage specs. Root cause **Confirmed**, широкий catch после commit (§4).
- Minimal fix: отделить compensation до успешного commit от post-commit response read. Target fix: тот же boundary с явно определённым response/retry contract; отдельную state machine/reconciliation вводить лишь при согласованном lifecycle scope.
- Alternatives: перенос response read внутрь tx не делает FS transactional; catch-and-ignore response error без contract маскирует проблему; удаление DB row в catch после commit создаёт новую destructive compensation и требует отдельного решения.
- Tests required: RV-02; Acceptance: committed photo/file сохраняются при post-commit read failure, precommit failure очищает только uncommitted upload, original error и обычный happy path предсказуемы, ownership/projection не регрессируют.
- Documentation impact: remediation task evidence + media lifecycle/error contract; Task 047 не переписывать как будто уже покрывает upload. Review history: A/Q Proposed → canonical Confirmed; SEC-002 merge причина и сохранённый data-integrity impact в §4–5.

2026-09-07: решение независимого Synthesis перенесено в центральный registry по разрешению владельца; нового аудита, execution, принятия remediation или изменения verdict не выполнялось.

<a id="arch-002"></a>
### ARCH-002 — Stale auth completion нарушает memory-session ordering

- Severity: P2; Confidence: High (source); Status: **Confirmed**.
- Source pass: A + Q; Synthesis review: [§4/13, ARCH-002](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), metadata C/R/S/E/H выше.

**Current behavior / invariant:** Старые refresh success/rejection могут перезаписать memory session после logout/нового login; старый waiter может продолжить retry с прежней identity. Latest intent требует отдельного contract, server instant revoke сюда не входит.

**Evidence (перенесено из Synthesis):** `apps/frontend/lib/auth-context.tsx:47–90,104–178` — unconditional applySession/clearSession, logout:134–140, authenticatedRequest:142–178; `apps/frontend/app/layout.tsx:62–64` — persistent provider; AppNav:51,54–59,79–81 — callers. AuthLayout:32–71 скрывает форму при loading: first-bootstrap/form пример не принят. auth-context.test.ts:33–92 наблюдает bootstrap, не session identity.

**Risk / verification limits:** P2 для локального session state defect при overlapping completions; browser/cookie ordering и cross-account leak не воспроизведены. Причина source Confirmed, реальная частота Unknown.

**Detailed decision / solution / tests / history:** поля ниже перенесены из Synthesis §13; ссылки §4/5/6/11/15 в них относятся именно к Synthesis. RV/DEC раскрыты в [Followups](07-WAVE-1-FOLLOWUPS.md).

- Domain: Frontend / auth state orchestration; Source A + Q; P2, High source, Confirmed. Related SEC-004 alias, TEST-002/003, SEC-001 (другой owner boundary). Best-practice: Observe async hook state (Candidate, §15). Checklist 2/92/98/104 + 62/63/65/70. Horizon now.
- Affected files/symbols: `apps/frontend/lib/auth-context.tsx` — refreshSession/applySession/clearSession/register/login/logout/authenticatedRequest; root/AuthLayout/AppNav callers и auth tests из §4. Root cause **Confirmed** unconditional stale continuations; e2e cookie ordering Unknown.
- Minimal fix: согласованный session generation/intent guard на async results и invalidation при смене intent; waiter/retry обязан учитывать ту же identity. Target fix: та же локальная модель с необходимыми deferred tests; новый глобальный store не обоснован.
- Alternatives: только refresh single-flight уже есть и недостаточен; AbortController сам по себе не отменяет уже обработанный server request/все continuations; один logout route redirect не уничтожает root provider.
- Tests required: RV-03 и transport part RV-06; Acceptance: late success/reject не перезаписывает разрешённый latest intent, old waiter не использует чужую/устаревшую identity, bootstrap/dedupe/single-retry остаются корректны. Server access instant revoke не добавляется этим acceptance.
- Documentation impact: task/API memory-session ordering после owner decision; backend revoke policy отдельно. History: A/Q Proposed → canonical Confirmed, first-bootstrap/form пример сужен контрпримером AuthLayout, SEC-004 merged.

2026-09-07: решение независимого Synthesis перенесено в центральный registry по разрешению владельца; нового аудита, execution, принятия remediation или изменения verdict не выполнялось.

<a id="arch-003"></a>
### ARCH-003 — Late send меняет messages/draft другого выбранного chat

- Severity: P2; Confidence: High (source); Status: **Confirmed**.
- Source pass: A; Synthesis review: [§4/13, ARCH-003](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), metadata C/R/S/E/H выше.

**Current behavior / invariant:** После send A → switch B → GET B → late A response общий messages/input может получить сообщение A и потерять новый draft. API destination остаётся A.

**Evidence (перенесено из Synthesis):** `apps/frontend/app/(app)/messages/page.tsx:236–275` — captured activeId, append:252, clear input:270; selector:379–385 и textarea:794–809 доступны при send; renderer:652–655 без conversation filter. `apps/frontend/lib/chat-api.ts:93–106` отправляет captured A. GET effect:178–209 имеет cleanup и не является этим дефектом.

**Risk / verification limits:** P2 для отображения chat и потери draft; wrong-recipient send и cross-user leak не подтверждены. Runtime occurrence/frequency Unknown.

**Detailed decision / solution / tests / history:** поля ниже перенесены из Synthesis §13; ссылки §4/5/6/11/15 в них относятся именно к Synthesis. RV/DEC раскрыты в [Followups](07-WAVE-1-FOLLOWUPS.md).

- Domain: Frontend / chat state; Source A; P2, High source, Confirmed. Related TEST-003 — смежный подход к async tests, не общий defect. Best-practice отдельного нет. Checklist 2/92/98/104. Horizon now.
- Affected files/symbols: `apps/frontend/app/(app)/messages/page.tsx` — sendMessage, conversation selector, shared messages/input, renderer; `apps/frontend/lib/chat-api.ts` — sendMessage. Root cause **Confirmed**: response не привязан к текущему conversation/draft version.
- Minimal fix: привязать continuation к captured conversation и revision draft, адресно обновлять preview; Target: та же проверенная state ownership модель либо per-conversation state при дополнительной необходимости.
- Alternatives: блокировать навигацию/textarea на всё время send — UX tradeoff для owner, не обязательный redesign; GET active cleanup не покрывает mutation response. Backend destination менять не требуется.
- Tests required: RV-04; Acceptance: late A success/reject не загрязняет B messages/error/draft, новый draft не исчезает, normal A send и preview работают, API destination остаётся captured A.
- Documentation impact: task note и chat draft/navigation acceptance; visual QA только если remediation меняет layout/interactive state по CLAUDE/AGENTS. History: A Proposed → Confirmed с явным исключением wrong-recipient/cross-user leak claim.

2026-09-07: решение независимого Synthesis перенесено в центральный registry по разрешению владельца; нового аудита, execution, принятия remediation или изменения verdict не выполнялось.

<a id="arch-004"></a>
### ARCH-004 — Actor eligibility copies требуют согласованного сопровождения

- Severity: P3; Confidence: High (duplication); Status: **Confirmed**.
- Source pass: A; Synthesis review: [§4/13, ARCH-004](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), metadata C/R/S/E/H выше.

**Current behavior / invariant:** Десять одинаковых actor eligibility helpers требуют согласованного сопровождения. Текущего divergence/policy drift не найдено; actor, target и recipient contracts нельзя автоматически объединять.

**Evidence (перенесено из Synthesis):** `apps/backend/src/modules/*/*.service.ts`, assertActiveUser: users:368–380, settings:123–135, profiles:131–143, matches:371–383, likes:186–198, chat:839–851, discovery:124–136, moderation:370–382, media:290–302, notifications:348–360; callers проверены Synthesis. Target 404 и recipient suppression отличаются от actor 401.

**Risk / verification limits:** Reviewed P3 вместо original P2: подтверждён cleanup/change-radius risk, но значительный ущерб, drift или security bypass не доказаны. Будущий drift Inferred; runtime не нужен для факта duplication.

**Detailed decision / solution / tests / history:** поля ниже перенесены из Synthesis §13; ссылки §4/5/6/11/15 в них относятся именно к Synthesis. RV/DEC раскрыты в [Followups](07-WAVE-1-FOLLOWUPS.md).

- Domain: Backend maintainability; Source A; **P3**, High source, Confirmed. Related owner/target policy §11; Best-practice отдельного нет. Checklist 2/92/98/104. Horizon now при согласованном cleanup, не срочное security исправление.
- Affected: десять `.service.ts`/assertActiveUser с точными ranges §4. Root cause **Confirmed** duplication; drift impact **Inferred**, сегодня divergence не найден.
- Minimal fix: выбрать узкий actor-only helper либо документированный coordinated-change contract с targeted checks; Target: Minimal, без переноса target/recipient policy и без одного универсального auth guard.
- Alternatives: оставить локальные helpers допустимо до реального policy change, если owner принимает maintenance cost; abstract base service/дополнительная dependency не оправданы одним count=10.
- Tests required: если extraction согласован — actor missing/inactive/deleted/active по затронутым consumers, различия 401 actor/404 target/recipient suppression и tx client не меняются. Acceptance: поведение сохранено и место изменения actor predicate однозначно; документированная альтернатива не объявляется устранённым duplication без owner решения.
- Documentation impact: task evidence/module-boundaries только если реально меняется shared contract; AGENTS/ADR не менять автоматически. History: A Proposed P2 → Confirmed P3, причина снижения §6; текущего auth bypass не заявлено.

2026-09-07: решение независимого Synthesis перенесено в центральный registry по разрешению владельца; нового аудита, execution, принятия remediation или изменения verdict не выполнялось.

<a id="test-001"></a>
### TEST-001 — Transaction tests не различают root/tx на selected caller boundaries

- Severity: P2; Confidence: High; Status: **Confirmed**.
- Source pass: T; Synthesis review: [§4/13, TEST-001](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), metadata C/R/S/E/H выше.

**Current behavior / invariant:** Weakness test suite: selected root/tx doubles идентичны и не различают routing write. Это не доказанный production tx escape.

**Evidence (перенесено из Synthesis):** `apps/backend/src/modules/auth/auth.service.spec.ts:580–584,220–232`, `likes/likes.service.spec.ts:446–463,125–132`, `chat/chat.service.spec.ts:1057–1062,570–578` — aliased callbacks/assertions. Counterexamples: distinct Moderation:156–237, Notifications:167–198, Matches:227–272, Auth refresh:402–417. Production tx propagation сохранена в Synthesis §4.

**Risk / verification limits:** P2 для слабой regression protection критичных caller contracts. Predicted surviving substitution — static inference, mutation не исполнялась; actual DB rollback/durability Unknown.

**Detailed decision / solution / tests / history:** поля ниже перенесены из Synthesis §13; ссылки §4/5/6/11/15 в них относятся именно к Synthesis. RV/DEC раскрыты в [Followups](07-WAVE-1-FOLLOWUPS.md).

- Domain Testing; Source T; P2, High, Confirmed; Related ARCH-001/SEC-002, SEC-003. Best-practice Separate transaction doubles (Candidate). Checklist 93/95/117-Database. Horizon now.
- Affected: `apps/backend/src/modules/auth/auth.service.spec.ts`, `likes/likes.service.spec.ts`, `chat/chat.service.spec.ts` — registration/like/send harnesses и forwarding assertions; production/сильные counterexamples §4. Root cause **Confirmed** identity alias, не production tx escape.
- Minimal fix: distinct required tx methods/root-negative spies в этих boundaries; Target: Minimal + отдельно согласованные real DB rollback checks для multi-write flows.
- Alternatives: только calledTimes/order assertions не различают clients; копирование entire Prisma mock в каждом тесте повышает стоимость и может снова разделять вложенные mocks. Полный transactional in-memory emulator не нужен.
- Tests required RV-05; Acceptance: намеренно выбранный неверный client обнаруживается независимым routing assertion в отдельной разрешённой проверке, normal propagation проходит; mocks не объявляются proof durability.
- Documentation impact: task test evidence; shared test guideline только после принятия candidate. History T Proposed → Confirmed, exceptions Moderation/Notifications/Matches/Auth-refresh сохранены.

2026-09-07: решение независимого Synthesis перенесено в центральный registry по разрешению владельца; нового аудита, execution, принятия remediation или изменения verdict не выполнялось.

<a id="test-002"></a>
### TEST-002 — Auth cookie/guard contract не закреплён integration journey

- Severity: P2; Confidence: High (inventory); Status: **Confirmed**.
- Source pass: T; Synthesis review: [§4/13, TEST-002](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), metadata C/R/S/E/H выше.

**Current behavior / invariant:** Weakness test suite: cookie lifecycle/negative bearer contract не закреплён целостным integration journey; duplicated e2e bootstrap не включает cookieParser.

**Evidence (перенесено из Synthesis):** `apps/backend/src/main.ts:37–56` и `apps/backend/test/match-block-chat.e2e-spec.ts:86–100` — разные middleware; inventory шести e2e и auth service specs не содержит cookie jar/refresh/logout journey. `user-data-export.e2e-spec.ts:183–187` имеет no-auth negative: blanket отсутствие всех negatives неверно. `auth.service.spec.ts:453–485` проверяет refresh, не bearer guard.

**Risk / verification limits:** P2 для непроверенного transport и bootstrap drift. Не auth bypass; existing service/no-auth export tests полезны. Remote CI/runtime и policy-dependent expectations Unknown.

**Detailed decision / solution / tests / history:** поля ниже перенесены из Synthesis §13; ссылки §4/5/6/11/15 в них относятся именно к Synthesis. RV/DEC раскрыты в [Followups](07-WAVE-1-FOLLOWUPS.md).

- Domain Testing / backend auth integration; Source T; P2, High inventory, Confirmed. Related SEC-001, ARCH-002/SEC-004; Best-practice Reuse production-equivalent auth setup (Candidate). Checklist 62/70/95/117-Auth. Horizon before production.
- Affected: `apps/backend/test/*.e2e-spec.ts` bootstrap, `apps/backend/src/main.ts`, auth controller/guard/service specs, Jest e2e environment. Root cause **Confirmed** missing transport coverage + duplicated middleware setup, не доказанный bypass.
- Minimal fix: targeted cookie lifecycle/negative bearer integration fixtures с production-equivalent middleware; Target Minimal с общим setup лишь если поддерживает явные разные test lifecycle нужды.
- Alternatives: service-only tests не проверяют cookies/guard; browser-only suite дороже и не заменяет deterministic server assertions; current unauthenticated export negative сохранить.
- Tests required RV-06; Acceptance: actual cookie transport и expected bearer negatives наблюдаемы, valid control работает, tests запускаются только на доказанно isolated DB/storage. Policy-dependent claims откладываются до §11.
- Documentation impact: task/API expected auth outcomes; obsolete test-absence docs исправлять отдельно, не в этом audit. History T Proposed → Confirmed со сужением blanket negative-auth absence.

2026-09-07: решение независимого Synthesis перенесено в центральный registry по разрешению владельца; нового аудита, execution, принятия remediation или изменения verdict не выполнялось.

<a id="test-003"></a>
### TEST-003 — Hook tests не наблюдают session transitions/retry

- Severity: P2; Confidence: High; Status: **Confirmed**.
- Source pass: T; Synthesis review: [§4/13, TEST-003](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), metadata C/R/S/E/H выше.

**Current behavior / invariant:** Weakness test suite: bootstrap tests наблюдают calls/loading, но не session transitions, logout и single 401 retry. Пробел не доказывает неправильные production fetch options.

**Evidence (перенесено из Synthesis):** `apps/frontend/lib/auth-context.test.ts:33–92`, auth-api.test.ts и inventory восьми frontend suites: дополнительных observations transitions не найдено. `auth-api.ts:88–94` уже выставляет Authorization/credentials; mocked fetch options не доказывают browser transport. Scope Task 079 bootstrap controls сохранён.

**Risk / verification limits:** P2 для узкого regression gap; отдельный production defect — ARCH-002. Не generic component-test requirement, не runtime failure.

**Detailed decision / solution / tests / history:** поля ниже перенесены из Synthesis §13; ссылки §4/5/6/11/15 в них относятся именно к Synthesis. RV/DEC раскрыты в [Followups](07-WAVE-1-FOLLOWUPS.md).

- Domain Testing / frontend auth; Source T; P2, High, Confirmed. Related ARCH-002/SEC-004, TEST-002, ARCH-003. Best-practice Observe async hook state (Candidate). Checklist 93/95/117-Auth. Horizon now.
- Affected: `apps/frontend/lib/auth-context.test.ts`, `auth-api.test.ts`; соответствующие context/API symbols §4. Root cause **Confirmed** observable coverage gap; существующие bootstrap positives/negatives полезны.
- Minimal/Target fix: расширить существующий hook harness явным observation состояния и outgoing request identity, controlled promises для transitions/retry. Новая dependency не обоснована.
- Alternatives: snapshots/call counts не показывают session outcome; test, копирующий реализацию generation, не независимый oracle; широкий component/browser framework требует отдельного решения.
- Tests required RV-03/06; Acceptance: success/reject/logout/new identity и single retry имеют наблюдаемые правильные states/options при принятом contract, Task 079 bootstrap controls сохранены.
- Documentation impact: task evidence, auth ordering contract; AGENTS testing rule не менять. History T Proposed → Confirmed; source production bug остаётся отдельным ARCH-002.

2026-09-07: решение независимого Synthesis перенесено в центральный registry по разрешению владельца; нового аудита, execution, принятия remediation или изменения verdict не выполнялось.

<a id="test-004"></a>
### TEST-004 — Block/like e2e oracle отвергает legal forbidden response

- Severity: P2; Confidence: High (assertion structure); Status: **Confirmed**.
- Source pass: T; Synthesis review: [§4/13, TEST-004](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), metadata C/R/S/E/H выше.

**Current behavior / invariant:** Weakness test suite: Promise.allSettled требует оба fulfilled без enforced schedule, хотя block-first допускает предусмотренный 403 у reciprocal like при сохранении no-active-match invariant.

**Evidence (перенесено из Synthesis):** `apps/backend/test/match-block-chat.e2e-spec.ts:188–209` — schedule:195–204, fulfilled:206–207, invariant:208; requestJson:441–455 бросает на non-OK. LikesService:119–122 проверяет block до tx; locks/recheck не гарантируют оба fulfilled.

**Risk / verification limits:** Confirmed относится к статическому false-failure oracle. P2 для ложного отклонения legal outcome; flake rate не измерялась. Это другой race, чем SEC-003, и не доказательство start/block safety.

**Detailed decision / solution / tests / history:** поля ниже перенесены из Synthesis §13; ссылки §4/5/6/11/15 в них относятся именно к Synthesis. RV/DEC раскрыты в [Followups](07-WAVE-1-FOLLOWUPS.md).

- Domain Testing / concurrency oracle; Source T; P2, High source structure, Confirmed; runtime frequency Unknown. Related SEC-003, TEST-001; Best-practice Specify race preconditions (Candidate). Checklist 93/95/117. Horizon now.
- Affected: `apps/backend/test/match-block-chat.e2e-spec.ts` — concurrent case/requestJson/activeMatchCount; Likes/Moderation/Matches paths §4. Root cause **Confirmed** unspecified order + unconditional fulfilled; runtime flakiness Inferred/not measured.
- Minimal fix: определить допустимые outcomes для каждого явно заданного schedule с exact statuses; Target: deterministic barriers двух orders + сохранённый DB invariant.
- Alternatives: catch-all rejected/удалить assertions/повторы до зелёного скрывают ошибки; sleeps не устанавливают correctness. Только счётчик requests не доказывает interleaving.
- Tests required RV-07; Acceptance: legal block-first 403 корректно обработан, unexpected status/error не принят, final active match отсутствует; никакого заявления start/block coverage без отдельного RV-01.
- Documentation impact: race test task/evidence; measured flake claim только после реального run. History T Proposed → Confirmed узкого oracle defect, original Medium и runtime uncertainty сохранены.

2026-09-07: решение независимого Synthesis перенесено в центральный registry по разрешению владельца; нового аудита, execution, принятия remediation или изменения verdict не выполнялось.

<a id="sec-001"></a>
### SEC-001 — Logout использует locator как право на revoke

- Severity: P2; Confidence: High (conditional source); Status: **Confirmed**.
- Source pass: Q; Synthesis review: [§4/13, SEC-001](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), metadata C/R/S/E/H выше.

**Current behavior / invariant:** Logout использует refresh locator для revoke без проверки secret. При знании чужого active locator wrong/empty suffix может отозвать row; invariant отделяет lookup от owner proof.

**Evidence (перенесено из Synthesis):** `apps/backend/src/modules/auth/auth.service.ts:199–217,498–513` — logout/parser; verifyRefreshCookie:464–496 проверяет secret только в refresh. AuthController:80–93 — logout без access guard. auth.service.spec.ts:487–525 не покрывает wrong secret. security README:13 — policy; export selectors исключают session locator.

**Risk / verification limits:** Условный targeted availability/owner-proof defect P2. Источник знания locator не найден, likelihood Unknown; UUID guessing, утечка, account takeover и масштаб атаки не предполагаются.

**Detailed decision / solution / tests / history:** поля ниже перенесены из Synthesis §13; ссылки §4/5/6/11/15 в них относятся именно к Synthesis. RV/DEC раскрыты в [Followups](07-WAVE-1-FOLLOWUPS.md).

- Domain Security / backend auth owner proof; Source Q; P2, High source, Confirmed, likelihood Unknown. Related TEST-002, ARCH-002/SEC-004; Best-practice отдельного нет. Checklist 37/58/62/63/64/73. Horizon now.
- Affected: `apps/backend/src/modules/auth/auth.service.ts` — logout/parseRefreshCookie/verifyRefreshCookie; controller logout и auth spec; exports проверены как counterevidence §4. Root cause **Confirmed** rawToken proof skipped.
- Minimal fix: перед изменением чужой refresh row проверять proof в рамках принятой logout semantics, сохраняя generic/idempotent внешнее поведение; Target: тот же owner boundary, rotation/family/logout контракт после отдельного решения.
- Alternatives: access guard как единственный путь может помешать logout при expired access; rate limit/UUID opacity не заменяют secret proof; blindly reuse refresh verifier требует учесть expired/revoked/repeated logout ответы.
- Tests required RV-08/06; Acceptance: wrong/empty secret не меняет active row известного synthetic locator, valid proof отзывает надлежащую session, repeated/expired/missing не создают enumeration; не внедрять unapproved global logout.
- Documentation impact: auth owner proof/logout contract и task evidence, risk assumptions Unknown явно сохранены. History Q Proposed → Confirmed conditional defect без предположения locator leak и severity escalation.

2026-09-07: решение независимого Synthesis перенесено в центральный registry по разрешению владельца; нового аудита, execution, принятия remediation или изменения verdict не выполнялось.

<a id="sec-003"></a>
### SEC-003 — Concurrent conversation creation может пережить block closing

- Severity: P1 provisional; Confidence: Medium (outcome); High (source); Status: **Proposed**.
- Source pass: Q; Synthesis review: [§4/13, SEC-003](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), metadata C/R/S/E/H выше.

**Current behavior / invariant:** Prechecks start выполняются до tx без общего pair protocol с block; возможный insert после block closing и доступ после последнего unblock требуют runtime и owner interpretation permanent-close.

**Evidence (перенесено из Synthesis):** `apps/backend/src/modules/chat/chat.service.ts:748–837` — prechecks:752–783, nested create tx:788–813; moderation.service.ts:62–152,307–368 — lock/closing/unblock; common/prisma/user-pair-lock.ts:11–18,38–49. Schema/FK/unique и migrations не доказывают cross-table status protection. Chat read:1176–1197 / send:601–715 проверяют live Block и active C. Unit:627–773 и e2e:127–209 не enforce start/block window.

**Risk / verification limits:** Source synchronization facts Confirmed, adverse persisted state Inferred. Пока live Block есть, новые read/send запрещены; closed C не reopen. Provisional P1 НЕ подтверждён; actual PostgreSQL isolation/constraints/interleaving и impact после unblock Unknown. RV-01 + DEC-001/005 обязательны до решения.

**Detailed decision / solution / tests / history:** поля ниже перенесены из Synthesis §13; ссылки §4/5/6/11/15 в них относятся именно к Synthesis. RV/DEC раскрыты в [Followups](07-WAVE-1-FOLLOWUPS.md).

- Domain Security / moderation-chat consistency; Source Q; **P1 provisional**, Medium harmful outcome / High synchronization facts; **Proposed**, assessment BLOCKED. Related TEST-004/001, Task 024/042. Best-practice отдельного нет. Checklist 19/20/37/73; 121–124 relevant follow-up, не полнота их прохождения. Horizon now для validation/owner decision.
- Affected: `apps/backend/src/modules/chat/chat.service.ts` start/read/send; match-conversations controller; moderation.service.ts block/end/unblock; common/prisma/user-pair-lock.ts; likes/matches writers; schema/migrations/tests §4. Root cause unsynchronized prechecks **Confirmed**, adverse persisted state **Inferred**.
- Minimal candidate fix **после** RV-01/policy: общий pair serialization boundary для start и block с повторной проверкой block/match внутри tx. Target: consistent documented writer protocol с проверкой duplicate fallback и существующих expired chats; DB safeguards лишь если применимы и согласованы.
- Alternatives: только проверить block ещё раз вне tx оставляет окно; глобальный `match.status=active` во всех reads/send ломает existing-expired contract; единственный successful race run и blanket lock recommendation не acceptance.
- Tests required RV-01 + independent review на fix SHA; Acceptance определяется permanent-close policy: block commit не оставляет новую доступную C через этот race, controls из RV-01 сохраняются, чужое membership denied и active Block скрывает доступ. Пока runtime result отсутствует, проблему не переводить Confirmed/Rejected автоматически.
- Documentation impact: task spec с timelines/SQL environment и concurrency contract; future consistency pass 121–124, не изменение audit registers здесь. History Q Proposed provisional P1 → synthesis Proposed/Blocked, source facts подтверждены, decisive runtime отсутствует.

2026-09-07: решение независимого Synthesis перенесено в центральный registry по разрешению владельца; нового аудита, execution, принятия remediation или изменения verdict не выполнялось.
