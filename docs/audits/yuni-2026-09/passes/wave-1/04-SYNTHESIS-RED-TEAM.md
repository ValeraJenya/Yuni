# Yuni — Wave 1 Synthesis / Red-Team Review

Независимый статический review, 2026-09-07, Europe/Moscow (UTC+03:00). Reviewer: Codex, отдельный synthesis task; executor chats и скрытые рассуждения primary agents не использовались. Основание scope: прямое задание координатора/владельца и [specification](../../prompts/wave-1/04-SYNTHESIS-RED-TEAM.md). Применён repo-skill `yuni-audit`; implementation и принятие remediation не входят в разрешение.

Итог: **12 исходных IDs сохранены; 8 Confirmed, 1 Confirmed with changed severity, 2 Merge with another finding, 1 Blocked pending runtime validation**. После merges — 10 самостоятельных записей: 9 подтверждённых ограниченных проблем и 1 Proposed с provisional P1. Подтверждённых P0/P1 нет. Центральные регистры не редактировались; результаты ниже — предложения координатору, не Accepted/Implemented/Verified fixes.

## 1. Environment fingerprint

| Параметр / gate | Фактическое значение / результат |
| --- | --- |
| EXPECTED_WORKTREE_ROOT | `D:\Yuni-audit-synthesis` |
| Git root / canonical native root | `D:/Yuni-audit-synthesis` / `D:\Yuni-audit-synthesis`; совпали с expected |
| Worktree | Отдельный linked worktree; common Git directory `D:/Yuni/.git`; `git worktree list --porcelain` подтвердил выделенный synthesis root |
| Branch | Detached HEAD; `git branch --show-current` пуст. Переключение ветки не выполнялось |
| HEAD | `a756c5a4d721638b786c50903c2857fb6fd1e632` = SYNTHESIS_INPUT_SHA |
| Audit tag | `audit/yuni-2026-09-wave1` → CODE_AUDIT_SHA |
| Synthesis tag | `audit/yuni-2026-09-wave1-synthesis` → SYNTHESIS_INPUT_SHA |
| Root link check | Get-Item для root и диска: LinkType/Target отсутствуют; Resolve-Path и Node `fs.realpathSync.native` совпали. Canonical auth source также внутри synthesis root |
| Исходный status | `## HEAD (no branch)`; porcelain с `--untracked-files=all` пуст; output отсутствовал |
| OS / shell / Node | Windows NT 10.0.26200.0; PowerShell 7.6.5; Node v24.19.0 |
| pnpm | Unknown/BLOCKED: обнаружен Corepack shim; версия не запускалась во избежание загрузки/изменения tooling cache. EPERM из primary reports не объявляется результатом этого review |
| Dependencies | `node_modules`, `apps/backend/node_modules`, `apps/frontend/node_modules` отсутствуют; install не выполнялся |
| Начало preflight | `2026-09-07T00:55:56.0597126+03:00`; системная зона Russian Standard Time соответствует Europe/Moscow |
| CODE_AUDIT_SHA..REPORTS_SHA | PASS: ровно три primary reports, перечисленные в §2 |
| REPORTS_SHA..SYNTHESIS_INPUT_SHA | PASS: только synthesis specification |
| CODE_AUDIT_SHA..SYNTHESIS_INPUT_SHA | PASS: только объединение этих четырёх Markdown paths; production code, tests, schema/migrations и configuration не менялись |
| Frozen-target / initial allowlist gate | **PASS до анализа findings**; несовпадений, требующих STOP, нет |

CodeGraph: доступный read-only `symbol_search(AuthService, compact=true, limit=3)` вернул правильный абсолютный файл `apps/backend/src/modules/auth/auth.service.ts`, class на строке 62; путь и символ сверены локально. Embeddings building, доступен name/text search. Среди восьми доступных read APIs нет project/workspace/version/profile context API. **Полное workspace binding BLOCKED; version/profile Unknown.** Графовые relationships, counts и выводы primary source graph не использованы как независимое доказательство. MCP configuration не менялась; fallback — `rg` и прямое чтение исходников.

Прямые значения текущего задания уточняют старое требование HEAD из specification: HEAD проверялся против SYNTHESIS_INPUT_SHA, а не REPORTS_SHA. Это явная передача координатора, не самостоятельно выбранный audit target. Текущий scope разрешает только этот report; AGENTS.md не меняется, поскольку workflow/security rules не изменяются и такой файл вне allowlist.

## 2. CODE_AUDIT_SHA / REPORTS_SHA

Обозначения общих metadata для всех ledger/registry proposals/assurances:

- **C** — CODE_AUDIT_SHA / Last verified code commit: `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`.
- **R** — REPORTS_SHA: `bac836bb06b536e9805fa382ab3272f4d49adec1`; переданный short ref `bac836b` разрешён локально в этот commit.
- **S** — SYNTHESIS_INPUT_SHA / checked worktree HEAD: `a756c5a4d721638b786c50903c2857fb6fd1e632`.
- **E** — environment из §1, source-only Windows review, 2026-09-07, reviewer Codex Synthesis / Red-Team.
- **H** — SHA256 immutable [master checklist](../../inputs/YUNI-MASTER-AUDIT-CHECKLIST.md): `44FD1F11FA3953AF03E51C8EFD6233996F1C51C58193ABC106BB252BEBF51B6E`, самостоятельно вычислен Get-FileHash и сопоставлен с mapping. Это не Git SHA.

| Source pass | Report provenance | Заявленный code/environment scope, сверенный reviewer |
| --- | --- | --- |
| **A** — [01-ARCHITECTURE-SPAGHETTI.md](01-ARCHITECTURE-SPAGHETTI.md) | R; ARCH-001–004, §6; assurance §7 | C, `D:\Yuni-audit-architecture`, Windows/Node24, анализ 2026-09-06, QA 07; static only |
| **T** — [02-TEST-RELIABILITY.md](02-TEST-RELIABILITY.md) | R; TEST-001–004; Assurance/Best-practice sections | C, `D:\Yuni-audit-testing`, 2026-09-06; inventory/assertion review, исполнения нет |
| **Q** — [03-SECURITY-DATA-INTEGRITY.md](03-SECURITY-DATA-INTEGRITY.md) | R; SEC-001–004, §7; assurance §9 | C, `D:\Yuni-audit-security`, 2026-09-06–07; static only |
| Synthesis specification | S, единственный changed path после R | `docs/audits/yuni-2026-09/prompts/wave-1/04-SYNTHESIS-RED-TEAM.md` |

Все source paths/строки ниже относятся к **C**: они повторно прочитаны в S и тождественность code подтверждена полным diff C..S. Reports существуют в R, поэтому их авторство/evidence history не приписываются C. S содержит именно версию specification, применённую здесь. Содержимое соседних worktrees не читалось; сведения об их корнях взяты из Git inventory и самих reports.

Исторический [baseline](../../02-BASELINE.md) проверял `80de2c161f58e821d28bf2eb1d0a6ff7fd6329aa`. Его результаты 220 backend / 60 frontend tests не являются исполнением на C или в E. PROJECT_STATE, ROADMAP и Task 042 со старым описанием skipped race сопоставлены с текущим source; действующий e2e case присутствует без skip. Исторические документы не отменяют код и не повышают confidence голосованием.

## 3. Review methodology

Прочитаны AGENTS.md → CLAUDE.md → PROJECT_STATE → ROADMAP → specification; затем AI_REVIEW_PROTOCOL, QUALITY_GATES, charter, baseline, Wave 1 plan, mapping, оба registry templates, все три primary reports и master sections **0–124**. Примеры runtime/SQL/mutation команд из master — предмет анализа, не разрешение исполнить их. Дополнительно прочитаны module-boundaries, security/API/data-exposure rules и Task 024/042/047. Primary reports использованы как список утверждений; verdicts получены повторным source trace, анализом counterexamples и assertions.

Метод отбора: все 12 IDs без исключений; более глубокое чтение у provisional P1, двух overlaps, disputed P2 и каждого assurance. Для тестов различались routing assertions, identity doubles, реальные наблюдаемые state и декларации без runtime proof. Для race восстановлены обе последовательности операций, SQL constraints и доступ после unblock. Никаких новых findings из одного отсутствия теста или технологии.

Команды чтения воспроизводимы без исполнения приложения: `rg --files <scope> -g <patterns>`, `rg -n [-A/-B] <pattern> <paths>`, `Get-Content -LiteralPath <path>` и PowerShell `Read-Lines(path,start,end)`, который вызывает `[IO.File]::ReadAllLines` и печатает numbered slice. Прочитанные paths/symbols/ranges указаны в ledger и таблице ниже. Inline Node использовал только filesystem realpath/metadata; production modules не импортировались. Shell batches не сохранялись в файлы.

| Реально выполненные commands / read batches | Result / exit | Tool wall seconds |
| --- | --- | --- |
| `git rev-parse --show-toplevel`, `--git-common-dir`, HEAD, три commit refs, оба tags; branch; worktree inventory | Все отдельные exit 0; значения §1–2 | Части tool timings около 0, разрешение таймера ненадёжно; не performance evidence |
| Initial `git status -sb`, porcelain all | Каждый exit 0; clean | 0.002 / около 0 |
| `git diff --name-only C..R`, `R..S`, `C..S` с полными SHA | Каждый exit 0; 3 / 1 / 4 разрешённых paths | 0.039 / 0.096 / 0.088 |
| Get-Date/Get-TimeZone/Get-Item/Resolve-Path/Test-Path output | Batch 0; metadata и отсутствие output; неполный tabular root output дополнен JSON/realpath | 0.237; follow-up individual timing Unknown |
| OS/PS/Node/dependency/shim metadata, realpath auth; CodeGraph symbol search и локальная сверка | Read-only; binding не доказан, версия pnpm не запускалась; неверный первоначальный auth path исправлен | Individual timings Unknown; CodeGraph reported query_time_ms 0 |
| Primary reports A / T / Q целиком | 0 / 0 / 0; все 12 IDs и дополнительные candidates | 0.216 / 0.212 / 0.230 |
| Master full / PROJECT_STATE+ROADMAP / protocol+charter+register / baseline+plan / mapping | Все batches 0; длинный output дочитан slices из памяти | 0.397 / 0.163 / 0.271 / 0.260 / 0.242 |
| Inventory + QUALITY_GATES/module-boundaries | 0; policy и safe source navigation | 0.244 |
| Media service/storage/controller/access helper + serializer source | 0; commit/cleanup/ownership/projection | 0.242 |
| AuthContext/AuthApi/tests + Messages selected control flow | 0; unconditional continuations, actual observed tests | 0.237 |
| Chat start/send/read selects, moderation/pair-lock/controller batches | 0 / 0; tx ownership, live-block filters | 0.273 / 0.269 |
| Auth service/controller/guard/decorator + security/API policy | 0; logout locator vs verifier | 0.269 |
| Matches/likes/notifications + Task 024/042/047 | 0; writer protocols и источник permanent-close | 0.273 |
| Schema/migrations и focused SQL + e2e slices | 0 / 0; constraints и schedule assertions | 0.288 / 0.266 |
| Media/storage negative specs / auth+likes+chat test harnesses / distinct tx counterexamples | 0 / 0 / 0; прочитано, не исполнено | 0.258 / 0.241 / 0.256 |
| Root/auth layouts, forms/AppNav, notifications create, FE test inventory | 0; provider lifetime и rendering gates | 0.265 |
| `rg -n -A 17 -B 2 'private async assertActiveUser' apps/backend/src`; caller search | 0; 10 identical predicates и actor call sites | 0.336 |
| Serializer/export/caller navigation с ошибочным `profile.serializer.spec.ts` | Batch 0, но ReadAllLines ERROR missing path; не PASS чтения | 0.334 |
| Backend test/bootstrap inventory с ошибочными `ci.yml`/`jest-e2e.json` | Batch exit 1, missing paths; исправлено через `rg --files` | 0.159 |
| Corrected `user-profile.serializer.spec.ts`, Profiles/export/renderer; actual config inventory | 0 / 0; source перечитан по существующим paths | 0.256 / 0.091 |
| Registry templates + specification mandatory clauses повторно | 0 | 0.263 |
| Actual main/Jest environment/quality-gates, data-exposure, remaining two SQL migrations, Messages selector | 0; bootstrap writes identified without launch | 0.332 |
| Contract parser/modules/selected tests/charter, ошибочный `input/*` lookup | Batch 1 из-за неверного singular path; master ранее прочитан из `inputs/`, содержимое восстановлено из уже прочитанного полного input | 0.282 |
| Full ChatApi, export serializer exact symbol, Likes forwarding assertions, AppModule Chat wiring | 0; уточнены boundaries и callers | 0.235 |
| Specification §§140–193 + Messages send/input reread | 0 | 0.298 |

