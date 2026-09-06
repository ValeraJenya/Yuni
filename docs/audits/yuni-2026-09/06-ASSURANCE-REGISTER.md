# Yuni — Assurance Register

## 1. Purpose

Хранить доказанно корректные ограниченные invariants и области, чтобы не повторять одну проверку без причины. Метод evidence задаёт [Audit Charter](01-AUDIT-CHARTER.md); связь с исходным checklist — [Mapping](05-AUDIT-CHECKLIST-MAPPING.md), проблемы хранятся отдельно в [Findings Register](03-FINDINGS.md).
Assurance подтверждает только указанные условия, версию и scope, а не безопасность модуля целиком. Создание реестра не является аудитом; реальные assurances здесь не добавляются.
Scope обновления протокола согласован владельцем: charter, findings template, Wave 1 plan, yuni-audit и этот реестр. `AGENTS.md` не изменяется по явному ограничению scope; общие Git/security/review правила сохраняются.

## 2. IDs and statuses

Формат ID: `ASR-001`, `ASR-002` и далее. Координатор назначает следующий свободный ID; ID не менять и не переиспользовать. Примеры формата не являются записями.

| Status | Значение |
| --- | --- |
| Candidate | Evidence ограниченного invariant представлено; независимый reviewer ещё не подтвердил достаточность. |
| Confirmed | Reviewer проверил evidence, негативные проверки и coverage boundaries на указанных SHA/окружении. |
| Expired | Срок или триггер актуальности наступил; требуется recheck, прежняя корректность не опровергнута. |
| Invalidated | Изменение зависимых условий или новое evidence лишило прежнее assurance применимости; причина сохранена. |
| Rejected | Кандидат отклонён с основанием; ID и история остаются. |

После recheck запись может получить Confirmed с новым SHA/date/evidence и сохранённой историей. До recheck не считать Expired/Invalidated актуальным подтверждением. Доказанное опровержение отдельно предложить как finding, не добавлять автоматически в другой реестр.

## 3. Master register

| Assurance ID | Scope / Invariant | Checklist refs | Commit SHA | Environment | Verified date | Evidence | Negative checks | Coverage boundaries | Reviewer | Reverification trigger | Related findings | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 4. Registry rules

- Не создавать assurance целого модуля формулировкой «всё безопасно»; указать конкретный invariant, сценарии, входы и границы.
- Отсутствие finding не является assurance. Прохождение тестов без оценки их качества и применимости к invariant недостаточно; mock-pass не доказывает DB/runtime-поведение.
- N/A обычно хранить в checklist mapping, а не здесь; `N/A — absence verified` требует evidence отсутствия/неприменимости и не является positive assurance.
- Evidence должно быть воспроизводимым: paths/symbols/строки на SHA, условия, synthetic inputs, команды/exit codes/results и источники runtime/test evidence. Граф зависимостей проверять исходным кодом.
- Обязательно указать negative checks и что именно не проверялось: ветви, данные, окружения, concurrency, интеграции и ограничения mock-ов по применимости. Не выдумывать исполненные проверки.
- Для Confirmed обязательны полный commit SHA, environment, verified date, evidence, coverage boundaries, reviewer и reverification trigger. В Candidate неизвестные metadata помечать Pending с причиной; пока необходимого evidence нет, не подтверждать.
- Изменение затронутого кода, schema, config, dependency или policy запускает перепроверку: перевести в Expired, либо Invalidated при утрате применимости. Нельзя автоматически переносить assurance на новый SHA.
- Устаревшие записи не удалять; сохранять историю и переводить в Expired/Invalidated. Не путать эти статусы с lifecycle findings.
- Не включать secrets, tokens, cookies, `.env`, private keys или PII; использовать synthetic examples и безопасные выдержки.
- Audit-pass возвращает candidates в свой output; редактировать этот реестр только при явном разрешении. Подтверждение требует независимого review, а не самооценки автора.
- Синхронизировать краткую строку и detailed entry ссылками; не копировать одно evidence целиком в оба места. Related findings — связь, не автоматическое закрытие проблемы.

## 5. Detailed assurance template

Пустой шаблон ниже не является assurance. Заполнять только при отдельном разрешении; неприменимые поля пояснять, неизвестное не выдавать за проверенное.

```markdown
## [ASR-ID] Scope / Invariant

- Assurance ID:
- Scope / Invariant:
- Checklist refs:
- Checklist source SHA256:
- Commit SHA:
- Environment:
- Verified date:
- Reviewer:
- Reverification trigger:
- Related findings:
- Status:

### Claim and preconditions

Ограниченное проверяемое утверждение, источник ожидаемого invariant и условия его действия.

### Evidence

Files/symbols, стабильные строки на SHA, commands/exit codes/results, synthetic reproduction, test/runtime evidence и оценка силы assertions; ссылки на исходный pass.

### Negative checks

Какие нарушения/отказы/граничные входы проверялись, ожидаемый и фактический результат; различать выполненное и предложенное.

### Coverage boundaries

Что проверено и что именно не проверялось; ограничения окружения, выборки и mock-ов, непроверенные интеграции и concurrency.

### Reverification

Изменения кода/schema/config/dependency/policy, срок или событие, требующие recheck; минимальная повторная проверка.

### Review history

Дата, reviewer, прежний/новый статус, основание, проверенные SHA и evidence. Сохранять причины Expired/Invalidated/Rejected и прошлые результаты.
```
