# Runtime Validation Backlog

Источник решений: [Synthesis / Red-Team §§11–12](passes/wave-1/04-SYNTHESIS-RED-TEAM.md), result commit `f2e94711b710262a58c88ca65416c12aaae6fc51` (`f2e9471`), 2026-09-07. Перенос по разрешению владельца, без нового аудита, execution или принятия product policy.
C = проверенный code commit `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`; reports R = `bac836bb06b536e9805fa382ab3272f4d49adec1`; synthesis input S = `a756c5a4d721638b786c50903c2857fb6fd1e632`. На remediation SHA результаты нужно получать заново. Findings — в [03-FINDINGS.md](03-FINDINGS.md), static assurances — в [06-ASSURANCE-REGISTER.md](06-ASSURANCE-REGISTER.md).
Всего **9 validation items**, исходные RV-01–09 сохранены. Все **Not run / Pending separate authorization**. Runtime backlog не является списком новых Confirmed findings: только SEC-003 блокирует confirmation проблемы; остальные RV расширяют evidence узких static findings/assurances. Merged SEC-002/004 — ссылки на ARCH-001/002, не отдельные findings.

**Общие stop conditions / safety gate G (для каждого RV):** до исполнения нужен отдельный явный scope/acceptance, dependency-equipped disposable copy на полном SHA, synthetic users/messages/photos и собственные test keys, проверенные абсолютные DB/storage targets и исключённый доступ к рабочим/production/staging данным. STOP при неопределённой изоляции/target, secrets/PII, несогласованных migrations/seeds/cleanup, новых tests, fault/barrier/mutation instrumentation или внешних requests. Суффикс `_test` не доказывает безопасность. Зависимый от Pending owner policy шаг не запускать. Не выполнять эксперименты в текущем checkout. Сохранить версии, migration state/isolation, exact commands/exits, enforced ordering и безопасные results; отсутствие разрешения не исправлять установкой tooling или сменой environment.
Ни один пункт ниже не разрешает исполнение, принятие риска или remediation. Приоритет validation — последовательность получения evidence из Synthesis, а не новая severity; неуказанный порядок остаётся Pending.

## RV-01

- ID: RV-01; Status: Not run / Pending separate authorization.
- Связанный finding / assurance: RV-01 — SEC-003, related TEST-004/001; первый приоритет.
- Что нужно доказать: Реальную достижимость active Conversation / blocked Match после precheck → block commit → insert и доступ после последнего unblock; статический trace этого не подтверждает.
- Необходимое окружение: Отдельная disposable PostgreSQL DB на C или согласованном remediation SHA, verified migrations/isolation, synthetic pair, unexpired match, HTTP/read/send fixture.
- Безопасный метод (после G): Disposable PostgreSQL, verified migration state/isolation и разрешённый barrier после всех start prechecks до tx insert. Два active synthetic members, unexpired match, no C/no Block. Start paused → block commit → resume start; записать DB Block/Match/C states и exact API outcomes; затем убрать последний Block и проверить read/text-send обоими участниками. Повторить block-before-start и start-commit-before-block
- Stop conditions: G; DEC-001 и DEC-005 Pending; STOP без принятого concurrent block/start contract, verified DB/storage targets или разрешённого barrier.
- Ожидаемый результат / controls: Проверка гипотезы должна явно показать, возникает ли active C/blocked M. При существующем live Block новые read/send запрещены; после unblock уже closed C остаётся закрыт. Контроли: foreign member denied, expired match/no C denied, existing-expired conversation не сломана, opposite-direction Block всё ещё запрещает, duplicate start не создаёт вторую C. Если race outcome не возникает, объяснить конкретный SQL/runtime barrier; одного прогона без enforced ordering мало.
- Приоритет validation: Первый по Synthesis §12; до подтверждения provisional P1.

## RV-02

- ID: RV-02; Status: Not run / Pending separate authorization.
- Связанный finding / assurance: RV-02 — ARCH-001/SEC-002, storage sequencing assurances.
- Что нужно доказать: Actual DB/disk outcome post-commit profile-read failure, сохранность committed asset и отдельную retry semantics ambiguous response.
- Необходимое окружение: Isolated unit fixture; отдельно disposable DB + temp storage + synthetic bitmap, разрешённый post-commit failpoint.
- Безопасный метод (после G): Сначала isolated unit fixture: successful storage+tx, reject последующего profile read; отдельно disposable actual DB/storage fixture с синтетическим bitmap и согласованным failpoint только после commit. Проверить и row, и файл до/после; retry после ambiguous response исследовать отдельно
- Stop conditions: G; DEC-003/005; STOP при неопределённом target/failpoint scope, риске реальных файлов/данных или непринимаемом response/retry contract для зависимых assertions.
- Ожидаемый результат / controls: Current predicted result — committed row остаётся при cleanup файла. Acceptance remediation — post-commit response failure не удаляет committed asset. Controls: tx create rejection чистит uncommitted upload; cleanup rejection сохраняет исходный error; happy upload возвращает row/file; delete storage rejection не удаляет row. Не объявлять DB/filesystem atomicity из одного mock.
- Приоритет validation: После RV-01, ранняя группа RV-02/03 по Synthesis.