Длительности взяты из tool metadata и не используются для выводов о приложении. Per-subcommand duration внутри compound reads **Unknown**; exit 0 batch не скрывает внутреннюю ошибку или `rg` no-match. Ошибки navigation не были source findings и не затронули frozen-target gate. Truncated tool displays дочитаны из сохранённых в памяти outputs/точных slices; сырой audit draft/log на диск не создавался.

Source depth: MediaService/storage/AuthContext/AuthApi/access-control/serializer и ключевые controllers полностью; ChatService — selects, start, send, read/writable predicates и необходимые game/notification continuations; ModerationService полностью; Matches/ Likes — relevant mutation/list/eligibility paths; Auth — register/refresh/logout/token helpers, guard; Users — export selectors/mapping, actor helper; все десять actor helpers с callers. Test inventory охватывает backend unit/e2e и все восемь frontend test files; полное чтение каждого unrelated unit case не заявляется. SQL: применимые определения baseline и все последующие миграции проверены на guards для обсуждаемого race; это не полный database audit.

**Не исполнено:** unit/e2e/mutation/fault-injection, build/lint/typecheck/Prisma generate/validate/migrate, HTTP/browser/security probes, SQL/DB connection, filesystem upload/delete, install/Corepack bootstrap, remote CI inspection. Dependency absence и запрет побочных записей блокируют executable validation. E2e environment source выполняет migrate deploy и принимает environment URL; суффикс `_test`/`_ci` не подтверждает disposable isolation. Секреты, `.env`, реальные пользовательские данные, cookies, фотографии и dumps не открывались. Внешние источники и CodeGraph relationships для claims не использованы.

## 4. Candidate-by-candidate verdict

Original status всех IDs — Proposed. Confidence в таблице относится к суженному reviewed claim; вероятность/частота реального инцидента остаётся Unknown без измерений. Ровно один verdict на ID. Поля canonical/related/lifecycle используются в §13 и не изменяют регистр автоматически.

| ID | Original severity / confidence | Reviewed severity / confidence | Verdict | Proposed lifecycle | Canonical / related |
| --- | --- | --- | --- | --- | --- |
| ARCH-001 | P2 / High | P2 / High | **Confirmed** | Confirmed | canonical ARCH-001; SEC-002, TEST-001 |
| ARCH-002 | P2 / High | P2 / High (source) | **Confirmed** | Confirmed | canonical ARCH-002; SEC-004, TEST-003, TEST-002 |
| ARCH-003 | P2 / High | P2 / High (source) | **Confirmed** | Confirmed | canonical ARCH-003; TEST-003 — смежная FE coverage, другой invariant |
| ARCH-004 | P2 / High | P3 / High (duplication) | **Confirmed with changed severity** | Confirmed | canonical ARCH-004; actor/target policy question §11 |
| TEST-001 | P2 / High | P2 / High | **Confirmed** | Confirmed | canonical TEST-001; ARCH-001/SEC-002, SEC-003 |
| TEST-002 | P2 / High | P2 / High (inventory) | **Confirmed** | Confirmed | canonical TEST-002; SEC-001, ARCH-002/SEC-004 |
| TEST-003 | P2 / High | P2 / High | **Confirmed** | Confirmed | canonical TEST-003; ARCH-002/SEC-004, ARCH-003 |
| TEST-004 | P2 / Medium | P2 / High (assertion structure) | **Confirmed** | Confirmed | canonical TEST-004; SEC-003, другой race |
| SEC-001 | P2 / High; likelihood Unknown | P2 / High (conditional revoke) | **Confirmed** | Confirmed | canonical SEC-001; TEST-002, ARCH-002/SEC-004 |
| SEC-002 | P2 / High | P2 / High | **Merge with another finding** | Rejected, merged alias | → ARCH-001; TEST-001 |
| SEC-003 | P1 provisional / Medium outcome, High source | P1 **provisional**, не confirmed / Medium outcome | **Blocked pending runtime validation** | Proposed | canonical SEC-003; TEST-004, TEST-001 |
| SEC-004 | P2 / High source, Medium e2e | P2 / High source; e2e Unknown | **Merge with another finding** | Rejected, merged alias | → ARCH-002; TEST-002/003, SEC-001 |

### ARCH-001 — commit boundary и upload cleanup

**Invariant:** отказ построения ответа после успешной записи photo не должен компенсировать уже закоммиченный upload удалением его единственного файла. Ожидание вытекает из photo row/publicUrl lifecycle и media integrity; Task 047 описывает смежную границу delete, но не исправляет upload.

**Primary evidence:** `apps/backend/src/modules/media/media.service.ts:62–129`, `uploadProfilePhoto`: save на 78–82; tx на 85–116 создаёт row; после await tx выполняется `getSelfProfileView` на 119; catch 122–128 удаляет storage для любой ошибки в try. `getSelfProfileView:311–324` делает отдельный root Prisma read и может бросить (query rejection, assertFound, последующая обработка). `LocalProfilePhotoStorageService.saveProfilePhoto:21–37` пишет файл до tx; delete:39–58 не удаляет DB row. Причина **Confirmed**: область compensation шире незафиксированной операции.

**Reachability / limits:** при успешных save+commit, отклонённом post-commit read и успешном cleanup останется row, указывающая на отсутствующий файл; клиент получает error и возможен повтор upload. Это вывод из control flow с явно заданными failure prerequisites, не наблюдённая потеря данных и не гарантированный массовый инцидент. Частота DB/read отказов Unknown, поэтому P1 не присваивается.

**Counterevidence:** media specs:275–331,361–392 проверяют happy path, create failure и cleanup failure, но не post-commit profile-read failure. Delete path:169–228 / Task 047 сначала await storage, затем tx, это другой порядок. Owner checks и filename guard не решают commit boundary. Missing verification — RV-02, реальные DB/disk состояния и retry; related SEC-002 сохранён alias.

### ARCH-002 — устаревшее async завершение меняет session

**Invariant:** завершившийся logout очищает memory session (API README:36); старый request не должен перезаписывать новую пользовательскую session intent. Полный порядок concurrent login/register/logout и server access revoke — отдельное owner decision.

**Primary evidence:** `apps/frontend/lib/auth-context.tsx:47–90,104–178`: applySession и clearSession без generation guard; refreshPromiseRef дедуплицирует лишь refresh между собой. Success:73–74 применяет старую session, catch:76–84 очищает текущую; logout:134–140 ждёт API и очищает state, не инвалидируя pending refresh. Login/register:118–132 также безусловны. Root `app/layout.tsx:62–64` сохраняет provider между route groups; AppNav:51,79–81 вызывает logout, unread request:54–59 использует authenticatedRequest, способный вызвать refresh.

**Reachable narrowed scenarios:** refresh начат авторизованным запросом; logout завершился; отложенный success снова заполняет memory session. Либо после logout выполнен новый login, затем rejection старого refresh очищает новую identity. `authenticatedRequest:142–178` использует возвращённую refresh session для retry: будущая защита должна учитывать не только setState, но и waiter/retry identity. Server cookie/network sequencing и browser timing не воспроизведены.

**Counterevidence и исправление primary narrative:** первый bootstrap начинается при useAuth consumer, не при одном mount AuthProvider. `app/(auth)/layout.tsx:32–71` скрывает форму при isLoading/isAuthenticated; поэтому отсутствие authLoading check в SignInForm **само по себе не доказывает** login во время первого bootstrap. Этот пример A не принят как самостоятельное доказательство. Контрпример не защищает provider-level logout/refresh continuations. Четыре `auth-context.test.ts:33–92` проверяют bootstrap calls/loading, а не identity/logout; auth-api request mocks не устанавливают ordering. P2 подтверждён для state defect; cross-account leak и мгновенный server revoke не заявлены. RV-03.

### ARCH-003 — late send загрязняет видимый conversation state

**Evidence:** `apps/frontend/app/(app)/messages/page.tsx:236–275` захватывает activeId и text до await. POST идёт именно с этим ID (`lib/chat-api.ts:93–106`); continuation:252 добавляет message в общий текущий messages, :270 безусловно очищает общий input. Conversation selector:379–385 не disabled при isSending; textarea:794–809 тоже доступна, disabled только send button:812. Renderer:652–655 отображает весь messages без фильтра conversationId.

**Schedule:** send A pending → выбрать B → GET B завершился → написать новый draft → старый success A append в B и очищает draft. Серверный адресат остаётся A; metadata preview update:255–261 также сравнивает захваченный A, а не B. Это дефект локального представления/потери draft, **не отправка сообщения B и не доказанная утечка между пользователями**. GET effect:178–209 имеет active cleanup — blanket утверждение о всех async paths отвергнуто. Частота/browser occurrence Unknown; source-причина Confirmed, P2 для пользовательского chat flow. RV-04 проверяет success/reject, смену диалога и сохранение draft.

### ARCH-004 — десять копий actor eligibility, без текущего policy drift

`private async assertActiveUser` повторно прочитан во всех десяти `apps/backend/src/modules/*/*.service.ts`: users:368–380; settings:123–135; profiles:131–143; matches:371–383; likes:186–198; chat:839–851; discovery:124–136; moderation:370–382; media:290–302; notifications:348–360. Все запрашивают status/deletedAt root Prisma и при absent/non-active/deleted бросают одинаковый 401. Caller search связывает их с currentUser.id read/write endpoints; это не dead copies. Изменение общего actor predicate потребует проверки до десяти мест.

**Counterevidence:** расхождения сегодня нет. JwtAccessGuard:28–40 проверяет JWT и строит actor, не заменяет domain eligibility. Moderation `assertActiveTargetUser:384–396` даёт 404; Likes target access и Chat active-other дают другую policy; notification recipient:280–329 может молча подавить событие с tx client и settings check. Нельзя объединить actor/target/recipient в один универсальный guard или по факту похожего status поля.

