# AI Review Protocol

## Цель

Independent review должен находить ошибки в diff и task fit, а не подтверждать намерения executor-а.

## Blind review

Первый review по задаче является blind review.

Reviewer получает только:

- branch/PR/diff;
- task spec;
- `AGENTS.md`;
- `PROJECT_STATE.md`;
- `ROADMAP.md`;
- связанные architecture/security/API docs;
- связанные ADR;
- результаты checks;
- список изменённых файлов.

Reviewer не получает:

- историю чата executor-а;
- скрытые рассуждения;
- незафиксированные договорённости;
- объяснения вида «мы уже решили сделать именно так».

После первого review разрешается показать краткое обоснование спорного решения, если это помогает triage finding.

## Findings format

```text
ID:
Severity:
Status:
Evidence:
Risk:
Recommendation:
Related task:
```

Severity: `critical`, `high`, `medium`, `low`, `info`.

Finding statuses:

```text
verified
resolved
needs-recheck
deferred
false-positive
```

## SLA

Ожидаемый срок review от человека: 2 рабочих дня.

Если reviewer не ответил:

- low-risk/docs-only/isolated task может быть merged owner-ом с явной пометкой;
- задачи, затрагивающие auth, profiles, discovery, media, database, migrations, API, Docker, CI/CD, security или PII не merge-ятся без независимого review;
- blind review AI по этому протоколу считается независимым review.

## Evidence

Reviewer должен ссылаться на конкретные файлы, строки, commands, failed checks или missing tests. Findings без evidence не считаются verified.