## RV-03

- ID: RV-03; Status: Not run / Pending separate authorization.
- Связанный finding / assurance: RV-03 — ARCH-002/SEC-004/TEST-003.
- Что нужно доказать: Session state и outgoing waiter/retry identity при delayed success/rejection и смене intent; actual browser cookie delivery отдельно.
- Необходимое окружение: Existing hook renderer/jsdom с deferred promises, synthetic sessions; отдельный synthetic browser стенд только по разрешению.
- Безопасный метод (после G): Существующий hook renderer с deferred promises, наблюдением user/token/isAuthenticated и outgoing request headers. Pending refresh → completed logout → late success; old refresh reject после новой identity; overlaps register/login; waiter authenticatedRequest после session смены. Отдельный synthetic browser pass для actual cookie delivery
- Stop conditions: G; DEC-002/005; STOP для policy-dependent assertions без решения о precedence, либо при browser/HTTP действиях вне согласованного scope.
- Ожидаемый результат / controls: Latest согласованный intent сохраняется; старый response/rejection не меняет новую session, старый waiter не отправляет запрос с недопустимой identity. Positive controls: one bootstrap у consumer, none without consumer, multi-consumer dedupe, normal refresh/login/logout, single 401 retry; не бесконечный retry, остальные errors не swallow. Первичный bootstrap не моделировать формой, которую AuthLayout реально скрывает.
- Приоритет validation: После RV-01, ранняя группа RV-02/03 по Synthesis.

## RV-04

- ID: RV-04; Status: Not run / Pending separate authorization.
- Связанный finding / assurance: RV-04 — ARCH-003.
- Что нужно доказать: Messages/error/draft ownership при late send и смене selected chat, включая same-conversation draft edit.
- Необходимое окружение: Dependency-equipped disposable frontend copy, existing pure/request-state fixtures; browser/component additions требуют отдельного решения.
- Безопасный метод (после G): Deferred send A; выбрать B и завершить GET B; отредактировать draft B; resolve/reject A, также same-conversation edit во время send. Existing pure/request state tests; browser/component additions только после отдельного решения по AGENTS
- Stop conditions: G; DEC-005; STOP без разрешения на новые component/browser fixtures или при недетерминированном/неограниченном внешнем запросе.
- Ожидаемый результат / controls: POST destination A не меняется; B renderer/draft не получают A side effect; A preview обновляется адресно. Controls: обычный send в активном A, GET cleanup на смене, late rejection не ошибочно помечает B, send guard не ломается. Network ordering детерминирован promises, не sleeps.
- Приоритет validation: Pending: Synthesis рекомендует раннюю scoped frontend validation (§16), точный порядок RV-04 не назначен.

## RV-05

- ID: RV-05; Status: Not run / Pending separate authorization.
- Связанный finding / assurance: RV-05 — TEST-001, related tx assurances / SEC-003.
- Что нужно доказать: Различимость root/tx routing отдельно от реальных DB rollback/durability, multi-write failure и CAS loser concurrency.
- Необходимое окружение: Distinct root/tx spies; для persistence — отдельная migrated disposable PostgreSQL DB с synthetic users/messages и согласованным cleanup/failure scope.
- Безопасный метод (после G): Раздельные root/tx spies в register/like/chat caller tests; negative routing assertions. Отдельно DB failure после первого из связанных writes (register/token, like/match/notification, message/notification), verified transaction isolation и cleanup scope; CAS loser concurrency отдельно
- Stop conditions: G; DEC-005; STOP без разрешения fault/mutation/CAS/barriers, доказанной DB isolation или synthetic targets. Unit routing не закрывает DB proof.
- Ожидаемый результат / controls: Unit должен различать переданный tx и root; existing distinct cases — positive comparison. DB rows/notifications отсутствуют после согласованного rollback failure; successful control сохраняет всю ожидаемую группу. Предполагаемый surviving mutant проверять только при новом mutation разрешении; routing-pass не доказательство DB rollback.
- Приоритет validation: Targeted regression group RV-05–08 после ранних RV по Synthesis; внутри группы порядок Pending.

## RV-06