**Severity P2 → P3:** подтверждён локальный cleanup/change-radius risk, но не доказаны уже случившийся drift, обход прав, частые изменения predicate или значительная стоимость. Число копий не обосновывает серьёзность само по себе. Причина duplication Confirmed; будущий policy drift Inferred. Минимальная альтернатива — оставить локальные helpers и проверить их контракт при изменении policy; общий узкий helper только после анализа callers/tx semantics. Runtime не требуется для факта дублирования; новая security policy и behavior-preserving extraction не проверялись.

### TEST-001 — tx alias скрывает неверное направление write

**Категория: weakness test suite.** Auth registration harness `auth.service.spec.ts:580–584` и assertion:220–232; Likes harness:446–463 и forwarding assertion:125–132; Chat harness:1057–1062 и notification assertion:570–578 передают в tx callback тот же prisma object. Поэтому assertion на prisma не отличает intended tx от root escape в этих caller boundaries; transaction-called/order checks не моделируют DB commit/rollback. Predicted surviving substitution — логическое свойство doubles, **mutation не исполнялась**.

Production counterevidence: Auth register:88–118 передаёт tx в issueTokens; Likes:127–169 — в Matches; Matches:191–211,221–278 — в Notifications; Chat:646–711 — в createNotificationForMessage; Notifications:296–345 использует input.client. Доказанного production write-outside-tx в этих paths нет. Distinct doubles существуют: Moderation spec:156–237 с root-negative assertions:227–229; Notifications:167–198; Matches external client:227–272. Более того, Auth refresh case:402–417 использует отдельный tx — blanket claim обо всём auth suite тоже отклонён.

P2 для слабой защиты нескольких критичных transaction caller contracts; runtime rollback, failure-after-first-write и CAS loser остаются Unknown. Уточнять routing существующими distinct spies, а DB rollback проверять отдельно (RV-05); не объединять с ARCH-001 (там post-commit boundary) или SEC-003 (там concurrent prechecks).

### TEST-002 — auth integration coverage не проверяет cookie lifecycle

**Категория: weakness test suite; не auth bypass.** Инвентарь backend unit/e2e не содержит отдельного auth controller/guard suite; шесть e2e используют register и bearer, а auth service tests вызывают service напрямую. В `main.ts:37–56` есть cookieParser, CORS credentials, pipes/filter; `match-block-chat.e2e-spec.ts:86–100` и остальные beforeAll повторяют Nest/pipes/filter без cookieParser. Поиск по всем test/spec files не обнаружил HTTP login→refresh→logout cookie jar/Set-Cookie assertions. Auth tests expired/revoked refresh на :453–485 не являются bearer-negative guard проверками.

**Сужение:** абсолютное «нет ни одного отрицательного auth HTTP теста» неверно: `user-data-export.e2e-spec.ts:183–187` проверяет unauthenticated export. Missing bearer/tampered/expired/wrong-key и cookie lifecycle как целостный auth boundary не покрыты соответствующими интеграционными cases; current service negatives полезны, но этот пробел не закрывают. `quality-gates.yml:52–59` действительно содержит e2e запуск; его удалённый результат не проверялся.

P2 для production/auth bootstrap drift и непроверенного transport contract, confidence High в ограниченном inventory. Policy issuer/audience/instant revoke не выдумана и не превращена в обязательные failing tests. RV-06: отдельная disposable среда, production-equivalent bootstrap и реальные synthetic cookie/guard controls.

### TEST-003 — bootstrap tests не наблюдают session/retry/logout

**Категория: weakness test suite.** Полностью перечитаны `apps/frontend/lib/auth-context.test.ts` и `auth-api.test.ts`; поиск imports/useAuth/authenticatedRequest по всем восьми test files не выявил дополнительных наблюдений этих transitions. Context tests:33–92 проверяют отсутствие refresh без consumer, один refresh с consumer, settle loading и single bootstrap с несколькими consumers. Наблюдений user/accessToken/isAuthenticated после success/logout/смены identity и single 401 retry нет.

AuthApi tests проверяют request options/body/error shapes и bearer field (:74–81), но это mocked fetch, не credentials/browser или AuthProvider retry. `auth-api.ts:88–94` сейчас выставляет Authorization и `credentials: include`; отсутствие соответствующего assertion не доказывает неправильное production значение. Positive/negative bootstrap controls сохраняют ценность Task 079. P2 подтверждён для узкого пропуска regression protection рядом с ARCH-002; независимые speculative gaps не названы отдельными defects. RV-03/06; использовать существующий React hook renderer, без общего component framework.

### TEST-004 — race assertion требует оба fulfilled при legal block-first

**Категория: weakness test suite.** `match-block-chat.e2e-spec.ts:188–209` создаёт исходящий like A, запускает reciprocal like B и block A через Promise.allSettled (:195–204), без barrier, затем безусловно требует fulfilled для обоих (:206–207) и no active match (:208). Порядок fetch expressions не фиксирует серверные prechecks/commits. `requestJson:441–455` бросает при любом non-OK response.

**Independent legal schedule:** block успевает commit до LikesService `assertNoBlockBetween:119–122`; like получает предусмотренный ForbiddenException до tx. Block успешен, activeMatchCount остаётся 0, но fulfilled assertion ложно отвергает этот корректный запрет. Обратный schedule допускает successful like (в том числе без match при tx block recheck) и последующий block закрывает match. Locks в Likes:128 / Moderation:81 и Matches block recheck:310 не гарантируют оба fulfilled.

Confirmed относится к **статически обусловленному false-failure oracle**, не к наблюдённой flake rate; прежний Medium по runtime не преобразован в измерение. Reviewed confidence High для структуры assertions, реальная частота Unknown. P2: gate может неверно отклонять допустимый исход ключевого block invariant. Не разрешать catch-all errors: RV-07 должен фиксировать exact allowed status для заданного ordering и сохранять DB invariant. Этот тест не создаёт conversation конкурентно с block и не подтверждает/опровергает SEC-003.

### SEC-001 — logout revokes locator без secret proof

**Invariant / policy:** security README:13 определяет locator как lookup, secret как доказательство владения refresh session. `AuthService.logout:199–217` вызывает parser:498–513, затем updateMany по parsed.refreshTokenId/revokedAt; rawToken не проверяет. Parser требует разделитель после непустого locator, но допускает пустой suffix. `verifyRefreshCookie:464–496` для refresh проверяет DB state и argon2 secret, но logout его не вызывает. `AuthController:80–93` не имеет access guard для logout; route rate limit ограничивает частоту, не заменяет ownership.

**Conditional consequence:** при знании чужого активного locator запрос с неверным/пустым secret может отозвать его refresh row; последующее обновление session не удастся. Это targeted availability/owner-proof defect, не получение access/refresh, не account takeover. Источник знания locator атакующим **не найден** в проверенных boundaries: cookie строится `auth.service.ts:448–450`, JSON controller возвращает user/access; `users.service.ts:87–95,274–277` и `user-data-export.serializer.ts:221–232` исключают ID/token из sessions export. Секреты/реальные cookies не читались. Не предполагаются UUID guessing, логовая утечка или масштаб атаки.

Logout tests:487–525 используют корректный cookie и repeated-success fixture, wrong secret не проверяют. Причина Confirmed source, likelihood Unknown, P2 сохраняется без повышения. Missing: RV-08, включая wrong/empty secret, valid/repeated logout, expired/revoked states и отсутствие внешнего enumeration signal. Семантика family/global revoke — owner decision, не основание этого дефекта.

### SEC-002 — merged в ARCH-001

Повторно проверены upload tx/read/catch и storage adapter/specs, приведённые в ARCH-001. Одна причина: compensation после успешного DB commit; одна remediation boundary. Security/data-integrity consequence (committed photo URL без файла) сохранено в canonical. Primary domain/owner — backend Media lifecycle, поскольку исправление находится в orchestration upload, а не в auth policy или общем storage adapter. Proposed alias status Rejected **только из-за merge**, не false positive. Test/delete assurances не опровергают upload scenario.

### SEC-003 — startConversation versus block: source facts и runtime gap

**Policy:** Task 024:28–35,49 и API chat/block contract задают закрытие существующего chat и отсутствие автоматического reopen после unblock. Они не требуют отмены любой in-flight операции во всей системе. Степень распространения permanent-close на concurrent creation должна быть явно подтверждена owner; source не подменяет policy.

**Entry / source facts (Confirmed):** `AppModule:47` включает ChatModule; `chat.module.ts:10–12` подключает MatchConversationsController. Guarded `POST /matches/:matchId/conversation` (`match-conversations.controller.ts:7–18`) передаёт trusted currentUser и parsed UUID. `ChatService.startConversationFromMatch:748–837`: actor active:752; root match read:754; member:761; root live-block check:766; existing conversation shortcut:768; active/unexpired match:779; active other user:783. Лишь потом tx:788–813 создаёт active Conversation и двух participants. Нет повторного match/block read или pair lock в tx.

| Writer / reads | Synchronization и client на C | Ограничение |
| --- | --- | --- |
| `apps/backend/src/common/prisma/user-pair-lock.ts:11–18,38–49` | Canonical lexical unordered pair; hash key → `pg_advisory_xact_lock`; transaction-scoped при tx client | Не DB CHECK; другой writer обязан участвовать. Тип допускает root client; сам helper не обеспечивает tx caller |
| Moderation block:62–133 | Actor/target prechecks root; tx:76, lock:81, directional Block read/create и endMatchesAndConversations с tx | Closing update затрагивает только существующие rows; duplicate-error fallback:118–131 использует root и отдельный end, не универсальный serialized writer |
| Moderation end:307–368 / unblock:135–152 | Active unexpired matches → blocked; existing active conversations пары → closed; unblock root deleteMany исходящего Block | Не закрывает будущий insert, unblock не reopen; другой направленный Block может оставаться |
| Likes create:88–182 | Block precheck root:119; tx:127, pair lock:128; writes и Matches call с tx:169 | Block-first может дать legal 403 до lock; provided-tx contract важен |
| Matches:180–278,300–356 | Standalone tx берёт lock:222 и проверяет block с tx:225–228; provided client:191–211 не открывает/не лочит tx, helper rechecks block:310 | Проверенный Likes caller уже держит lock; нельзя обобщать на будущие callers |
| Chat start:748–837 | Checks root, затем nested create в отдельном tx без общего pair protocol | Prechecked match может измениться до insert; default/deployed isolation Unknown |

**SQL counterexample search:** schema Match:229–250, Conversation:252–275, Participant:277–292, Block:363–377. Baseline migration:157–219,355–379,418–448: Conversation.match_id unique и FK лишь на существующий Match.id; nullable match, ON DELETE SET NULL; participants/FKs ограничивают membership, Block unique directional. Follow-up matches migration:14–30 добавляет canonical pair CHECK/active interval exclusion, удаляет старый permanent unordered unique. Likes exclusion относится к like interval. Staged-chat CHECKs ограничивают stage/voice, system-message CHECK — message shape; notifications/profile-completion migrations не добавляют cross-table block/start guard. Trigger/function/isolation поиск плюс прямое чтение применимых SQL не выявили защиты «active conversation не может ссылаться на blocked match». Наличие FK/unique не опровергает обсуждаемое состояние. Факт применения migrations к конкретной DB **Unknown**; PrismaService не задаёт transaction isolation override.

