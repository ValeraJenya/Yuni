# Yuni — Assurance Register

## 1. Purpose

Хранить доказанно корректные ограниченные invariants и области, чтобы не повторять одну проверку без причины. Метод evidence задаёт [Audit Charter](01-AUDIT-CHARTER.md); связь с исходным checklist — [Mapping](05-AUDIT-CHECKLIST-MAPPING.md), проблемы хранятся отдельно в [Findings Register](03-FINDINGS.md).
Assurance подтверждает только указанные условия, версию и scope, а не безопасность модуля целиком. При создании шаблона реальные assurances не добавлялись. Ниже по отдельному разрешению владельца интегрированы четыре ограниченных static assurances из Synthesis; нового аудита не проводилось.
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

### Wave 1 provenance and static limits

Решения: [Synthesis / Red-Team §§9–10/14](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), result commit `f2e94711b710262a58c88ca65416c12aaae6fc51` (`f2e9471`). Интеграция разрешена владельцем 2026-09-07; ASR-001–004 назначены как первые свободные ID пустого реестра.
Checked code: `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`; primary reports: `bac836bb06b536e9805fa382ab3272f4d49adec1`; synthesis input HEAD: `a756c5a4d721638b786c50903c2857fb6fd1e632`. Эти SHA имеют разные роли; статическое evidence не переносится автоматически на новую версию кода.
A = [Architecture](passes/wave-1/01-ARCHITECTURE-SPAGHETTI.md), T = [Testing](passes/wave-1/02-TEST-RELIABILITY.md), Q = [Security](passes/wave-1/03-SECURITY-DATA-INTEGRITY.md). Source symbols/строки ниже перенесены из Synthesis и относятся к checked code; source paths Media/serializer/storage — под `apps/backend/src/`, suite paths соответствуют указанным production файлам.
**Все четыре Confirmed относятся только к статическим границам.** Reviewer выполнил branch/control-flow trace; test assertions только прочитаны, runtime/HTTP/DB/filesystem execution не было. Commands/results чтения — Synthesis §3 (успешные focused batches exit 0; navigation errors раскрыты там), не новый test run интеграции. Вне описанных границ assurance не действует.
Четыре originals дают четыре records после явного merge owner A/Q в ASR-001 и split Q composite: filename отдельно ASR-004. Runtime-expanded claims остаются Candidate/BLOCKED в Synthesis §10 и [RV-09](07-WAVE-1-FOLLOWUPS.md#rv-09), отдельные positive records для них не созданы. AGENTS.md/skills/ADR не изменяются по allowlist владельца; это не новые обязательные engineering rules.

| Assurance ID | Scope / Invariant | Checklist refs | Commit SHA | Environment | Verified date | Evidence | Negative checks | Coverage boundaries | Reviewer | Reverification trigger | Related findings | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [ASR-001](#asr-001) | Media owner checks precede mutations | 2, 92, 98, 35, 37, 73 | `fed276a97fd84f29032c5eac1b11447bb1f3ed4c` | Static Windows; runtime not run | 2026-09-07 | [Evidence](#asr-001) | missing/foreign owner → throw до mutation; matched owner → продолжение | JWT/HTTP, TOCTOU, DB/FS, другие endpoints, URL privacy и concurrency исключены | Codex Synthesis / Red-Team | См. trigger в [ASR-001](#asr-001) | ARCH-001 (SEC-002 — merged source), TEST-001 | Confirmed |
| [ASR-002](#asr-002) | Rejected storage delete stops subsequent DB photo deletion | 93, 95, 117 | `fed276a97fd84f29032c5eac1b11447bb1f3ed4c` | Static Windows; runtime not run | 2026-09-07 | [Evidence](#asr-002) | rejected storage promise → выход до tx; resolved → tx/delete/promotion | partial unlink, actual rollback/FS, DB failure после unlink, retries/cache/concurrency исключены | Codex Synthesis / Red-Team | См. trigger в [ASR-002](#asr-002) | ARCH-001 (SEC-002 — merged source), TEST-001 | Confirmed |
| [ASR-003](#asr-003) | Explicit selected profile/photo projection | 36, 37, 73 | `fed276a97fd84f29032c5eac1b11447bb1f3ed4c` | Static Windows; runtime not run | 2026-09-07 | [Evidence](#asr-003) | private → photos []; false URL/unpublished/non-approved исключены; explicit output keys | scalar sensitive content, все API/PII/export/logs, corrupted inputs и direct URL/cache/runtime исключены | Codex Synthesis / Red-Team | См. trigger в [ASR-003](#asr-003) | ARCH-001 (SEC-002 — merged source), другой lifecycle boundary | Confirmed |
| [ASR-004](#asr-004) | Lexical media filename boundary before unlink | 35, 37, 73 | `fed276a97fd84f29032c5eac1b11447bb1f3ed4c` | Static Windows; runtime not run | 2026-09-07 | [Evidence](#asr-004) | unsupported MIME → throw до write; invalid key → return без unlink; valid/ENOENT/error paths | realpath/symlink/junction/OS/case, unpredictability, hostile FS, rename, content decoding и URL/privacy исключены | Codex Synthesis / Red-Team | См. trigger в [ASR-004](#asr-004) | ARCH-001 (SEC-002 — merged source) | Confirmed |

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

## 6. Wave 1 confirmed static assurances

<a id="asr-001"></a>
### ASR-001 — Media owner checks precede mutations

- Assurance ID: ASR-001.
- Scope / Invariant: Media owner checks precede mutations; точные claim/preconditions ниже, без расширения на весь модуль.
- Checklist refs: 2, 92, 98, 35, 37, 73; Checklist source SHA256: `44FD1F11FA3953AF03E51C8EFD6233996F1C51C58193ABC106BB252BEBF51B6E`.
- Commit SHA: `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`.
- Static verification environment: Static source/branch review, Windows NT 10.0.26200.0, PowerShell 7.6.5, Node v24.19.0; dependencies absent, pnpm Unknown, CodeGraph binding BLOCKED; runtime/tests not executed.
- Verified date: 2026-09-07, Europe/Moscow (UTC+03:00).
- Reviewer: Codex Synthesis / Red-Team; Source: A §7 + owner-компонент Q §9; independent evidence/decision — Synthesis §§9–10/14 на result commit выше.
- Reverification trigger: controller/guard/decorator, actor/owner model, helpers/ordering/schema; повторить branch trace, owner negatives; расширение HTTP/runtime только RV-09.
- Related findings: ARCH-001 (SEC-002 — merged source), TEST-001; эти связи не закрывают underlying defects.
- Status: **Confirmed** — только ограниченный static claim.

**Claim, evidence, negative checks и coverage boundaries:** ниже сохранены суженные формулировки Synthesis §9 «REST media owner check precedes mutations — A §7 + owner-часть Q §9». Упоминания §1/2/9 и RV относятся к Synthesis/Followups, не к новому выполнению checks.

**Original:** A «Assurance candidate — REST media owner check precedes mutations»; Q «Candidate — Media owner and filename boundary», только owner-компонент. **Reviewed claim:** в `MediaService.setProfilePhotoPrimary` / `deleteProfilePhoto` при отсутствующей прочитанной photo либо несовпадающем owner управление не достигает DB mutation/storage delete. Preconditions: trusted currentUser.id, обычный возвращённый resource, вызов именно этих методов; источник invariant — AGENTS dating owner checks и `common/security/access-control.ts:34–49`.

**Evidence / actual static result:** `media.service.ts:136–144,177–200`: actor gate → find → assertFound → assertOwner → первая mutation. Missing fixture идёт в 404 throw, foreign owner в 403 throw, matched owner проходит дальше; throw не перехватывается для продолжения. `media.controller.ts:22,46–61` получает CurrentUser и UUID parameter. Specs:394–413,456–475 содержат expected rejects и no DB mutation/no storage calls — полезные discriminating assertions, исполнения здесь нет.

**Boundaries:** не проверены достоверность JWT в runtime, TOCTOU смены owner/actor status, обход другого endpoint, malformed DB row, HTTP exception mapping, реальная FS/DB, storage URL privacy, concurrency. Это не assurance upload/MediaModule целиком и не опровержение ARCH-001. Checklist A 2/92/98 + Q 35/37/73. Reverify при изменении controller/guard/decorator/helper/owner model/ordering/schema; минимум повторить branch trace и разрешённые owner negatives, при integration claim — RV-09.

**Review history:** 2026-09-07, исходный Candidate → independently Confirmed только в указанных статических границах; интеграция переносит это решение, а не повторяет source review. Изменение source/schema/config/dependency/policy требует recheck; прежнее assurance нельзя автоматически переносить на новый SHA (Expired/Invalidated по правилам реестра).

<a id="asr-002"></a>
### ASR-002 — Rejected storage delete stops subsequent DB photo deletion

- Assurance ID: ASR-002.
- Scope / Invariant: Rejected storage delete stops subsequent DB photo deletion; точные claim/preconditions ниже, без расширения на весь модуль.
- Checklist refs: 93, 95, 117; Checklist source SHA256: `44FD1F11FA3953AF03E51C8EFD6233996F1C51C58193ABC106BB252BEBF51B6E`.
- Commit SHA: `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`.
- Static verification environment: Static source/branch review, Windows NT 10.0.26200.0, PowerShell 7.6.5, Node v24.19.0; dependencies absent, pnpm Unknown, CodeGraph binding BLOCKED; runtime/tests not executed.
- Verified date: 2026-09-07, Europe/Moscow (UTC+03:00).
- Reviewer: Codex Synthesis / Red-Team; Source: T, Assurance section; independent evidence/decision — Synthesis §§9–10/14 на result commit выше.
- Reverification trigger: await/catch/transaction ordering, adapter или DB policy; static trace; для runtime claims RV-02/09.
- Related findings: ARCH-001 (SEC-002 — merged source), TEST-001; эти связи не закрывают underlying defects.
- Status: **Confirmed** — только ограниченный static claim.

**Claim, evidence, negative checks и coverage boundaries:** ниже сохранены суженные формулировки Synthesis §9 «Rejected storage delete prevents subsequent DB photo deletion — T Assurance section». Упоминания §1/2/9 и RV относятся к Synthesis/Followups, не к новому выполнению checks.

**Original:** «Candidate, ASR-ID pending — rejected storage delete prevents subsequent DB photo deletion». **Reviewed claim:** в последовательном control flow `deleteProfilePhoto` rejected promise от awaited `storage.deleteProfilePhoto` не позволяет вызвать последующий `$transaction`/photo delete. Preconditions: owner checks пройдены, storage действительно rejects, речь об этой invocation. Это сужение до source order, не «файл физически существует после отказа».

**Evidence / negatives:** `media.service.ts:185–203`: единственный await storage:200 до tx:202, catch между ними отсутствует. При synthetic rejected dependency управление выходит с той же ошибкой; при resolved dependency идёт tx/delete/promotion. Spec:527–551 моделирует отказ, проверяет исходную ошибку и отсутствие DB deletion; **не содержит отдельного assertion на отсутствие `$transaction`**, более сильное утверждение подтверждено исходным порядком, не приписано тесту. Success spec:477–525 проверяет storage-before-row порядок.

**Boundaries:** mock не моделирует частично выполнившийся unlink с последующим reject, rollback, file permission/symlink semantics, DB error после успешного unlink, concurrent operations/retries/cache. Task 047 намеренно обсуждает другой failure tradeoff; эта assurance не делает DB/disk lifecycle атомарным. Checklist 93/95/117. Related ARCH-001/SEC-002 — соседняя стадия, TEST-001 — limits tx mocks. Reverify при перестановке await/catch/transaction, смене adapter/DB policy; static trace + RV-02/09 для расширения claims.

**Review history:** 2026-09-07, исходный Candidate → independently Confirmed только в указанных статических границах; интеграция переносит это решение, а не повторяет source review. Изменение source/schema/config/dependency/policy требует recheck; прежнее assurance нельзя автоматически переносить на новый SHA (Expired/Invalidated по правилам реестра).

<a id="asr-003"></a>
### ASR-003 — Explicit selected profile/photo projection

- Assurance ID: ASR-003.
- Scope / Invariant: Explicit selected profile/photo projection; точные claim/preconditions ниже, без расширения на весь модуль.
- Checklist refs: 36, 37, 73; Checklist source SHA256: `44FD1F11FA3953AF03E51C8EFD6233996F1C51C58193ABC106BB252BEBF51B6E`.
- Commit SHA: `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`.
- Static verification environment: Static source/branch review, Windows NT 10.0.26200.0, PowerShell 7.6.5, Node v24.19.0; dependencies absent, pnpm Unknown, CodeGraph binding BLOCKED; runtime/tests not executed.
- Verified date: 2026-09-07, Europe/Moscow (UTC+03:00).
- Reviewer: Codex Synthesis / Red-Team; Source: Q §9, Explicit profile/photo response projection; independent evidence/decision — Synthesis §§9–10/14 на result commit выше.
- Reverification trigger: serializer fields/spreads/callers, privacy schema/config/types/dependencies/policy; filters/projection trace, разрешённые exact-shape canary tests RV-09.
- Related findings: ARCH-001 (SEC-002 — merged source), другой lifecycle boundary; эти связи не закрывают underlying defects.
- Status: **Confirmed** — только ограниченный static claim.

**Claim, evidence, negative checks и coverage boundaries:** ниже сохранены суженные формулировки Synthesis §9 «Explicit profile/photo response projection — Q §9». Упоминания §1/2/9 и RV относятся к Synthesis/Followups, не к новому выполнению checks.

**Original/retained bounded claim:** проверенные `toPublicProfile`, `toPublicProfilePhotos`, `toSelfProfilePhoto` строят explicit allowlists, не передают raw source object; public photos требуют truthy publicUrl, publishedAt и approved; private profile всегда получает пустой photos. Policy: `docs/security/data-exposure-rules.md:5–27,115–133`; self moderation fields специально разрешены.

**Evidence / negatives:** `common/serializers/user-profile.serializer.ts:131–154,193–223`: false URL / unpublished / non-approved отсеиваются conjunctive filter; private branch:152 возвращает []; output literal не включает storageKey/tokenHash/local path. `user-profile.serializer.spec.ts:13–91,167–176` проверяет exact public/self photo shapes, private/partial private и смесь photos. Fixture не инжектирует произвольные forbidden source keys — силу этих assertions не преувеличиваем; media upload fixture/assertion:275–331 дополнительно содержит synthetic storage field и отсутствие storageKey в response. `ProfilesService.getByHandle:98–119` вызывает access/block checks и этот projection; Media upload:120 — self photo projection. Существующий `toCompactPublicProfile:156–169` делегирует public projection, но весь набор его callers здесь не сертифицирован.

**Boundaries:** scalar values из allowlist не автоматически очищены от произвольного sensitive текста; не заявлено отсутствие всей PII (public gender/lookingFor остаются), полное покрытие всех API/export/notifications/discovery callers или exception logging. Не проверены browser/API serialization, corrupted runtime inputs/types, direct static photo GET, revocation/cache, owner/target lifecycle races. Checklist 36/37/73. Reverify при новых fields/spreads/serializer callers/privacy schema/config/type/dependency/policy; повторить filters/projection trace и exact-shape tests с meaningful canaries в разрешённой среде (RV-09).

**Review history:** 2026-09-07, исходный Candidate → independently Confirmed только в указанных статических границах; интеграция переносит это решение, а не повторяет source review. Изменение source/schema/config/dependency/policy требует recheck; прежнее assurance нельзя автоматически переносить на новый SHA (Expired/Invalidated по правилам реестра).

<a id="asr-004"></a>
### ASR-004 — Lexical media filename boundary before unlink

- Assurance ID: ASR-004.
- Scope / Invariant: Lexical media filename boundary before unlink; точные claim/preconditions ниже, без расширения на весь модуль.
- Checklist refs: 35, 37, 73; Checklist source SHA256: `44FD1F11FA3953AF03E51C8EFD6233996F1C51C58193ABC106BB252BEBF51B6E`.
- Commit SHA: `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`.
- Static verification environment: Static source/branch review, Windows NT 10.0.26200.0, PowerShell 7.6.5, Node v24.19.0; dependencies absent, pnpm Unknown, CodeGraph binding BLOCKED; runtime/tests not executed.
- Verified date: 2026-09-07, Europe/Moscow (UTC+03:00).
- Reviewer: Codex Synthesis / Red-Team; Source: filename-компонент Q §9, Media owner and filename boundary; independent evidence/decision — Synthesis §§9–10/14 на result commit выше.
- Reverification trigger: adapter/constants/path/MIME dependency/platform/policy; повторить lexical predicate; filesystem extension только RV-09 с отдельным scope.
- Related findings: ARCH-001 (SEC-002 — merged source); эти связи не закрывают underlying defects.
- Status: **Confirmed** — только ограниченный static claim.

**Claim, evidence, negative checks и coverage boundaries:** ниже сохранены суженные формулировки Synthesis §9 «Media filename boundary — filename-часть Q §9». Упоминания §1/2/9 и RV относятся к Synthesis/Followups, не к новому выполнению checks.

**Original:** второй компонент «Candidate — Media owner and filename boundary». **Reviewed claim:** save формирует storage filename из нового UUID + MIME extension; original name не входит в adapter input. Delete перед unlink пропускает лишь ключ с ожидаемым prefix, basename, matching lower-case UUID/extension regex и lexical resolved-path containment. Invalid key возвращает управление **без unlink**, а не обязательно throws.

**Evidence / negatives:** `media/storage/local-profile-photo-storage.service.ts:16–37,39–58,61–100`: unsupported MIME throws до mkdir/write; missing/invalid path return до unlink; ENOENT suppressed, прочие errors rethrow. Spec:29–61 positive save/unsupported MIME; :63–104 valid delete/ENOENT/EACCES; :106–123 wrong prefix/traversal/nested/unsupported extension/non-UUID/absolute path — no-unlink assertions. Path library и fs/UUID mocked; это чтение structure, не выполненный filesystem negative.

**Boundaries:** regex — naming convention, не доказательство UUID unpredictability. Lexical containment не realpath/symlink/junction/case/filesystem assurance. Не проверены hostile OS/filesystem, concurrent rename, actual separators/platform behavior, content decoding/magic bytes completeness, malware, public URL access/cache. Checklist 35/37/73. Related ARCH-001/SEC-002: filename ограничение не решает compensation. Reverify при adapter/constants/path/MIME dependency/platform/policy изменениях; static acceptance predicate и отдельные RV-09 filesystem checks по согласованному scope.

**Review history:** 2026-09-07, исходный Candidate → independently Confirmed только в указанных статических границах; интеграция переносит это решение, а не повторяет source review. Изменение source/schema/config/dependency/policy требует recheck; прежнее assurance нельзя автоматически переносить на новый SHA (Expired/Invalidated по правилам реестра).