- ID: RV-06; Status: Not run / Pending separate authorization.
- Связанный finding / assurance: RV-06 — TEST-002/003, related SEC-001.
- Что нужно доказать: Реальную cookie/guard lifecycle boundary production-equivalent bootstrap и отдельно browser credentials behavior.
- Необходимое окружение: Disposable PostgreSQL + Nest bootstrap с cookie middleware, synthetic cookie jar/keys, positive protected route; browser отдельно.
- Безопасный метод (после G): Production-equivalent Nest bootstrap с cookie middleware; disposable DB и synthetic cookie jar. HTTP register/login → refresh rotation → old refresh reuse → logout → refresh; positive protected route; missing/tampered/expired/wrong-signature bearer
- Stop conditions: G; DEC-002/005/006 для зависимых cases; STOP при реальных credentials, неизвестной среде или неподтверждённой issuer/audience/revoke policy.
- Ожидаемый результат / controls: Exact status/body и cookie options/transport соответствуют contract; missing cookie/wrong secret/reused refresh denied, valid protected bearer accepted. JS fetch options и реальное browser credentials поведение различаются; issuer/audience/access-after-logout cases только после §11 policy. Не заменять negative matrix одним no-auth export.
- Приоритет validation: Targeted regression group RV-05–08; точный порядок Pending.

## RV-07

- ID: RV-07; Status: Not run / Pending separate authorization.
- Связанный finding / assurance: RV-07 — TEST-004.
- Что нужно доказать: Exact allowed outcomes обоих enforced like/block orders при сохранении final no-active-match invariant; flake rate отдельно.
- Необходимое окружение: Disposable PostgreSQL и deterministic fixtures с разрешёнными barriers, structured HTTP responses и final DB query.
- Безопасный метод (после G): Separate deterministic fixtures: (a) block committed before reciprocal-like precheck; (b) like precheck до block, порядок tx фиксирован; сохранить final DB query; exact structured HTTP status вместо generic catch-all
- Stop conditions: G; DEC-005; STOP без возможности доказать ordering/targets, при unexpected 409/500/timeout: не маскировать catch-all/retry-until-pass.
- Ожидаемый результат / controls: (a) block success, like expected 403, no active match; (b) только outcomes, доказанные заданным ordering, и no active match после block. 409/500/timeouts не считать допустимыми по одному rejected. Оба fulfilled не universal oracle. Flake rate измерять отдельно, не выводить из static trace.
- Приоритет validation: Targeted regression group RV-05–08; точный порядок Pending.

## RV-08

- ID: RV-08; Status: Not run / Pending separate authorization.
- Связанный finding / assurance: RV-08 — SEC-001.
- Что нужно доказать: Actual revoke при wrong/empty secret известного synthetic locator и отсутствие enumeration в public response.
- Необходимое окружение: Disposable auth DB/HTTP fixture с synthetic session row/keys; limiter без изменения; locator только из fixture.
- Безопасный метод (после G): Synthetic refresh row/locator известен только из тестовой fixture. Wrong/empty suffix, valid cookie, expired/revoked/missing locator, repeated logout; endpoint rate-limiter untouched
- Stop conditions: G; DEC-005 и DEC-002 для session-scope ожиданий; STOP при нужде искать/угадывать реальные locator, brute force или применять real cookies.
- Ожидаемый результат / controls: Проверить, меняется ли row при incorrect secret (предсказание C: да для известного active locator). Acceptance: неправильное доказательство владения не отзывает чужую session; valid logout отзывает нужную по согласованной policy; generic public response без enumeration. Никакого угадывания UUID, bruteforce или поиска реальных locator.
- Приоритет validation: Targeted regression group RV-05–08; точный порядок Pending.

## RV-09

- ID: RV-09; Status: Not run / Pending separate authorization.
- Связанный finding / assurance: RV-09 — assurances §9.
- Что нужно доказать: Runtime расширения ASR-001–004: owner HTTP boundary, meaningful projection canaries и real platform adapter behavior.
- Необходимое окружение: Раздельные synthetic A/B HTTP fixtures, serializer fixtures и временный FS на согласованной платформе.
- Безопасный метод (после G): Раздельные owner HTTP fixtures A/B + missing ID; projection canaries с meaningful forbidden fields и partial private/photo states; temp FS adapter на согласованной платформе с безопасными filenames и разрешёнными error cases
- Stop conditions: G; DEC-005, DEC-003 для privacy contract; STOP без отдельного explicit scope для symlink/junction/hostile FS/direct URL, либо при реальных assets.
- Ожидаемый результат / controls: Foreign/missing owner не достигает mutation; output только допустимые keys/approved published photos; invalid lexical key не вызывает unlink; supported save и valid delete positive controls. Symlink/junction/hostile FS и direct URL privacy требуют отдельного explicit scope, не следуют из обычного unit разрешения.
- Приоритет validation: Pending: Synthesis не назначает RV-09 отдельный rank; запуск по scope расширения assurance.

# Owner Decisions Required