| Timeline | Block / Match / Conversation после шагов | Вывод |
| --- | --- | --- |
| Block commit → start prechecks | Block есть, Match blocked, C отсутствует/closed; start видит block и отказывает | Контрпример против «любой start обходит block» |
| Start checks+insert commit → block | C active уже существует; block update закрывает C и блокирует M | После unblock C остаётся closed; штатное поведение защищено |
| **Inferred window:** start прочитал active/unexpired M, no Block/no C → задержка до tx → block lock/create/update/commit → start tx insert | Block есть; M blocked; closing update не видел ещё не существовавшую C; сохранённый M.id допускает новую active C по inspected constraints | Условный source-derived race; сам missing lock недостаточен для P1 confirmation |
| Затем removal последнего live Block | M остаётся blocked, raced C остаётся active | Read/send ориентируются на C и текущие Block, не на M.status; возможен доступ после unblock, runtime не доказан |

**Read/send boundaries:** Chat list:323–368 и `unblockedConversationWhere:1229–1261` скрывают pair с live Block. Read:1176–1197 требует active C, membership и отсутствие block; send:601–715 использует writable:868–889, active other и block:633–636 до tx. Пока live Block существует, **новый** read закрыт (404), send запрещён (403); немедленный arbitrary IDOR не заявляется. При raced active C после последнего unblock эти gates больше не отвергают blocked M; send создаёт text message:665 и notification через tx:700–706. Notification suppression сама по себе не abort message. Уже closed C не переоткрывается: status gates остаются, existing-conversation shortcut/duplicate fallback может вернуть её summary, но не меняет status. Chat при естественно expired match разрешён существующими tests:686–700; blanket проверка «M обязан всегда active» во всех read/send может нарушить этот контракт.

**Tests / unknown:** unit:627–773 проверяют nonmember, active, existing-expired, blocked precheck, expired/no C, inactive other, P2002 fallback; mock rows не моделируют две конкурирующие транзакции. E2e:127–182 создаёт C **до** block и проверяет closed/hidden после unblock; :188–209 — like-vs-block, не start. Нет barrier между start precheck и create. Не проверены реальная PostgreSQL isolation/snapshots/locks, deployed constraints, errors при interleaving, browser/contact journey и frequency. Schedule с insert после block commit сокращает зависимость от пересекающихся FK locks, но всё ещё является inference, не исполнением. **Verdict Blocked pending runtime validation; P1 остаётся provisional**, RV-01 решает фактическую достижимость и impact. Root cause: unsynchronized boundary Confirmed; harmful persisted outcome Inferred.

### SEC-004 — merged в ARCH-002

Повторно проверены refresh success/reject, root lifetime, logout finally, AuthLayout gate и current tests. Совпадает причина устаревшего async completion, а не только файл. Canonical ARCH-002 сохраняет late success после logout, stale rejection после новой session и waiter/retry identity; owner — frontend session state orchestration. SEC-001 остаётся отдельным server-side owner-proof дефектом. Alias Rejected по merge; P2/High source не превращён в browser reproduction или server instant-revoke policy.

## 5. Overlaps and merges

| Пара / связь | Решение и сохранённые последствия | Primary owner |
| --- | --- | --- |
| ARCH-001 ↔ SEC-002 | Одна root cause, **одна canonical ARCH-001**, alias SEC-002; DB/disk divergence, invalid committed URL, ambiguous error/retry сохранены | Backend Media lifecycle; security reviewer оценивает последствия |
| ARCH-002 ↔ SEC-004 | Одна root cause, **одна canonical ARCH-002**, alias SEC-004; stale success/reject, logout/new identity, request retry сохранены | Frontend AuthProvider/session lifecycle; backend owner отдельно определяет revoke policy |
| TEST-001 ↔ tx candidates | Отдельная weakness regression protection; upload compensation происходит после commit, а start/block имеет другой synchronization gap | Test boundary owners + соответствующий backend owner |
| TEST-002/003 ↔ auth candidates | Backend transport/guard coverage и frontend state observation разные invariants; не merge друг с другом или с production bugs | Backend auth integration / frontend hook tests |
| TEST-004 ↔ SEC-003 | Like-vs-block oracle и start-vs-block race не один дефект; тест не evidence start safety | Testing + moderation/chat consistency |
| ARCH-003 ↔ ARCH-002/TEST-003 | Общая категория async state, но разные state owners, UX и acceptance criteria; отдельные records | Chat frontend / auth frontend |

Всего 12 IDs → 10 самостоятельных записей; новые CROSS IDs не создаются. Domain/owner выбраны по месту причины и remediation boundary, не по prefix, количеству reports или severity автора. Координатор сохраняет ссылки на оба source passes для каждой merged пары.

## 6. Severity changes

- **ARCH-004: P2 → P3**, High confidence именно в десяти текущих одинаковых helper bodies. Не доказан значимый policy drift/security impact; небольшое локальное улучшение соответствует charter P3. Наблюдаемая duplication сохранена.
- Остальные reviewed P2 сохранены в уточнённых границах ledger. TEST-004 Medium → High относится к source assertion structure; runtime flakiness/frequency остаётся Unknown. ARCH-002 удаляет недостаточно обоснованный first-bootstrap/form пример, сохраняя подтверждённую async boundary.
- **SEC-003: original P1 provisional → reviewed P1 provisional, не confirmed**. Нельзя механически downgrade до P2 только из-за отсутствия runtime и нельзя подтвердить P1 по одному missing lock. Достаточность serious impact зависит от RV-01/owner interpretation permanent-close.
- Proposed P0 нет; independently confirmed P0/P1 **нет**. Это не означает их отсутствие во всём приложении.

## 7. Rejected findings

Опровергнутых целиком findings из 12 **нет**. Proposed registry Rejected: SEC-002 и SEC-004 — только merged aliases с сохранением истории. Missing runtime evidence SEC-003 не обозначается false positive.

Сохранены и проверены использованные counter-hypotheses: notification writes сейчас получают tx (Matches/Chat/Notifications, §4); «все tx mocks одинаковы» опровергается distinct examples, включая auth refresh; «нет e2e» — шестью suites и CI config; «Messages вообще не защищает async» — GET cleanup; «single-flight решает logout race» — безусловными continuations. `required-fields.contract.test.ts:18,23–33,39–67` содержит count=8 guard и set equality: empty parser result не silently pass; это test text dependency, не production import backend. ModerationModule:6–10 не импортирует Matches/Notifications, поэтому заявленный Nest cycle через него не установлен. Source size, FK cycle и отсутствие static importer сами по себе не findings.

Security counterevidence: refresh opaque secret с verifier, conditional revoke/count=1 в tx, а не refresh JWT; sequential reuse test не доказывает concurrent logout/rotation. Media генерирует filename из UUID/MIME, baseline partial unique primary index существует (:319), owner checks и projection ограничены §9. Unblock не reopen closed C. Эти observations не дают blanket assurance crypto, DB, CSRF или media privacy. «SameSite=None автоматически CSRF» не принят; наличие CORS origin callback тоже не превращено в полный browser/CSRF PASS.

Другие primary hotspots сохранены **без promotion и без independent confirmation**, поскольку не определяют ledger: TTL expected-value арифметика, combined env-validation fixture, wall-clock rate-limit tests, cleanup при частичном e2e setup, game-race exactly-once depth, source graph dead-code/optional-presence выводы. Их runtime/полный source recheck остаётся дальнейшей работой; никаких deletions или инфраструктурных требований из них не следует.

## 8. Blocked findings

**SEC-003 — единственный finding с Blocked pending runtime validation.** Решающее неизвестное: допускает ли фактически применённая PostgreSQL схема/изоляция детерминированную последовательность precheck → block commit → active C insert, а затем read/send после последнего unblock. Нужен RV-01 в disposable DB с synthetic участниками, явными barriers и обеими контрольными последовательностями. Текущий no-lock source fact недостаточен для доказательства P1 инцидента. Proposed lifecycle сохраняется; owner interpretation concurrency policy указана в §11.

Остальные findings Confirmed только в source/suite границах; связанные runtime validation не исполнены, но не нужны для доказательства именно этих узких claims. CodeGraph/pnpm/dependencies являются tooling limitations, не новыми product findings.

## 9. Confirmed assurance candidates

Подтверждение ниже означает **статически проверенный ограниченный invariant на C в E**, а не выполненный mock/HTTP/DB/filesystem test. Negative checks выполнены reviewer как branch/control-flow trace; существующие assertions только прочитаны. Предлагаемый register status — Confirmed для этих суженных формулировок. Reviewer/date/full SHA/H даны в §1–2 и наследуются каждой записью; ASR IDs не назначаются.

### REST media owner check precedes mutations — A §7 + owner-часть Q §9

**Original:** A «Assurance candidate — REST media owner check precedes mutations»; Q «Candidate — Media owner and filename boundary», только owner-компонент. **Reviewed claim:** в `MediaService.setProfilePhotoPrimary` / `deleteProfilePhoto` при отсутствующей прочитанной photo либо несовпадающем owner управление не достигает DB mutation/storage delete. Preconditions: trusted currentUser.id, обычный возвращённый resource, вызов именно этих методов; источник invariant — AGENTS dating owner checks и `common/security/access-control.ts:34–49`.

**Evidence / actual static result:** `media.service.ts:136–144,177–200`: actor gate → find → assertFound → assertOwner → первая mutation. Missing fixture идёт в 404 throw, foreign owner в 403 throw, matched owner проходит дальше; throw не перехватывается для продолжения. `media.controller.ts:22,46–61` получает CurrentUser и UUID parameter. Specs:394–413,456–475 содержат expected rejects и no DB mutation/no storage calls — полезные discriminating assertions, исполнения здесь нет.

**Boundaries:** не проверены достоверность JWT в runtime, TOCTOU смены owner/actor status, обход другого endpoint, malformed DB row, HTTP exception mapping, реальная FS/DB, storage URL privacy, concurrency. Это не assurance upload/MediaModule целиком и не опровержение ARCH-001. Checklist A 2/92/98 + Q 35/37/73. Reverify при изменении controller/guard/decorator/helper/owner model/ordering/schema; минимум повторить branch trace и разрешённые owner negatives, при integration claim — RV-09.

### Rejected storage delete prevents subsequent DB photo deletion — T Assurance section

**Original:** «Candidate, ASR-ID pending — rejected storage delete prevents subsequent DB photo deletion». **Reviewed claim:** в последовательном control flow `deleteProfilePhoto` rejected promise от awaited `storage.deleteProfilePhoto` не позволяет вызвать последующий `$transaction`/photo delete. Preconditions: owner checks пройдены, storage действительно rejects, речь об этой invocation. Это сужение до source order, не «файл физически существует после отказа».

**Evidence / negatives:** `media.service.ts:185–203`: единственный await storage:200 до tx:202, catch между ними отсутствует. При synthetic rejected dependency управление выходит с той же ошибкой; при resolved dependency идёт tx/delete/promotion. Spec:527–551 моделирует отказ, проверяет исходную ошибку и отсутствие DB deletion; **не содержит отдельного assertion на отсутствие `$transaction`**, более сильное утверждение подтверждено исходным порядком, не приписано тесту. Success spec:477–525 проверяет storage-before-row порядок.

**Boundaries:** mock не моделирует частично выполнившийся unlink с последующим reject, rollback, file permission/symlink semantics, DB error после успешного unlink, concurrent operations/retries/cache. Task 047 намеренно обсуждает другой failure tradeoff; эта assurance не делает DB/disk lifecycle атомарным. Checklist 93/95/117. Related ARCH-001/SEC-002 — соседняя стадия, TEST-001 — limits tx mocks. Reverify при перестановке await/catch/transaction, смене adapter/DB policy; static trace + RV-02/09 для расширения claims.

### Explicit profile/photo response projection — Q §9

**Original/retained bounded claim:** проверенные `toPublicProfile`, `toPublicProfilePhotos`, `toSelfProfilePhoto` строят explicit allowlists, не передают raw source object; public photos требуют truthy publicUrl, publishedAt и approved; private profile всегда получает пустой photos. Policy: `docs/security/data-exposure-rules.md:5–27,115–133`; self moderation fields специально разрешены.

**Evidence / negatives:** `common/serializers/user-profile.serializer.ts:131–154,193–223`: false URL / unpublished / non-approved отсеиваются conjunctive filter; private branch:152 возвращает []; output literal не включает storageKey/tokenHash/local path. `user-profile.serializer.spec.ts:13–91,167–176` проверяет exact public/self photo shapes, private/partial private и смесь photos. Fixture не инжектирует произвольные forbidden source keys — силу этих assertions не преувеличиваем; media upload fixture/assertion:275–331 дополнительно содержит synthetic storage field и отсутствие storageKey в response. `ProfilesService.getByHandle:98–119` вызывает access/block checks и этот projection; Media upload:120 — self photo projection. Существующий `toCompactPublicProfile:156–169` делегирует public projection, но весь набор его callers здесь не сертифицирован.

**Boundaries:** scalar values из allowlist не автоматически очищены от произвольного sensitive текста; не заявлено отсутствие всей PII (public gender/lookingFor остаются), полное покрытие всех API/export/notifications/discovery callers или exception logging. Не проверены browser/API serialization, corrupted runtime inputs/types, direct static photo GET, revocation/cache, owner/target lifecycle races. Checklist 36/37/73. Reverify при новых fields/spreads/serializer callers/privacy schema/config/type/dependency/policy; повторить filters/projection trace и exact-shape tests с meaningful canaries в разрешённой среде (RV-09).

### Media filename boundary — filename-часть Q §9

**Original:** второй компонент «Candidate — Media owner and filename boundary». **Reviewed claim:** save формирует storage filename из нового UUID + MIME extension; original name не входит в adapter input. Delete перед unlink пропускает лишь ключ с ожидаемым prefix, basename, matching lower-case UUID/extension regex и lexical resolved-path containment. Invalid key возвращает управление **без unlink**, а не обязательно throws.

**Evidence / negatives:** `media/storage/local-profile-photo-storage.service.ts:16–37,39–58,61–100`: unsupported MIME throws до mkdir/write; missing/invalid path return до unlink; ENOENT suppressed, прочие errors rethrow. Spec:29–61 positive save/unsupported MIME; :63–104 valid delete/ENOENT/EACCES; :106–123 wrong prefix/traversal/nested/unsupported extension/non-UUID/absolute path — no-unlink assertions. Path library и fs/UUID mocked; это чтение structure, не выполненный filesystem negative.

**Boundaries:** regex — naming convention, не доказательство UUID unpredictability. Lexical containment не realpath/symlink/junction/case/filesystem assurance. Не проверены hostile OS/filesystem, concurrent rename, actual separators/platform behavior, content decoding/magic bytes completeness, malware, public URL access/cache. Checklist 35/37/73. Related ARCH-001/SEC-002: filename ограничение не решает compensation. Reverify при adapter/constants/path/MIME dependency/platform/policy изменениях; static acceptance predicate и отдельные RV-09 filesystem checks по согласованному scope.

## 10. Rejected assurance candidates / remaining candidates

Целиком опровергнутых исходных assurance candidates **нет**. Traceability всех четырёх originals:

| Original source + title | Review disposition | Register proposal |
| --- | --- | --- |
| A §7 — REST media owner check precedes mutations | **Confirmed**, source-only invariant §9; совпадает с owner-частью Q | Одна owner record |
| T — rejected storage delete prevents subsequent DB photo deletion | **Confirmed** после явного сужения до control flow §9 | Отдельная storage-rejection sequencing record |
| Q §9 — Explicit profile/photo response projection | **Confirmed**, только перечисленные functions/branches §9 | Отдельная projection record |
| Q §9 — Media owner and filename boundary | **Confirmed** только как два отдельно ограниченных source invariants; composite не переносить одной широкой записью | Owner объединяется с A; filename отдельная record |

Таким образом четыре originals дают четыре bounded records после **явного merge owner и split composite**; новый ASR-ID не выделялся. Это не молчаливое объединение разных guarantees.

**Remaining / blocked:** runtime расширения всех четырёх claims (JWT/HTTP owner, actual disk/DB failure atomicity, browser/static URL privacy, symlink/platform security) остаются **Candidate**, assessment BLOCKED/not executed; для них metadata конкретного runtime environment Pending. Не создавать отдельные положительные записи без evidence. Broad interpretations «Media безопасен», «нет утечек вообще», «unlink/DB atomic», «path traversal невозможен при любых FS условиях» отклонены как необоснованное расширение, а не как доказанное опровержение узких originals.

Optional technologies: bounded presence scans A/Q и conditional dispositions T имеют различный охват. Здесь не выполнена независимая многоканальная проверка всей инфраструктуры, поэтому **WSS/Redis/queues/AI/payments/admin/external storage и подобные непроверенные области остаются Conditional**, не новые N/A и не assurance отсутствия. Historical green baseline также не assurance.

## 11. Owner Decision Required

Решения адресованы Валере (product/privacy intent) и Жене (технический контракт/validation scope); роли предлагаются для маршрутизации, а не объявляются принятыми. Аудит не ожидал ответов, поскольку допустимый static review завершён независимо. Никакой риск ещё не Accepted/Deferred.

| Решение | Кому | Зависимые выводы / последствия вариантов |
| --- | --- | --- |
| Распространяется ли permanent close при block на concurrent ещё не созданную conversation; какой результат start допустим после committed block | Валера + Женя | SEC-003/RV-01: запрет active C после block закрепляет acceptance для общего ordering; допущение нового chat после unblock требует явного отдельного product contract и переоценки impact, не снимая source race автоматически |
| Session intent precedence для refresh/login/register/logout; отдельно single-session/family/global logout и lifetime access после logout | Валера + Женя | ARCH-002/SEC-004/TEST-002/003: browser state ordering не равно server denylist. Выбор immediate revoke расширит backend scope, TTL-based policy — другие expected negatives; текущий source defect late refresh остаётся |
| Contract direct media links после private/block/reject/delete, включая cache horizon; смысл успешного upload при ошибке построения ответа | Валера + Женя | ARCH-001/RV-02 и future media privacy pass. `main.ts:28–36` static serving и API projection — разные boundaries. Не делать вывод о нарушении direct-link privacy без решения; не маскировать post-commit compensation |
| Target inactive/deleted profile visibility и in-flight account/block policy | Валера; техническая матрица Жени | Profiles lookup, actor/target distinction ARCH-004, дальнейший BE/security pass. Нельзя заменить все target/recipient проверки actor helper; absence account-delete workflow не устанавливает privacy intent |
| Изолированная synthetic validation среда, разрешённые mutations/fixtures, версии PostgreSQL/dependencies и evidence retention | Женя; подтверждение scope Валерой | Все RV; отдельная задача до install/migrate/HTTP/barrier/fault injection. Ни переданный backlog, ни имя DB `_test` не дают разрешения |
| Issuer/audience/allowed algorithms, environment key separation/rotation и grace policy до production | Женя + Валера для session UX | TEST-002/key-policy follow-up; без этого не сочинять test expectations. Реальные keys не читались; одинаковые keys/crypto bypass не утверждаются |

Приоритет remediation и принятие риска по подтверждённым findings — отдельные решения владельцев. Отсутствие решения не превращает Known source evidence в PASS. ID allocation ARCH/TEST/SEC уже задано primary reports; повторное согласование диапазонов здесь не требуется.

## 12. Runtime-validation backlog — планы, не execution evidence

**Общий safety gate для каждого RV:** отдельный явный scope/acceptance от owner/reviewer; dependency-equipped disposable copy на зафиксированном C либо отдельно указанном remediation SHA; synthetic users/messages/photos, собственные тестовые ключи; проверенные абсолютные DB/storage targets, исключён доступ к реальным данным. Миграции, seeds, cleanup, fault/barrier instrumentation и тестовые файлы — только в той новой среде и по её разрешению. Не использовать текущий worktree для экспериментов. Сохранять версии/применённые migrations/изоляцию, exact commands/exits, содержательные assertions и безопасные результаты без tokens/PII. Здесь **все RV not run**; общие prerequisites не заменяют конкретные ниже.