Все **6 решений Pending**, адресованы Валере и Жене; роли из Synthesis §11 — предложения маршрутизации, не принятые назначения. Ни policy, ни риск не Accepted/Deferred. Approval интеграции документов не является approval validation или implementation. DEC IDs назначены здесь для traceability шести существующих вопросов, новые продуктовые решения не добавлены.

## DEC-001

- Decision ID: DEC-001; Status: **Pending**.
- Вопрос: Распространяется ли permanent close при block на concurrent ещё не созданную conversation; какой результат start допустим после committed block?
- Почему необходимо: Это определяет acceptance и оценку серьёзного последствия SEC-003; existing closed conversation и concurrent creation нельзя приравнять без явного contract.
- Findings/tests, зависящие от решения: SEC-003; RV-01; existing-expired, opposite-direction block и duplicate-start controls.
- Варианты / границы выбора: Synthesis: запрет active C после block закрепляет общее ordering; допущение нового chat после unblock требует отдельного product contract и переоценки impact, не снимая source race автоматически.
- Владельцы решения (маршрутизация из Synthesis): Валера + Женя.

## DEC-002

- Decision ID: DEC-002; Status: **Pending**.
- Вопрос: Каков session intent precedence refresh/login/register/logout; отдельно single-session/family/global logout и lifetime access после logout?
- Почему необходимо: Memory-session ordering и server revocation разные boundaries; dependent assertions не могут исходить из выбранной агентом denylist/TTL policy.
- Findings/tests, зависящие от решения: ARCH-002 (SEC-004 merged source), TEST-002/003; RV-03/06, session-scope controls RV-08.
- Варианты / границы выбора: Synthesis: immediate revoke расширяет backend scope; TTL-based policy даёт другие expected negatives. Точный precedence и logout scope пока не выбраны; source defect stale completion остаётся.
- Владельцы решения (маршрутизация из Synthesis): Валера + Женя.

## DEC-003

- Decision ID: DEC-003; Status: **Pending**.
- Вопрос: Каков contract direct media links после private/block/reject/delete, cache horizon и смысл successful upload при ошибке построения response?
- Почему необходимо: API projection и direct static serving — разные boundaries; response/retry и privacy acceptance требуют product intent.
- Findings/tests, зависящие от решения: ARCH-001 (SEC-002 merged source); RV-02, privacy-dependent RV-09, future media privacy pass.
- Варианты / границы выбора: Synthesis не задаёт готовый набор вариантов или выбранную policy; direct-link contract и response semantics остаются открытыми.
- Владельцы решения (маршрутизация из Synthesis): Валера + Женя.

## DEC-004

- Decision ID: DEC-004; Status: **Pending**.
- Вопрос: Каковы target inactive/deleted profile visibility и in-flight account/block policy?
- Почему необходимо: Нельзя автоматически распространять actor helper на target/recipient; отсутствие account-delete workflow не задаёт privacy intent.
- Findings/tests, зависящие от решения: ARCH-004; Profiles lookup, future Backend/API/Security tests и actor/target/recipient contract checks.
- Варианты / границы выбора: Synthesis не выбирает варианты; 401 actor, 404 target и recipient suppression — существующее counterevidence, не принятое новое правило.
- Владельцы решения (маршрутизация из Synthesis): Валера; техническая матрица — Женя.

## DEC-005

- Decision ID: DEC-005; Status: **Pending**.
- Вопрос: Какую отдельную synthetic validation environment использовать; какие fixtures/mutations разрешить, какие PostgreSQL/dependency versions и evidence retention задать?
- Почему необходимо: Все RV требуют явной изоляции, safe targets и разрешения операций; наличие backlog и имя БД не дают такого разрешения.
- Findings/tests, зависящие от решения: Все RV-01–09, в первую очередь SEC-003/RV-01; runtime extensions ASR-001–004.
- Варианты / границы выбора: Synthesis требует dependency-equipped disposable copy/DB/storage с synthetic data и отдельным scope; конкретная реализация/версии/retention не выбраны.
- Владельцы решения (маршрутизация из Synthesis): Женя; подтверждение scope Валерой.

## DEC-006

- Decision ID: DEC-006; Status: **Pending**.
- Вопрос: Какие issuer/audience/allowed algorithms, environment key separation/rotation и grace policy нужны до production?
- Почему необходимо: Без policy нельзя задавать соответствующие expected token negatives или предполагать crypto bypass/shared keys.
- Findings/tests, зависящие от решения: TEST-002, key-policy follow-up, policy-dependent RV-06; session UX.
- Варианты / границы выбора: Synthesis не задаёт выбранные значения/варианты; реальные keys не читались.
- Владельцы решения (маршрутизация из Synthesis): Женя + Валера для session UX.

Приоритет remediation и принятие остаточного риска остаются отдельными решениями владельцев. AGENTS.md/ADR/skills не меняются по allowlist задачи: этот backlog фиксирует открытые вопросы, не вводит новые project rules.