| План / related | Missing evidence и synthetic scenario | Expected outcomes / negative controls |
| --- | --- | --- |
| **RV-01 — SEC-003**, related TEST-004/001; первый приоритет | Disposable PostgreSQL, verified migration state/isolation и разрешённый barrier после всех start prechecks до tx insert. Два active synthetic members, unexpired match, no C/no Block. Start paused → block commit → resume start; записать DB Block/Match/C states и exact API outcomes; затем убрать последний Block и проверить read/text-send обоими участниками. Повторить block-before-start и start-commit-before-block | Проверка гипотезы должна явно показать, возникает ли active C/blocked M. При существующем live Block новые read/send запрещены; после unblock уже closed C остаётся закрыт. Контроли: foreign member denied, expired match/no C denied, existing-expired conversation не сломана, opposite-direction Block всё ещё запрещает, duplicate start не создаёт вторую C. Если race outcome не возникает, объяснить конкретный SQL/runtime barrier; одного прогона без enforced ordering мало |
| **RV-02 — ARCH-001/SEC-002**, storage sequencing assurances | Сначала isolated unit fixture: successful storage+tx, reject последующего profile read; отдельно disposable actual DB/storage fixture с синтетическим bitmap и согласованным failpoint только после commit. Проверить и row, и файл до/после; retry после ambiguous response исследовать отдельно | Current predicted result — committed row остаётся при cleanup файла. Acceptance remediation — post-commit response failure не удаляет committed asset. Controls: tx create rejection чистит uncommitted upload; cleanup rejection сохраняет исходный error; happy upload возвращает row/file; delete storage rejection не удаляет row. Не объявлять DB/filesystem atomicity из одного mock |
| **RV-03 — ARCH-002/SEC-004/TEST-003** | Существующий hook renderer с deferred promises, наблюдением user/token/isAuthenticated и outgoing request headers. Pending refresh → completed logout → late success; old refresh reject после новой identity; overlaps register/login; waiter authenticatedRequest после session смены. Отдельный synthetic browser pass для actual cookie delivery | Latest согласованный intent сохраняется; старый response/rejection не меняет новую session, старый waiter не отправляет запрос с недопустимой identity. Positive controls: one bootstrap у consumer, none without consumer, multi-consumer dedupe, normal refresh/login/logout, single 401 retry; не бесконечный retry, остальные errors не swallow. Первичный bootstrap не моделировать формой, которую AuthLayout реально скрывает |
| **RV-04 — ARCH-003** | Deferred send A; выбрать B и завершить GET B; отредактировать draft B; resolve/reject A, также same-conversation edit во время send. Existing pure/request state tests; browser/component additions только после отдельного решения по AGENTS | POST destination A не меняется; B renderer/draft не получают A side effect; A preview обновляется адресно. Controls: обычный send в активном A, GET cleanup на смене, late rejection не ошибочно помечает B, send guard не ломается. Network ordering детерминирован promises, не sleeps |
| **RV-05 — TEST-001**, related tx assurances / SEC-003 | Раздельные root/tx spies в register/like/chat caller tests; negative routing assertions. Отдельно DB failure после первого из связанных writes (register/token, like/match/notification, message/notification), verified transaction isolation и cleanup scope; CAS loser concurrency отдельно | Unit должен различать переданный tx и root; existing distinct cases — positive comparison. DB rows/notifications отсутствуют после согласованного rollback failure; successful control сохраняет всю ожидаемую группу. Предполагаемый surviving mutant проверять только при новом mutation разрешении; routing-pass не доказательство DB rollback |
| **RV-06 — TEST-002/003**, related SEC-001 | Production-equivalent Nest bootstrap с cookie middleware; disposable DB и synthetic cookie jar. HTTP register/login → refresh rotation → old refresh reuse → logout → refresh; positive protected route; missing/tampered/expired/wrong-signature bearer | Exact status/body и cookie options/transport соответствуют contract; missing cookie/wrong secret/reused refresh denied, valid protected bearer accepted. JS fetch options и реальное browser credentials поведение различаются; issuer/audience/access-after-logout cases только после §11 policy. Не заменять negative matrix одним no-auth export |
| **RV-07 — TEST-004** | Separate deterministic fixtures: (a) block committed before reciprocal-like precheck; (b) like precheck до block, порядок tx фиксирован; сохранить final DB query; exact structured HTTP status вместо generic catch-all | (a) block success, like expected 403, no active match; (b) только outcomes, доказанные заданным ordering, и no active match после block. 409/500/timeouts не считать допустимыми по одному rejected. Оба fulfilled не universal oracle. Flake rate измерять отдельно, не выводить из static trace |
| **RV-08 — SEC-001** | Synthetic refresh row/locator известен только из тестовой fixture. Wrong/empty suffix, valid cookie, expired/revoked/missing locator, repeated logout; endpoint rate-limiter untouched | Проверить, меняется ли row при incorrect secret (предсказание C: да для известного active locator). Acceptance: неправильное доказательство владения не отзывает чужую session; valid logout отзывает нужную по согласованной policy; generic public response без enumeration. Никакого угадывания UUID, bruteforce или поиска реальных locator |
| **RV-09 — assurances §9** | Раздельные owner HTTP fixtures A/B + missing ID; projection canaries с meaningful forbidden fields и partial private/photo states; temp FS adapter на согласованной платформе с безопасными filenames и разрешёнными error cases | Foreign/missing owner не достигает mutation; output только допустимые keys/approved published photos; invalid lexical key не вызывает unlink; supported save и valid delete positive controls. Symlink/junction/hostile FS и direct URL privacy требуют отдельного explicit scope, не следуют из обычного unit разрешения |

Проверки не обязаны запускаться все сразу: сначала RV-01 для unresolved serious consequence, затем RV-02/03 и их guards; RV-05–08 закрывают targeted regression weaknesses. Remediation change и runtime validation должны получить новый checked SHA; результаты C нельзя автоматически переносить.

## 13. Proposed central findings

Это подготовленные proposals по [03-FINDINGS.md](../../03-FINDINGS.md), **только в этом output**. Короткая строка каждого ID — §4 ledger; подробные поля ниже дополняют её ссылкой на evidence вместо копирования всего analysis. A/T/Q означают конкретные report links/checked code/report commits из §2, а не имена agents.

Общие обязательные поля каждой записи: **Checklist source SHA = H; Last verified commit = C (полный SHA §2); Verification environment/date/reviewer = E; Applicability = Applicable now**. Current behavior / protected invariant, Evidence с affected file lines/symbols, Risk and impact / likelihood и actual verification — соответствующий ID §4. Verification реально выполнена как source trace/inventory; Reproduction runtime not run, Tests required — соответствующие RV §12. Accepted-risk owner/date — N/A, риска никто не принимал. Dependencies — owner scope, разрешённая validation среда и относящиеся к записи policy decisions §11. Reverification trigger — любой change перечисленных source/tests, relevant schema/config/dependencies либо protected policy; повторить source trace и применимые RV на новом full SHA. Ни одна запись не имеет fix commit.

Для 9 canonical Confirmed assessment **FAIL в указанной static/suite boundary**, а не failed executable test. Для SEC-003 assessment **BLOCKED** (source synchronization observation checked, harmful outcome pending). Для aliases assessment **FAIL у underlying canonical issue**, lifecycle Rejected только merge. Severity/confidence/status/related/source-history сохраняются из ledger. Review history каждой записи: primary A/T/Q на C, Proposed → решение независимого reviewer Codex 2026-09-07 на C/R/S, основание §4; Accepted/Verified transitions отсутствуют.

### ARCH-001 — Post-commit upload error удаляет committed asset

- Domain: Backend / Media orchestration (ID Architecture сохраняется); Source pass A + Q; Severity P2, High, Confirmed. Related SEC-002 (alias), TEST-001. Best-practice candidate: нет отдельного. Checklist 2/92/98/104 + 19/20/35/36. Remediation horizon: now, предложено владельцам.
- Affected files/symbols: `apps/backend/src/modules/media/media.service.ts` — uploadProfilePhoto/getSelfProfileView; `apps/backend/src/modules/media/storage/local-profile-photo-storage.service.ts` — save/delete; соответствующие media/storage specs. Root cause **Confirmed**, широкий catch после commit (§4).
- Minimal fix: отделить compensation до успешного commit от post-commit response read. Target fix: тот же boundary с явно определённым response/retry contract; отдельную state machine/reconciliation вводить лишь при согласованном lifecycle scope.
- Alternatives: перенос response read внутрь tx не делает FS transactional; catch-and-ignore response error без contract маскирует проблему; удаление DB row в catch после commit создаёт новую destructive compensation и требует отдельного решения.
- Tests required: RV-02; Acceptance: committed photo/file сохраняются при post-commit read failure, precommit failure очищает только uncommitted upload, original error и обычный happy path предсказуемы, ownership/projection не регрессируют.
- Documentation impact: remediation task evidence + media lifecycle/error contract; Task 047 не переписывать как будто уже покрывает upload. Review history: A/Q Proposed → canonical Confirmed; SEC-002 merge причина и сохранённый data-integrity impact в §4–5.

### ARCH-002 — Stale auth completion нарушает memory-session ordering

- Domain: Frontend / auth state orchestration; Source A + Q; P2, High source, Confirmed. Related SEC-004 alias, TEST-002/003, SEC-001 (другой owner boundary). Best-practice: Observe async hook state (Candidate, §15). Checklist 2/92/98/104 + 62/63/65/70. Horizon now.
- Affected files/symbols: `apps/frontend/lib/auth-context.tsx` — refreshSession/applySession/clearSession/register/login/logout/authenticatedRequest; root/AuthLayout/AppNav callers и auth tests из §4. Root cause **Confirmed** unconditional stale continuations; e2e cookie ordering Unknown.
- Minimal fix: согласованный session generation/intent guard на async results и invalidation при смене intent; waiter/retry обязан учитывать ту же identity. Target fix: та же локальная модель с необходимыми deferred tests; новый глобальный store не обоснован.
- Alternatives: только refresh single-flight уже есть и недостаточен; AbortController сам по себе не отменяет уже обработанный server request/все continuations; один logout route redirect не уничтожает root provider.
- Tests required: RV-03 и transport part RV-06; Acceptance: late success/reject не перезаписывает разрешённый latest intent, old waiter не использует чужую/устаревшую identity, bootstrap/dedupe/single-retry остаются корректны. Server access instant revoke не добавляется этим acceptance.
- Documentation impact: task/API memory-session ordering после owner decision; backend revoke policy отдельно. History: A/Q Proposed → canonical Confirmed, first-bootstrap/form пример сужен контрпримером AuthLayout, SEC-004 merged.

### ARCH-003 — Late send меняет messages/draft другого выбранного chat

- Domain: Frontend / chat state; Source A; P2, High source, Confirmed. Related TEST-003 — смежный подход к async tests, не общий defect. Best-practice отдельного нет. Checklist 2/92/98/104. Horizon now.
- Affected files/symbols: `apps/frontend/app/(app)/messages/page.tsx` — sendMessage, conversation selector, shared messages/input, renderer; `apps/frontend/lib/chat-api.ts` — sendMessage. Root cause **Confirmed**: response не привязан к текущему conversation/draft version.
- Minimal fix: привязать continuation к captured conversation и revision draft, адресно обновлять preview; Target: та же проверенная state ownership модель либо per-conversation state при дополнительной необходимости.
- Alternatives: блокировать навигацию/textarea на всё время send — UX tradeoff для owner, не обязательный redesign; GET active cleanup не покрывает mutation response. Backend destination менять не требуется.
- Tests required: RV-04; Acceptance: late A success/reject не загрязняет B messages/error/draft, новый draft не исчезает, normal A send и preview работают, API destination остаётся captured A.
- Documentation impact: task note и chat draft/navigation acceptance; visual QA только если remediation меняет layout/interactive state по CLAUDE/AGENTS. History: A Proposed → Confirmed с явным исключением wrong-recipient/cross-user leak claim.

### ARCH-004 — Actor eligibility copies требуют согласованного сопровождения

- Domain: Backend maintainability; Source A; **P3**, High source, Confirmed. Related owner/target policy §11; Best-practice отдельного нет. Checklist 2/92/98/104. Horizon now при согласованном cleanup, не срочное security исправление.
- Affected: десять `.service.ts`/assertActiveUser с точными ranges §4. Root cause **Confirmed** duplication; drift impact **Inferred**, сегодня divergence не найден.
- Minimal fix: выбрать узкий actor-only helper либо документированный coordinated-change contract с targeted checks; Target: Minimal, без переноса target/recipient policy и без одного универсального auth guard.
- Alternatives: оставить локальные helpers допустимо до реального policy change, если owner принимает maintenance cost; abstract base service/дополнительная dependency не оправданы одним count=10.
- Tests required: если extraction согласован — actor missing/inactive/deleted/active по затронутым consumers, различия 401 actor/404 target/recipient suppression и tx client не меняются. Acceptance: поведение сохранено и место изменения actor predicate однозначно; документированная альтернатива не объявляется устранённым duplication без owner решения.
- Documentation impact: task evidence/module-boundaries только если реально меняется shared contract; AGENTS/ADR не менять автоматически. History: A Proposed P2 → Confirmed P3, причина снижения §6; текущего auth bypass не заявлено.

### TEST-001 — Transaction tests не различают root/tx на selected caller boundaries

- Domain Testing; Source T; P2, High, Confirmed; Related ARCH-001/SEC-002, SEC-003. Best-practice Separate transaction doubles (Candidate). Checklist 93/95/117-Database. Horizon now.
- Affected: `apps/backend/src/modules/auth/auth.service.spec.ts`, `likes/likes.service.spec.ts`, `chat/chat.service.spec.ts` — registration/like/send harnesses и forwarding assertions; production/сильные counterexamples §4. Root cause **Confirmed** identity alias, не production tx escape.
- Minimal fix: distinct required tx methods/root-negative spies в этих boundaries; Target: Minimal + отдельно согласованные real DB rollback checks для multi-write flows.
- Alternatives: только calledTimes/order assertions не различают clients; копирование entire Prisma mock в каждом тесте повышает стоимость и может снова разделять вложенные mocks. Полный transactional in-memory emulator не нужен.
- Tests required RV-05; Acceptance: намеренно выбранный неверный client обнаруживается независимым routing assertion в отдельной разрешённой проверке, normal propagation проходит; mocks не объявляются proof durability.
- Documentation impact: task test evidence; shared test guideline только после принятия candidate. History T Proposed → Confirmed, exceptions Moderation/Notifications/Matches/Auth-refresh сохранены.

### TEST-002 — Auth cookie/guard contract не закреплён integration journey

- Domain Testing / backend auth integration; Source T; P2, High inventory, Confirmed. Related SEC-001, ARCH-002/SEC-004; Best-practice Reuse production-equivalent auth setup (Candidate). Checklist 62/70/95/117-Auth. Horizon before production.
- Affected: `apps/backend/test/*.e2e-spec.ts` bootstrap, `apps/backend/src/main.ts`, auth controller/guard/service specs, Jest e2e environment. Root cause **Confirmed** missing transport coverage + duplicated middleware setup, не доказанный bypass.
- Minimal fix: targeted cookie lifecycle/negative bearer integration fixtures с production-equivalent middleware; Target Minimal с общим setup лишь если поддерживает явные разные test lifecycle нужды.
- Alternatives: service-only tests не проверяют cookies/guard; browser-only suite дороже и не заменяет deterministic server assertions; current unauthenticated export negative сохранить.
- Tests required RV-06; Acceptance: actual cookie transport и expected bearer negatives наблюдаемы, valid control работает, tests запускаются только на доказанно isolated DB/storage. Policy-dependent claims откладываются до §11.
- Documentation impact: task/API expected auth outcomes; obsolete test-absence docs исправлять отдельно, не в этом audit. History T Proposed → Confirmed со сужением blanket negative-auth absence.

### TEST-003 — Hook tests не наблюдают session transitions/retry

- Domain Testing / frontend auth; Source T; P2, High, Confirmed. Related ARCH-002/SEC-004, TEST-002, ARCH-003. Best-practice Observe async hook state (Candidate). Checklist 93/95/117-Auth. Horizon now.
- Affected: `apps/frontend/lib/auth-context.test.ts`, `auth-api.test.ts`; соответствующие context/API symbols §4. Root cause **Confirmed** observable coverage gap; существующие bootstrap positives/negatives полезны.
- Minimal/Target fix: расширить существующий hook harness явным observation состояния и outgoing request identity, controlled promises для transitions/retry. Новая dependency не обоснована.
- Alternatives: snapshots/call counts не показывают session outcome; test, копирующий реализацию generation, не независимый oracle; широкий component/browser framework требует отдельного решения.
- Tests required RV-03/06; Acceptance: success/reject/logout/new identity и single retry имеют наблюдаемые правильные states/options при принятом contract, Task 079 bootstrap controls сохранены.
- Documentation impact: task evidence, auth ordering contract; AGENTS testing rule не менять. History T Proposed → Confirmed; source production bug остаётся отдельным ARCH-002.

### TEST-004 — Block/like e2e oracle отвергает legal forbidden response

- Domain Testing / concurrency oracle; Source T; P2, High source structure, Confirmed; runtime frequency Unknown. Related SEC-003, TEST-001; Best-practice Specify race preconditions (Candidate). Checklist 93/95/117. Horizon now.
- Affected: `apps/backend/test/match-block-chat.e2e-spec.ts` — concurrent case/requestJson/activeMatchCount; Likes/Moderation/Matches paths §4. Root cause **Confirmed** unspecified order + unconditional fulfilled; runtime flakiness Inferred/not measured.
- Minimal fix: определить допустимые outcomes для каждого явно заданного schedule с exact statuses; Target: deterministic barriers двух orders + сохранённый DB invariant.
- Alternatives: catch-all rejected/удалить assertions/повторы до зелёного скрывают ошибки; sleeps не устанавливают correctness. Только счётчик requests не доказывает interleaving.
- Tests required RV-07; Acceptance: legal block-first 403 корректно обработан, unexpected status/error не принят, final active match отсутствует; никакого заявления start/block coverage без отдельного RV-01.
- Documentation impact: race test task/evidence; measured flake claim только после реального run. History T Proposed → Confirmed узкого oracle defect, original Medium и runtime uncertainty сохранены.

### SEC-001 — Logout использует locator как право на revoke

- Domain Security / backend auth owner proof; Source Q; P2, High source, Confirmed, likelihood Unknown. Related TEST-002, ARCH-002/SEC-004; Best-practice отдельного нет. Checklist 37/58/62/63/64/73. Horizon now.
- Affected: `apps/backend/src/modules/auth/auth.service.ts` — logout/parseRefreshCookie/verifyRefreshCookie; controller logout и auth spec; exports проверены как counterevidence §4. Root cause **Confirmed** rawToken proof skipped.
- Minimal fix: перед изменением чужой refresh row проверять proof в рамках принятой logout semantics, сохраняя generic/idempotent внешнее поведение; Target: тот же owner boundary, rotation/family/logout контракт после отдельного решения.
- Alternatives: access guard как единственный путь может помешать logout при expired access; rate limit/UUID opacity не заменяют secret proof; blindly reuse refresh verifier требует учесть expired/revoked/repeated logout ответы.
- Tests required RV-08/06; Acceptance: wrong/empty secret не меняет active row известного synthetic locator, valid proof отзывает надлежащую session, repeated/expired/missing не создают enumeration; не внедрять unapproved global logout.
- Documentation impact: auth owner proof/logout contract и task evidence, risk assumptions Unknown явно сохранены. History Q Proposed → Confirmed conditional defect без предположения locator leak и severity escalation.

### SEC-003 — Concurrent conversation creation может пережить block closing

- Domain Security / moderation-chat consistency; Source Q; **P1 provisional**, Medium harmful outcome / High synchronization facts; **Proposed**, assessment BLOCKED. Related TEST-004/001, Task 024/042. Best-practice отдельного нет. Checklist 19/20/37/73; 121–124 relevant follow-up, не полнота их прохождения. Horizon now для validation/owner decision.
- Affected: `apps/backend/src/modules/chat/chat.service.ts` start/read/send; match-conversations controller; moderation.service.ts block/end/unblock; common/prisma/user-pair-lock.ts; likes/matches writers; schema/migrations/tests §4. Root cause unsynchronized prechecks **Confirmed**, adverse persisted state **Inferred**.
- Minimal candidate fix **после** RV-01/policy: общий pair serialization boundary для start и block с повторной проверкой block/match внутри tx. Target: consistent documented writer protocol с проверкой duplicate fallback и существующих expired chats; DB safeguards лишь если применимы и согласованы.
- Alternatives: только проверить block ещё раз вне tx оставляет окно; глобальный `match.status=active` во всех reads/send ломает existing-expired contract; единственный successful race run и blanket lock recommendation не acceptance.
- Tests required RV-01 + independent review на fix SHA; Acceptance определяется permanent-close policy: block commit не оставляет новую доступную C через этот race, controls из RV-01 сохраняются, чужое membership denied и active Block скрывает доступ. Пока runtime result отсутствует, проблему не переводить Confirmed/Rejected автоматически.
- Documentation impact: task spec с timelines/SQL environment и concurrency contract; future consistency pass 121–124, не изменение audit registers здесь. History Q Proposed provisional P1 → synthesis Proposed/Blocked, source facts подтверждены, decisive runtime отсутствует.

### SEC-002 / SEC-004 — preserved alias records

| Поле | SEC-002 | SEC-004 |
| --- | --- | --- |
| Title / Domain | Upload cleanup удаляет committed file / Security-data integrity; canonical Media owner | Late refresh восстанавливает session / Security-session lifecycle; canonical FE owner |
| Source / Severity / Confidence / Status | Q + A; P2 / High / Rejected (merged) | Q + A; P2 / High source / Rejected (merged) |
| Canonical / related | ARCH-001; TEST-001 | ARCH-002; TEST-002/003, SEC-001 |
| Checklist / horizon | 19/20/35/36; now как canonical | 62/63/65/70; now как canonical |
| Affected files/symbols / Current behavior / Evidence / risk / reproduction | ARCH-001 §4 и canonical proposal выше; C/E/H shared metadata | ARCH-002 §4 и canonical proposal выше; C/E/H shared metadata |
| Root cause / solution / alternatives / tests / acceptance / docs | Confirmed; наследовать ARCH-001, RV-02, отдельного исправления нет | Confirmed; наследовать ARCH-002, RV-03/06, отдельного исправления нет |
| Best-practice | Нет отдельного | Observe async hook state, только Candidate |
| Review history | Q Proposed → Rejected merged 2026-09-07, root cause совпала с ARCH-001; не false positive | Q Proposed → Rejected merged 2026-09-07, root cause совпала с ARCH-002; не false positive |

Предлагаемые counters при переносе всех 12 IDs: Total 12; Confirmed 9; Proposed 1; Rejected 2 (aliases); Accepted/In Progress/Implemented/Verified/Deferred 0. Reviewed severity по сохранённым IDs: P0 0, P1 1 **provisional**, P2 10 (включая aliases), P3 1. Для самостоятельных issues: 8 P2 + 1 P3 Confirmed и 1 provisional P1 Proposed. Это proposal counts, не текущие значения центрального register.

## 14. Proposed assurance records

По [06-ASSURANCE-REGISTER.md](../../06-ASSURANCE-REGISTER.md), ID для каждой записи **Pending coordinator allocation**. Общие обязательные metadata: full Commit SHA **C**, Checklist source SHA256 **H**, Environment/Verified date/Reviewer **E**, status **Confirmed только для source claim**, evidence command/exit/result §3; runtime execution not run. Scope/Claim/preconditions, Evidence, actual static negative traces, coverage boundaries и precise reverification перечислены отдельно для каждого invariant в §9. Так template заполнен через явные ссылки, без повторения evidence целиком.

| Scope / invariant (не ASR ID) | Checklist refs | Related findings | Evidence / negatives / boundaries / trigger |
| --- | --- | --- | --- |
| Media owner-before-mutations | 2/92/98 + 35/37/73 | ARCH-001/SEC-002 — другая стадия; TEST-001 | §9 «REST media owner check precedes mutations»; missing/foreign source throws, owner positive; recheck controller/actor/owner/ordering changes |
| Rejected storage-delete stops subsequent DB transaction in this invocation | 93/95/117 | ARCH-001/SEC-002, TEST-001 | §9 «Rejected storage delete…»; rejected/resolved branch trace, actual FS/DB failure atomicity excluded; recheck await/catch/adapter/tx changes |
| Explicit selected profile/photo projection | 36/37/73 | ARCH-001/SEC-002 — lifecycle отдельно | §9 «Explicit profile/photo…»; private/partial private, URL/published/approved branches; all API/PII/direct URLs excluded; recheck fields/callers/privacy/types |
| Lexical storage filename acceptance before unlink | 35/37/73 | ARCH-001/SEC-002 | §9 «Media filename boundary»; invalid-key return, MIME error, positive path; OS/symlink/runtime excluded; recheck adapter/path/platform policy |

Review history по записи 1: A Candidate + owner component Q Candidate на C → independently Confirmed narrow source invariant 2026-09-07; overlap сохранён. Запись 2: T Candidate → Confirmed с explicit source-order narrowing, original runtime extension остаётся Candidate. Запись 3: Q Candidate → Confirmed только перечисленного projection; no blanket response safety. Запись 4: filename component Q Candidate → отдельный Confirmed lexical record; composite разбит явно. Полные source pass links/provenance — §2, original titles — §10.

Reverification минимально включает повтор source evidence/negative trace на новом full SHA и оценку всех изменённых предпосылок. Если меняется code/schema/config/dependency/policy, прежний Confirmed не переносить: Expired либо Invalidated по характеру изменения; подтвердить снова только после review. History Expired/Invalidated отсутствует, поскольку новые proposals ещё не внесены. Runtime-expanded versions — Candidate/BLOCKED по §10, не второй набор якобы Confirmed records.

## 15. Best-practice candidates

Все **четыре** original candidates из T «Best-practice candidates» сохранены. A/Q прямо не предлагали отдельных best-practice records; их remediation alternatives не превращены в новые Accepted rules. Никакая рекомендация ниже не принята как обязательный стандарт, не внедрена и не обосновывает новую dependency.

| Original candidate / статус | Yuni problem / applicability | Minimal / target approach | Alternatives / cost / ограничения |
| --- | --- | --- | --- |
| **Separate transaction doubles — Candidate** | TEST-001, applicable now к register/like/chat forwarding; distinct examples уже есть | Разделить только реально нужные tx methods и root-negative assertions; target дополнить разрешённым DB rollback validation | Сохранить alias дешевле, но не различает routing; полный Prisma simulator дорог и тоже не DB. Небольшая fixture maintenance, риск shared nested spy; не доказывает rollback. Recheck при смене tx contract |
| **Reuse production-equivalent auth setup — Candidate** | TEST-002, duplicated beforeAll пропускает cookie middleware | Минимальный integration bootstrap с нужными production middleware; shared setup только для реально общего lifecycle, plus targeted cookie journey | Controller/service mocks дешевле, но не transport; browser-only дороже и менее deterministic. Средняя стоимость isolated DB/cookie setup; production bootstrap нельзя импортировать с auto-listen побочными effects. Policy §11 обязательна для dependent expectations |
| **Observe async hook state — Candidate** | TEST-003 и ARCH-002/SEC-004, применимо в existing jsdom hook suite | Controlled promises + user/token/auth state/request identity; target тот же локальный harness | Call counts/snapshots недостаточны; большая component framework не нужна. Небольшая/средняя стоимость timing fixture; не копировать implementation algorithm и не объявлять mocked network browser proof. Recheck при provider/state changes |
| **Specify race preconditions — Candidate** | TEST-004; метод релевантен RV-01 SEC-003, но это другой сценарий | Явные barriers/операционные состояния и exact outcome oracle; target оба orders + persisted invariant | Sleeps/retry-until-pass/catch-all cheaper-looking, но не доказывают order. Более высокая harness стоимость и test instrumentation scope; реальные DB snapshot/lock условия должны быть зафиксированы, measured frequency отдельно |

Обоснование локальное, из source/tests на C, внешние стандарты/ссылки и версии не исследовались. Future acceptance requires owner/reviewer решение, scope и maintenance tradeoff. Не обновлять AGENTS.md/ADR/skills на основании одной synthesis таблицы.

## 16. Wave 2 recommendations

Приоритет ниже — порядок добывания решающего evidence, а не самовольное принятие remediation. Не перенесена вся master matrix.

| Следующий pass | Приоритет / dependency | Ограниченный вопрос и evidence стартовой точки |
| --- | --- | --- |
| Backend / API / Database | Сначала после owner scope; RV-01 перед выводом о P1 | start/block writer protocol и actual migrations/isolation; SEC-003 §4, user-pair lock, nested C insert, guards после unblock. Затем post-commit media boundary RV-02 и targeted auth owner-proof RV-08 |
| Backend / API / Database | Далее, с TEST-001/002 validation | Разделить root/tx routing и durability; verify CAS loser/rollback; cookie transport и negative bearer; actor/target/recipient distinctions, DTO/serializer boundary. Не объединять все status checks заранее |
| Frontend | Рано, scoped на доказанные async defects | Auth intent/waiter identity RV-03 и chat late-send/draft RV-04. Проверить profile draft/photo response и settings concurrent saves как новые гипотезы, не переносить их как Confirmed из названия hotspot |
| Media/privacy follow-up | Policy §11 до dependent findings | Direct static URL/revocation/cache vs API omission; source main:28–36 и projection §9 не отвечают на этот product contract. Только synthetic assets и отдельное разрешение runtime |
| Validation/CI reliability | После disposable setup | Existing selected suites и затем targeted gaps RV-05–09; учитывать bootstrap migrate side effects. Сверить current actual CI и versions, historical baseline не использовать как current PASS |

**Отдельный Consistency / Idempotency pass, sections 121–124:**

- **121 Consistency:** первым восстановить DB/FS/request состояния для start/block и upload commit/response failure; затем multi-write notification rollback, media primary/count concurrency, export snapshot consistency. Source показывает связи, actual isolation/atomicity не доказаны. Не требовать Redis/queues/external stores без presence evidence.
- **122 Idempotency:** проверить ambiguous response/retry upload, concurrent refresh CAS loser/reuse/logout ordering, duplicate start unique fallback и message retry semantics. Уникальный row/interval exclusion не равен exactly-once response или safe повтору всей операции; желаемый idempotency contract согласовать до теста.
- **123 Combined failure matrix:** использовать small synthetic matrix precheck/commit/response failure × retry × opposing operation для этих подтверждённых boundaries. Включить block/start обе последовательности, upload saved/row committed/read failed, notification failure после parent write. Barriers и exact persisted-state oracle важнее количества комбинаций; real-system experiments здесь не разрешены.
- **124 Definition of Done supplement:** для будущей remediation фиксировать protected invariant, partial-failure/retry negatives, actual DB/storage environment/SHA и independent post-fix verification. Само чтение sections не означает их audit coverage или изменение общего DoD/QUALITY_GATES.

Dependencies: §11 policy, разрешённая isolated среда, отдельные specs и применимые checks; после исправления независимый review по AI_REVIEW_PROTOCOL. Не создавать новый task/PR/commit этим отчётом.

## 17. Blind spots

- Runtime отсутствует полностью: PostgreSQL execution/изоляция/применённые constraints/locks, transaction rollback, disk/cache, browser/network/cookie ordering, реальное contact restoration и его likelihood. Source inference не заменяет эти условия.
- CodeGraph project/version/profile binding не доказан; primary regex graph counts/SCC не воспроизведены и не объявлены independent architecture assurance. Future dead-code/dependency removal требует отдельного reachability proof.
- Проверены все 12 candidates и четыре assurance/four best-practice originals, но не все application branches/DTOs/serializers/callers. Full ChatGame/voice, full profile/discovery/onboarding/settings interactions, complete cascade/deletion lifecycle и target eligibility требуют следующих passes.
- Текущие CI runs/remote branch protection/install/crypto implementation и advisory freshness не проверялись; quality-gates source — intended pipeline. Historical baseline другая среда/SHA; pnpm версия Unknown, dependencies не установлены.
- Secret scanning, actual keys, real data/PII, logs/messages/photos/dumps и production topology не исследованы. Не читались реальные env values. Наличие synthetic fixture в source не означает право использовать реальные данные.
- CSRF/CORS/TLS/edge/proxy, static URL privacy/retention/backups, analytics processors, symlinks/junction filesystem behavior не подтверждены. `credentials: include`, safe keys projection и lexical paths не заменяют runtime security evidence.
- Optional technologies за пределами independently checked scope Conditional; absence finding/N/A/historical green не создают assurance. Нельзя заявлять полный security PASS, отсутствие P0/P1 во всём repo или production readiness.
- Owner policy вопросы §11 открыты; они не были разрешены догадкой. Результаты являются audit proposals; исправления, new tests, Accepted guidelines, central register entries и post-fix Verified отсутствуют.

## 18. Final verification

После формирования полного report повторён инструментальный read-only gate в `2026-09-07T01:22:17.8409945+03:00`; после внесения его результатов выполнен ещё один проход тех же проверок без изменения source. Разрешённый output: `docs/audits/yuni-2026-09/passes/wave-1/04-SYNTHESIS-RED-TEAM.md`.

| Проверка | Actual result / exit | Tool wall seconds первого final gate |
| --- | --- | --- |
| `git rev-parse --show-toplevel`; Node `fs.realpathSync.native` | `D:/Yuni-audit-synthesis` / `D:\Yuni-audit-synthesis`; оба exit 0 | около 0 / 0.674 |
| `git rev-parse HEAD`; synthesis tag commit | Оба `a756c5a4d721638b786c50903c2857fb6fd1e632`; каждый exit 0 | около 0 |
| Audit tag commit | `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`; exit 0 | около 0 |
| `git status --porcelain=v1 --untracked-files=all` | Только `?? docs/audits/yuni-2026-09/passes/wave-1/04-SYNTHESIS-RED-TEAM.md`; exit 0 | около 0 |
| `git diff --name-only`; `git diff --cached --name-only` | Оба пусты; каждый exit 0 | около 0 |
| `git status -sb` | Detached HEAD + единственный untracked output ниже; exit 0 | около 0 |
| `git diff --check` | Нет diagnostics, exit 0; tracked check отдельно от untracked | 0.054 |
| In-memory ReadAllText/ReadAllLines: trailing whitespace, final newline, numbered sections, unique ledger rows | 0 trailing-whitespace lines, newline есть, sections 1–18, ровно 12 разных IDs и 12 допустимых verdicts; exit 0 | 0.261 |

```text
## HEAD (no branch)
?? docs/audits/yuni-2026-09/passes/wave-1/04-SYNTHESIS-RED-TEAM.md
```

Whitespace untracked output проверен напрямую в памяти, поэтому обычный пустой tracked diff не подменяет проверку нового файла. Все 12 finding IDs, обе merge-пары, SEC-003 timeline/blocked reason, четыре исходных assurance candidates и четыре best-practice candidates присутствуют. Самостоятельного PASS всему приложению нет.

По сравнению с исходным clean worktree создан **только этот report**. Production code, tests, primary reports, specification, 03-FINDINGS.md, 06-ASSURANCE-REGISTER.md, configuration и input не изменены. Index пуст относительно HEAD; commit/staging/push/PR/cleanup/worktree removal не выполнялись. Отчёт оставлен координатору для отдельного сохранения/переноса proposals после его решения.
