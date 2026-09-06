# Wave 1 — Security and Data Integrity

## 1. Scope, fingerprint и preflight

Primary read-only pass по `docs/audits/yuni-2026-09/prompts/wave-1/03-SECURITY-DATA-INTEGRITY.md`, skill `.agents/skills/yuni-audit/SKILL.md`. Анализ выполнен в отдельном conversation/worktree; sibling Wave 1 reports и conclusions не читались. Synthesis и independent review не запускались. Здесь нет независимо Confirmed findings: все четыре кандидата имеют lifecycle **Proposed**.

| Параметр | Evidence / результат |
| --- | --- |
| Audit tag | `audit/yuni-2026-09-wave1` |
| EXPECTED_AUDIT_SHA, HEAD, tag commit | `fed276a97fd84f29032c5eac1b11447bb1f3ed4c` — совпадают |
| EXPECTED_WORKTREE_ROOT | `D:\Yuni-audit-security`, явно передан координатором в conversation |
| Canonical root | `D:\Yuni-audit-security`, подтверждён `fs.realpathSync.native`; canonical auth source внутри этого root |
| Git root | `D:/Yuni-audit-security` |
| Branch | detached HEAD; `git branch --show-current` пуст; `git status -sb`: `## HEAD (no branch)` |
| Исходный porcelain | пуст |
| Worktree | Git common directory принадлежит основному репозиторию; current root — выделенный audit worktree, не общий checkout |
| Output при старте | отсутствовал; `Test-Path` → False |
| OS | Windows_NT, release `10.0.26200`, x64 |
| Node | `v24.19.0` |
| pnpm | **Unknown/BLOCKED**: `pnpm --version` завершился ошибкой Corepack EPERM при чтении служебного metadata-файла; эскалация/изменение окружения не выполнялись |
| Dependency runtime | `node_modules` и `apps/backend/node_modules` отсутствуют; версии из lockfile не считаются установленными |
| Relevant lockfile versions | argon2 `0.44.0`, @nestjs/jwt `10.2.0`, jsonwebtoken `9.0.2` |
| Дата | Анализ 2026-09-06–07 Europe/Moscow (UTC+03:00); fingerprint timestamp `2026-09-06T20:54:23.154Z` = 23:54:23; финальная проверка `2026-09-06T21:12:42.213Z` = 2026-09-07 00:12:42 |
| ID reservation | SEC-001–SEC-020 подтверждены координатором в этом conversation; назначены SEC-001–SEC-004 |
| Checklist source SHA256 | `44fd1f11fa3953af03e51c8efd6233996f1c51c58193abc106bb252bebf51b6e` |

Первый запуск остановлен до аудита из-за отсутствия EXPECTED-параметров, без записи output. После их явной передачи frozen-target preflight пройден. Tag/HEAD/root/status проверены повторно перед созданием отчёта. Подготовительные `Pending` в charter/plan не использованы как новый target: frozen target определён specification и прямым заданием координатора.

Исторический baseline проверял `80de2c161f58e821d28bf2eb1d0a6ff7fd6329aa`, а не этот SHA. `git diff --name-only 80de2c161f58e821d28bf2eb1d0a6ff7fd6329aa HEAD -- apps package.json pnpm-lock.yaml .github` пуст. Это связывает исходники выбранной области, но не переносит runtime PASS: baseline работал в другой копии с установленными зависимостями. Его 220 backend / 60 frontend tests здесь не исполнялись. Устаревшие утверждения PROJECT_STATE о frontend tests и Task 046 разрешены чтением существующих tests и transaction call sites на HEAD; они не являются evidence текущего отсутствия тестов/атомарности.

### Safety и CodeGraph

- Разрешена запись только этого файла. Production code, tests, configuration, lockfiles, registries, specification и AGENTS.md не изменяются. Workflow/quality gates/security rules этим audit-pass не меняются, поэтому обновлять AGENTS.md не требуется и scope это запрещает.
- Не читались `.env`, credentials, cookies, uploads, seed-фотографии, dumps или реальные пользовательские данные. Fixtures в прочитанных specs синтетические. Никаких HTTP-запросов к приложению, DB connections, migrations, active exploitation, mutation/fault injection, package installs, servers, Docker lifecycle, commit/push/PR/cleanup.
- Проверены root/backend/frontend scripts, `.husky/commit-msg`, Jest unit/e2e configuration и e2e bootstrap. E2E bootstrap берёт URL из environment и выполняет migrate deploy; суффикс `_test`/`_ci` не доказывает изоляцию. E2E и runtime validation **BLOCKED**. Build/generate/frontend typecheck создают artifacts; не запускались. Unit tests **BLOCKED** отсутствием зависимостей и согласованного способа исполнения без побочных записей. Эти ограничения прямо предусмотрены specification, frozen-target STOP не возник.
- CodeGraph symbol search `AuthService` возвратил файл в текущем root; `get_ai_context` для этого файла/line 22 возвратил ближайший `ClientSessionMeta`, импорты и snippets с совпадающими source paths. Канонический путь и эти snippets сверены с локальным исходником. Однако отдельного project/workspace context API и metadata версии/profile среди доступных read tools нет. Согласно §12 specification: **CodeGraph BLOCKED — workspace binding полностью не доказан**, version/profile Unknown. Graph relations не использованы как evidence. Сообщение о строящихся embeddings также ограничивает semantic search. Анализ основан на `rg` и чтении source на HEAD; MCP configuration не менялась.

## 2. Coverage и метод

Прочитаны только назначенные sections master: **12, 19, 20, 25, 26, 29, 35, 36, 37, 38, 51, 58, 59, 60, 61, 62, 63, 64, 65, 66, 68, 69, 70, 73, 90, 91, 98, 99, 100, 101**. Извлечение от `^# <ID>.` до следующего верхнего heading; другие sections master не загружались. 12/19/20 — critical constraints/write boundaries; 59/61/66/68/69 — ограниченный JWT/session срез; 99/100 — self-export и наличие deletion; 51/90/91/101 — presence gate. Sections 121–124 не исследованы как полный pass. Mapping прочитан как план распределения, не как доказательство.

| Mandatory area / checklist | Выполненное покрытие | Disposition / границы |
| --- | --- | --- |
| Entry/credential inventory: 58, 98 | Все backend controller decorators, main/static surface, frontend API client и auth state, schema/config | Завершён static inventory; runtime/edge Unknown |
| Password/salt/secrets: 25, 26, 29 | register/login, argon2 calls, env validation/config, DTO, lockfile | Hash API подтверждён; фактические cost/salt/defaults runtime не проверены; secret scan и deployed key lifecycle BLOCKED |
| Token separation/JWT: 59, 60, 61, 69 | Access guard/signing и opaque refresh verifier | Разные validation paths подтверждены; cryptographic negative suite не запускалась |
| Rotation/logout/stale: 62–66, 68, 70 | Auth service/controller, service tests, frontend provider | Matrix ниже; instant access revoke/family policy требует решения |
| Ownership: 37, 73 | Self profile/settings/export/media; other-user profile/likes; match/chat/notification/block/report selectors | Critical A/B paths прослежены; races вынесены отдельно |
| Input/files/output/limits: 35, 36, 38 | DTO/global pipe, UUID params, MIME/signatures/storage, serializers, limiter wiring | Static boundary review завершён; HTTP/parser/browser behavior не воспроизведён |
| Critical integrity: 12, 19, 20 | Auth register/rotation, upload/delete, like-match-notification, block-conversation, message/game | SQL constraints и transaction clients прочитаны; DB installation/rollback/concurrency Unknown |
| Conditional/privacy: 51, 90, 91, 99–101 | Presence gates; self-export filters, отсутствующий account deletion route | Полные privacy/retention/admin/WSS audits не выполнялись |

Метод: runtime evidence недоступно в разрешённом scope → source/config → schema/migrations → assertions существующих tests → исторический baseline. Documentation использована только как источник ожидаемой policy. Не приравниваются source tracing, mock assertions и runtime proof. В findings `Confirmed/Inferred/Unknown` обозначает качество конкретного наблюдения/причины, не lifecycle.

## 3. Entry points, credentials и trust boundaries

| Surface | Идентичность / данные / основные controls |
| --- | --- |
| `POST /auth/register`, `/auth/login` | Anonymous; DTO credentials → argon2/password DB → safe user/access response и HttpOnly refresh cookie; endpoint IP limits |
| `POST /auth/refresh`, `/auth/logout` | Cookie credential; отдельные IP limits; refresh проверяет secret, logout — SEC-001 |
| `GET /auth/me` | Bearer guard → active/nondeleted user lookup → safe auth serializer |
| `GET/PATCH /profiles/me`; `GET /profiles/:handle` | Actor только CurrentUser; update allowlist; other profile block/visibility checks, public serializer |
| `GET /discovery/cards`; `POST /likes/:targetProfileUserId[/skip]` | Bearer; active actor, target filters, bidirectional blocks, endpoint limits; UUID для likes |
| `GET /matches/me`; `POST /matches/:matchId/conversation` | Own pair membership; active target/match checks; conversation creation boundary SEC-003 |
| `GET /chat/conversations`, `.../:conversationId/messages`, `.../stage`, `.../game/current`; `GET /chat/starters` | Bearer; conversation routes проверяют active membership; reads учитывают block/closed. Starters — общие справочные фразы, без user-state lookup |
| `POST .../messages`, `.../game/postpone`, `.../game/:gameId/answer` | Actor CurrentUser; conversation membership/status, DTO; send rate limit; game row lock на answer |
| `GET /media/profile-photos/me`, `POST /media/profile-photos`, `PATCH /:photoId/primary`, `DELETE /:photoId` | Active actor; owner comparison для чужого ID, UUID pipe; multipart size limit до service; storage boundary |
| `GET/PATCH /settings/privacy`, `/settings/notifications` | CurrentUser-only where + response select allowlist |
| `GET /notifications`, `/unread-count`; `POST /read-all`, `/:notificationId/read` | Recipient filter, active/nondeleted actor visibility, bidirectional block filtering; per-user limits |
| `POST/DELETE /blocks/:targetUserId`, `GET /blocks/me`, `POST /reports` | Actor CurrentUser; UUID/enum/details validation; target active; own outgoing blocks, report output hides workflow |
| `GET /users/me/export` | Active actor; 15 self-scoped reads, select allowlists; user+IP export limits |
| `GET /health` | Anonymous; bounded status/dependency response, executes SELECT 1 when called; здесь не вызывался |
| Static `/uploads/profile-photos/...` | `main.ts:34–43` direct static serving с cache 1h, без JWT/DB/visibility check; отдельный trust boundary, не защищён controller guard |
| Next frontend | API client передаёт Bearer и `credentials: include`; app/layout держит AuthProvider. В app нет `route.*` API handlers; next.config без rewrites/custom integration |

| Credential | Generation/storage/transmission/validation/expiry/revoke |
| --- | --- |
| Password | RegisterDto 8–128; argon2.hash без ручного salt; login argon2.verify, без собственного fast hash. DB хранит passwordHash, JSON serializers исключают его. Password-change/reset backend нет |
| Access JWT | `signAccessToken`: sub/email + библиотечные temporal claims, configured access secret и TTL (default 900s). JSON только auth responses; browser memory/ref; Authorization Bearer. Guard вызывает verifyAsync с secret; собственного issuer/audience/algorithm allowlist/sub-shape validation и session reference нет. Library behavior без installed runtime Unknown. Отдельной denylist нет |
| Refresh | `randomBytes(48)` → base64url; row UUID + secret в HttpOnly cookie; DB только argon2 hash, expiry, revoke metadata, IP/UA. Default TTL 30 days, обновляется при rotation. verify ищет row, проверяет revoked/expired/user status/deletedAt, затем argon2.verify. Rotation — conditional revoke + create в transaction. Logout — row revoke. Scheduled purge/family relation не найдены |
| Cookie session locator | UUID — locator refresh row, не самостоятельная auth proof по security README:13. Публичный export sessions UUID не выдаёт. Его знание без secret всё же позволяет logout — SEC-001 |
| Backend configuration credentials | DATABASE_URL и JWT_ACCESS_SECRET используются runtime; JWT_REFRESH_SECRET валидируется/загружается, но в текущем opaque refresh flow не подписывает и не проверяет token. Значения не читались. Доставка/rotation/разделение environments Unknown |
| Другие пользовательские credentials | OAuth/OIDC/state/nonce, reset/email verification token, MFA/recovery, magic link, WS ticket, service API credentials не найдены в текущих routes/models/providers/client; OTP UI dependency не доказывает MFA. Не заявляется отсутствие внешних инфраструктурных credentials |

Cookie options: HttpOnly, path `/auth`, production Secure + SameSite=None, development/test SameSite=Lax (`auth.controller.ts:135–144`, `auth.constants.ts` через импорт/использование). CORS callback разрешает отсутствующий origin или точное совпадение configured origins, иначе передаёт error; это не wildcard CORS. Полная browser CSRF/TLS/proxy проверка не проводилась. Не делается вывод о CSRF exploit только из SameSite=None.

Threat model: anonymous actor → auth/parser/CPU; authenticated A → ресурсы B/abuse; legitimate concurrent requests → revoked/closed state и partial writes; holder of an old public media URL → privacy boundary; delayed frontend responses → session identity. Assets: password/refresh verifier material, self PII/export, chat content, photos, block state. DB и disk — разные transaction domains. Controls и residual risks описаны ниже; production network/операторские роли не моделировались полностью.

## 4. Ограниченная auth/session policy matrix

| Сценарий | Ожидание и источник policy | Source/test evidence на checked SHA | Результат / uncertainty |
| --- | --- | --- | --- |
| Missing/invalid/expired access → protected API | Deny; API auth contract и security README | JwtAccessGuard:24–49, verifyAsync; controller guards | Confirmed delegation/signature verification call; expiry/modified-token runtime Unknown; dedicated guard spec отсутствует |
| Refresh как Bearer access | Deny; master 60 | Refresh cookie two-part opaque, access verifier JWT; secret generated separately | Inferred rejection библиотекой, runtime test не запускался; отсутствие token_use само по себе не дефект |
| Access как refresh cookie | Deny; master 60 | verifyRefreshCookie:464–495 ищет row locator + argon2 secret; JWT не выдаётся как refresh | Нет code path обмена access на refresh; malformed locator может закончиться generic 500 вместо 401 — следующий DTO/HTTP validation pass |
| Valid refresh | One new pair, old refresh single-use; security README:14–15, API:167–171 | AuthService:173–197,385–433; auth.service.spec.ts:369–451 | Confirmed conditional update/count=1 + create в одной transaction; mock sequential reuse assertion прочитан, DB race не выполнен |
| Revoked/expired/wrong-secret refresh | Deny; API:169 | verifyRefreshCookie:477–489; revoked/expired tests:453–483 | Confirmed code branches; wrong-secret refresh negative assertion отдельно не найдена в reviewed suite; runtime Unknown |
| Valid logout → same old refresh | Deny; master 64, API:179 | logout updateMany + verifier revokedAt; spec:487–525 | Sequential mock сценарий есть; здесь NOT RUN. Concurrent logout/rotation/family semantics не доказаны |
| Known locator + wrong/empty refresh secret → logout | Нельзя отзывать чужую сессию по locator; security README:13 и owner boundary | logout не вызывает verifier/argon2; parser принимает suffix любого содержания | SEC-001, Proposed |
| Old access после logout → /auth/me, /profiles/me, settings, chat | **Owner Decision Required**: instant revoke либо bounded TTL; master 65/66 | Guard без session lookup; service проверяет active user, logout не меняет user | При active user source не содержит причины отказа до JWT expiry. Это не объявлено дефектом: access policy не согласована |
| Access/refresh disabled или soft-deleted actor | Deny critical data; security README:262, сервисные contracts | AuthService.getMe/refresh; assertActiveUser в profiles/media/settings/users/discovery/likes/matches/chat/notifications/moderation | Sequential data routes сверяют DB status/deletedAt. `/chat/starters` только JWT; там общие фразы. In-flight state change после проверки остаётся race blind spot |
| A token + B profile/settings/export identity | Self routes остаются A; публичный profile B по visibility | CurrentUser-only selectors; profile update DTO не принимает identity | Static self isolation прослежена. Public target disabled/deleted check в getByHandle отсутствует — Owner Decision ниже |
| A token + B photo/notification/match/conversation ID | Deny вне ownership/membership | Media assertOwner; notification recipient where; match participant; chat activeParticipantWhere + game conversation_id | Source deny boundaries подтверждены; HTTP A/B suite не запускалась |
| Old signing key / staging token / wrong aud/iss | **Owner Decision Required** по key/environment policy | Один configured symmetric secret; нет explicit audience/issuer selection/key ring | Shared key между средами не проверен и не предполагается. Missing claims не классифицируются как доказанный cross-env bypass |
| Role downgrade/password change/MFA/email change | Policy required только при наличии flow | Roles/admin и соответствующие credential mutation endpoints отсутствуют | N/A для этих текущих product flows; перед реализацией нужна policy |
| Logout завершён, старый refresh response приходит позже | Frontend остаётся очищенным; API README:36 | AuthProvider refresh.then applySession vs logout.finally clearSession | SEC-004; independent от решения об instant backend JWT revoke |
| Refresh signing/response failure после DB rotation | Требуется определить recovery contract | rotateRefreshTokenSession коммитится до signAccessToken:190 и cookie response | Partial-write candidate для validation: старый refresh уже отозван, новый может не доставиться; не проверено исполнением |

## 5. Input, output, media и rate limits

- `main.ts:55–62`: ValidationPipe whitelist + forbidNonWhitelisted + transform. Register password/handle/displayName/date имеют bounds; дата и 18+ проверяются сервером (AuthService:261–333), birthDate self-update не разрешён. Login password имеет MinLength без MaxLength; transport/library actual bounds не замерялись. Profile/settings `IsOptional` пропускает null: для nonnullable displayName/boolean это может дойти до Prisma error; отдельная contract verification, не ownership bypass.
- UUID pipes найдены для photo, targetUser, targetProfileUser, match, conversation, game, notification IDs. Cursor DTO — string без UUID/length format; page size ограничен 20 discovery и 50 common. Ошибки malformed cursors/refresh locator требуют HTTP проверки; не выдаются за подтверждённый exploit.
- Media: FileInterceptor limit 5 MB; service проверяет наличие/size/MIME и JPEG/PNG/WebP magic bytes. Это prefix validation, не full image decode/EXIF stripping. Original filename не используется storage API; UUID filename выбирается backend. Upload сразу approved/published — существующее MVP поведение, не новая assurance о moderation.
- Storage deletion проверяет prefix, basename, UUID+extension, relative containment; только ENOENT подавляется. Owner check предшествует physical delete. SQL row удаляется после файла; DB failure может оставить row без файла, повторное удаление физического отсутствия безопасно. Противоположный режим — upload cleanup после commit — SEC-002.
- Auth/public/self serializers возвращают explicit objects. Public photos фильтруются по approved+published+URL; private serializer выдаёт `photos: []`. Self photo serializer исключает storageKey и original filename; export использует select allowlist, senderUserId для собственных сообщений, reporter/blocker/recipient filters, не выгружает received reports/blocks. Фактическая delivery больших экспортов и snapshot consistency не проверены.
- Global ThrottlerGuard: 300 / 10 min / IP. Endpoint RateLimitGuard подключён декоратором; authenticated class guard заполняет request.user; per-user subject не берётся из body. Login: IP + normalized email SHA256; этот SHA256 не password hashing. Register 3/h/IP, refresh/logout 30/10min/IP, send 30/min + 120/10min/user, upload 20/h/user, media actions 60/h/user, export 3/h/user + 10/h/IP. RateLimitService Map — single-process store; обход между replicas, restart и proxy IP attribution не исследованы как current exploit. `trust proxy` в bootstrap не задаётся; выбранная production topology Unknown.
- AllExceptionsFilter скрывает unexpected error в HTTP за `Internal server error`, но передаёт сам exception в logger (`all-exceptions.filter.ts:72`). PII-safe logging не подтверждено: ORM error details потенциально содержат ввод. Логи не открывались; только будущая synthetic log-redaction проверка.
- Static media serving идёт вне API guard и до cookie/CORS wiring. Проверки public serializer не доказывают privacy прямого уже известного URL. Contract current public URL и отсутствие private media lifecycle обозначены в PROJECT_STATE; решение по revocation/direct-link privacy вынесено владельцам, не скрыто за assurance сериализатора.

## 6. Critical data invariants

| Invariant | Source/schema/migration/test evidence | Оценка и оставшаяся проверка |
| --- | --- | --- |
| Account + profile/settings + первая refresh session атомарны | AuthService.register:88–118 передаёт tx в issueTokenPair/createRefreshTokenSession; auth spec:210; nested create | Confirmed transaction propagation, mock assertion; rollback PostgreSQL не выполнен |
| Refresh session употребляется один раз | conditional update `revokedAt:null, expiresAt>rotatedAt`, count=1, create successor в tx | Strong source candidate; реальный concurrent update/rollback не доказан |
| Email/handle case-insensitive unique | greenfield migration:277,298 expression unique lower indexes, нормализация/prechecks/P2002 mapping | Duplicate-write protection присутствует в SQL; миграции не применялись; existence checks не единственный барьер |
| Photo owner/position/primary | schema ProfilePhoto unique(userId,position), storageKey unique; SQL partial unique primary:319; publication requires approved:121 | Наивная гипотеза «две primary разрешены schema» отвергнута SQL evidence. Concurrent count/max-position может дать конфликт; превышение лимита не доказано |
| Like + reciprocal match + notifications | LikesService transaction → MatchesService external client branch → NotificationsService client; standalone match также tx | Причина «notification всегда вне tx» отвергнута. Mock call identity не доказывает DB rollback |
| Block + existing match/conversation закрываются атомарно | ModerationService.blockUser/endActiveMatchesBetween + lockUserPair; SQL block unique/no-self | Existing-row path защищён transaction; concurrent new conversation не синхронизируется — SEC-003 |
| Active likes/matches не перекрываются | migrations 20260607120000:35 и 20260607140000:25 GiST exclusion; canonical pair CHECK | Прочитаны также удаления старых unique indexes: не перепутаны historical и действующие constraints. DB readiness/extension availability Unknown |
| Conversation + два участника; один conversation/match | nested create в transaction, schema/SQL unique matchId; duplicate race catch | Duplicate conversation ≠ block race; uniqueness не защищает status lifecycle |
| Message membership и системный sender | composite FK message(conversationId,senderUserId) → participant; migration 20260630130000 system sender CHECK | Source `CurrentUser` sender, DTO allowlist; DB guarantees только после применения migrations |
| Message/game/notification write boundaries | ChatService.sendMessage tx:646–712, NotificationsService client; answerGame:538–595 row lock по game+conversation; gameAnswer unique(gameId,userId) | Ordinary text send/check-block и game conversation check до tx — in-flight candidates; полный failure matrix передан отдельному pass |
| Account deletion | Нет DELETE users route; UserStatus/deletedAt schema и actor checks существуют; FK hard-delete cascade не равен soft-delete workflow | N/A implemented delete flow; retention/erase/revocation policy для Task 067b требует отдельного pass |
| Export snapshot | 15 reads в array transaction; isolationLevel не задан | Shared transaction сам по себе не доказывает один snapshot. DB isolation/runtime Unknown; не объявляется full consistency PASS |

## 7. Candidate findings

Общие metadata для всех записей: Source pass — этот файл; checked/last verified commit **fed276a97fd84f29032c5eac1b11447bb1f3ed4c**; environment/date и checklist SHA256 — §1; Applicability **Applicable now**; Status **Proposed**; независимый Reviewer отсутствует. Assessment — static evidence выявлено, runtime reproduction **BLOCKED/not run**. Related sibling findings **Unknown** (blind primary analysis); registry не менялся. Reverification trigger для каждого: изменение перечисленных source/tests, schema/config/dependencies или связанной policy. Remediation horizon — **now, кандидат для решения владельца**, без разрешения implementation.

### SEC-001 — Logout отзывает refresh session по locator без проверки secret

- Domain: Security / auth ownership.
- Severity: **P2**; Confidence **High** для source behavior, likelihood эксплуатации **Unknown**.
- Affected files/symbols: `apps/backend/src/modules/auth/auth.service.ts:199–216` logout, `:498–513` parseRefreshCookie; `auth.controller.ts:80–93`; `auth.service.spec.ts:487–525`.
- Checklist: 37, 58, 62, 63, 64, 73. Related findings: нет локальных дублей. Best-practice candidate: нет отдельного.

**Current behavior / protected invariant.** По `docs/security/README.md:13` id нужен только для поиска, raw token проверяется argon2. Logout parser возвращает locator и suffix, но updateMany использует только locator и revokedAt. Ни сравнения raw secret/hash, ни authenticated ownership check нет. Cookie с существующим row ID и произвольным/пустым suffix запускает отзыв этой row.

**Evidence / root cause.** **Confirmed**: `logout` не вызывает `verifyRefreshCookie` и не использует `parsed.rawToken`. Controller не требует access guard для этого маршрута. Mock logout test использует правильную cookie и имитирует update по id; неправильный secret там не проверяется. UUID row не найден в публичных serializers/export: источник его получения атакующим не доказан.

**Reproduction/verification.** Выполнено только чтение control flow и assertion. Следующий отдельный synthetic check: row B с известным fixture ID; logout с тем же ID и несовпадающим secret; проверить, что row B не revoked, затем valid logout отзывается, repeated logout остаётся нераскрывающим. Здесь ни cookie, ни запросы не создавались.

**Risk.** Session denial-of-service при знании locator без secret, не account takeover. Нужен отдельный канал знания UUID; перебор UUID не предполагается. Это ограничивает severity до P2, не P0/P1.

**Recommended solution.** Minimal fix: подтвердить secret перед отзывом, сохранив безопасную идемпотентность внешнего logout-ответа. Target fix: тот же; не навязывается family/global logout policy. Owner: auth owner. Alternatives: считать UUID самостоятельным secret — противоречит разделению locator/verifier; требовать только access token — меняет возможность logout при истёкшем access и требует отдельного решения.

**Tests required / acceptance.** Wrong/empty secret не меняет B; valid secret отзывает; missing/already revoked cookie не раскрывает наличие сессии; old refresh после успешного logout rejected. Минимальная ownership-проверка должна оставаться совместимой с текущим API response.

**Documentation impact / review history.** Уточнить logout contract в security/API при remediation, без секретных примеров. 2026-09-06: автор предложил по source evidence; независимый review pending, статус Proposed.

### SEC-002 — Upload cleanup может удалить файл уже закоммиченной фотографии

- Domain: Security / media data integrity.
- Severity: **P2**; Confidence **High** для error boundary, частота отказа **Unknown**.
- Affected files/symbols: `apps/backend/src/modules/media/media.service.ts:84–129` uploadProfilePhoto, `:311–326` getSelfProfileView; storage adapter deleteProfilePhoto; `media.service.spec.ts:361–392`.
- Checklist: 19, 20, 35, 36. Related findings: Task 047 — другая сторона DB/disk boundary, не дубликат исправленного delete path. Best-practice candidate: нет отдельного.

**Current behavior / invariant.** После успешного `$transaction` с photo.create код внутри того же try ожидает getSelfProfileView. Если это последующее чтение/serialization падает, catch удаляет storage file, хотя photo row уже committed. Ожидается, что компенсация несостоявшейся DB записи не уничтожает файл состоявшейся записи; источник — transaction semantics выбранного workflow, `ProfilePhoto` publicUrl/storage association и успешное сохранение photo.

**Evidence / root cause.** **Confirmed** область try включает и запись tx, и post-commit read; catch не различает их. SQL rollback уже не затронет committed row. Тесты проверяют create rejection и cleanup rejection, но не post-commit profile-read failure. Это source-derived outcome при указанном отказе, не исполненный fault experiment.

**Reproduction/verification.** Прочитан путь create → tx resolve → profile read reject → deleteProfilePhoto. Отдельный future synthetic validation: commit photo, дать ошибку последующему read; убедиться, что файл сохранён. Отрицательный контроль: tx create rollback всё ещё удаляет orphan file.

**Risk.** Битая public/self photo и занятый slot после transient DB/read failure; повтор upload создаёт другую row, не восстанавливая первую. Потеря отдельного файла возможна при успешной компенсации; вероятность не измерялась. P2, без утверждения о массовой потере/эксплуатации.

**Recommended solution.** Minimal fix: ограничить cleanup catch только неуспешным DB commit, вынести формирование response за его границу. Target fix: то же, затем отдельно согласовать recoverable disk/DB lifecycle. Alternatives: оставить текущее — портит committed state; широкая outbox/storage redesign сейчас избыточна для этой причины.

**Tests required / acceptance.** Post-commit read failure не вызывает physical delete; create failure cleanup сохраняется; cleanup error не маскирует исходную ошибку. Существующие owner checks/primary/size behavior не меняются.

**Documentation impact / review history.** Зафиксировать границу компенсации в remediation spec/media docs; Task 047 не объявлять регрессировавшим delete без отдельного evidence. 2026-09-06: Proposed, independent review pending.

### SEC-003 — Создание conversation может обойти закрытие при конкурентном block

- Domain: Security / block lifecycle and data integrity.
- Severity: **P1 provisional**; Confidence **Medium** для race outcome, **High** для отсутствующей синхронизации в source.
- Affected files/symbols: `apps/backend/src/modules/chat/chat.service.ts:748–835` startConversationFromMatch; `modules/moderation/moderation.service.ts` blockUser/endActiveMatchesBetween; `common/prisma/user-pair-lock.ts`; schema Conversation/Match.
- Checklist: 19, 20, 37, 73. Related findings: Task 024 и Task 042 — ограниченные существующие controls; не утверждается, что их прежнее evidence ложно. Best-practice candidate: нет отдельного.

**Current behavior / invariant.** Task 024 требует сохранять conversation closed после block/unblock; security README Chat rules разрешают создание только для active match. startConversationFromMatch читает active match и проверяет отсутствие block до transaction. Его transaction выполняет только nested conversation create; pair lock и повторная проверка block/match внутри отсутствуют. blockUser использует pair lock и закрывает существующие conversations.

**Evidence / root cause.** **Confirmed** локально: pair lock есть у block/like/match, но не у startConversationFromMatch. **Inferred** последовательность: start читает active match/no block → block коммитит Block + blocked Match (conversation ещё нет) → start создаёт active Conversation по сохранённому match ID. FK/unique допускают ссылку на существующий blocked match и не связывают статусы. После последующего unblock читающие/пишущие пути ориентируются на active conversation и отсутствие Block, поэтому возможно восстановление доступа вопреки постоянному закрытию. Пока Block существует, read/send block checks остаются барьером: немедленный arbitrary IDOR не заявляется.

**Reproduction/verification.** Исполнен static interleaving analysis, **не concurrency experiment**. `chat.service.spec.ts:702` проверяет заранее существующий block; `match-block-chat.e2e-spec.ts:127,188` содержит sequential close/unblock и like-vs-block, но не start-conversation-vs-block. E2E не запускался. Для confirmation нужен отдельный deterministic two-transaction test с barrier между precheck/create, проверкой final state и read/send после unblock, плюс обратный порядок.

**Risk.** Нарушение safety-блокировки и сохранение/возврат канала контакта с заблокированным человеком. Race window и последующий unblock — обязательные условия. Приоритет P1 **provisional**, требует повторного открытия primary evidence Synthesis/Red-Team; частота и deployed outcome Unknown.

**Recommended solution.** Minimal fix: согласовать порядок locks, брать существующий pair lock в transaction conversation creation и заново проверять block/active match внутри неё. Target fix: тот же invariant для всех lifecycle writers, scope отдельной задачи. Alternatives: один дополнительный preflight read без shared synchronization не закрывает race; full serializable policy дороже и требует retry contract.

**Tests required / acceptance.** В обоих порядках block/start не остаётся доступного active conversation для blocked match; unblock не восстанавливает старый закрываемый канал. Existing conversation после обычного expiry и idempotent duplicate-start остаются по прежнему contract.

**Documentation impact / review history.** Дополнить границы Task 024/042 и chat lifecycle после независимой валидации; не переписывать исторические результаты. 2026-09-06: Proposed, P1 provisional, runtime confirmation pending.

### SEC-004 — Поздний refresh response может восстановить frontend session после logout

- Domain: Security / frontend session lifecycle.
- Severity: **P2**; Confidence **High** для async state overwrite, **Medium** для end-to-end сценария.
- Affected files/symbols: `apps/frontend/lib/auth-context.tsx:53–90,118–140` applySession/refreshSession/login/logout; `apps/frontend/app/layout.tsx:63`; `apps/frontend/features/app-shell/components/app-nav.tsx:80`; `auth-context.test.ts`.
- Checklist: 62, 63, 65, 70. Related findings: не дублирует SEC-001; корректный server logout не устраняет поздний applySession. Best-practice candidate: нет отдельного.

**Current behavior / invariant.** API README:36 описывает очищенное memory state после logout. AuthProvider держится в root layout. Любой успешный pending refresh безусловно вызывает applySession, ошибка — clearSession. Logout очищает state в finally, но не инвалидирует старую promise и не проверяет поколение auth state. Значит более поздний response может снова записать user/access; pending refresh также может перезаписать результат последующего login другой учётной записи.

**Evidence / root cause.** **Confirmed**: отсутствует generation/cancellation check у then/catch, shared refreshPromiseRef дедуплицирует refresh только между собой. **Inferred** browser ordering: refresh уже обработан сервером, доставка задержалась; logout response пришёл и clearSession выполнен; затем refresh response вызывает applySession. Это не требует считать старый access немедленно отозванным. Cookie/network ordering и реальный UI не проверялись. Reviewed four bootstrap tests не проверяют logout или смену identity.

**Reproduction/verification.** Только code tracing. Будущий isolated React test с deferred authApi.refresh: начать refresh → завершить logout → разрешить старую promise; memory user/access должны остаться null. Отдельный контроль login B → late refresh A не заменяет B; stale rejection тоже не очищает новую session. Новые tests здесь не создавались и не запускались.

**Risk.** На общем устройстве UI может вновь считать пользователя вошедшим после logout либо выполнять последующие запросы под прежней identity. Нужны overlapping requests и определённый порядок завершения; не заявляется remote account takeover. P2 до browser validation.

**Recommended solution.** Minimal fix: invalidation generation для pending auth operations при logout/login/register; применять и очищать state только для актуального поколения. Target fix: согласовать frontend ordering вместе с cookie refresh/logout ordering, сохранив shared-promise behavior. Alternatives: await pending refresh перед logout может упереться в зависшую сеть; один AbortController без state generation недостаточен для уже завершённого response. Backend instant JWT revoke — другое policy-решение и само не исправляет UI state.

**Tests required / acceptance.** Deferred success/rejection не меняет state новой session; logout остаётся очищенным; обычный single-flight bootstrap/retry не регрессирует. Browser/cookie validation только отдельным разрешённым pass.

**Documentation impact / review history.** Уточнить frontend auth concurrency contract в remediation и связать с Task 079 tests, не менять его bootstrap scope задним числом. 2026-09-06: Proposed, independent review pending.

## 8. Rejected hypotheses и сохранённые ограничения

| Гипотеза | Основание отклонения / связи |
| --- | --- |
| Refresh — JWT, значит может приниматься access guard из-за отсутствующего token_use | Фактически opaque random secret с DB+argon2 verifier; JWT_REFRESH_SECRET не делает его JWT. Runtime wrong-type check всё ещё нужен |
| Refresh вообще не single-use | Conditional revoke count=1 + create в tx; sequential reuse test. Это не доказательство всех logout/family races |
| Photo original filename позволяет выбрать путь | Storage API принимает только buffer/MIME, генерирует UUID; deletion canonical filename checks и negative tests. Symlink attacks/host compromise не проверены |
| API public serializers отдают raw password/token/storage rows | Reviewed return objects/allowlists этого не делают; private photo list пуст. Static URL privacy и exception logging — отдельные boundaries, не закрыты этим выводом |
| Case-insensitive duplicate account защищён только precheck | SQL expression unique lower(email/handle) присутствуют; actual migrated DB Unknown |
| Одновременные photos могут создать две primary без DB constraint | SQL partial unique существует вне Prisma model; photo count/max-position race остаётся next verification |
| Все notification writes вне основной transaction | Reviewed match/message callers передают tx; createNotificationForRecipient пишет через client. Mock tests не доказывают rollback, но blanket hypothesis отвергнута |
| Unblock штатно переоткрывает существующий closed chat | unblock только delete Block; read/writable проверяют status. SEC-003 касается вновь созданной во время race conversation |
| SameSite=None само доказывает CSRF | Explicit origin callback отвергает чужой Origin до controller; browser/no-Origin/content-type cases не воспроизводились |
| Отсутствие Redis/WSS/AI/admin — security finding | Эти компоненты необязательны; presence/disposition отдельно, внедрение не рекомендуется ради checklist |

## 9. Assurance candidates

Это **Candidate**, не independently Confirmed; ASR IDs не назначались (это роль координатора). SHA/environment/date/checklist hash — §1. Негативные ветви и существующие assertions ниже **прочитаны**, но tests в этом pass не исполнялись; scope claim сознательно source-level. Recheck при изменении соответствующего кода, types/schema, dependency behavior, privacy/ownership policy.

### Candidate — Explicit profile/photo response projection

- Invariant: `toPublicProfile`, `toPublicProfilePhotos`, `toSelfProfilePhoto` формируют explicit allowlist, private public profile photos пусты; public photo требует URL+approved+published.
- Checklist 36, 37, 73. Evidence: `common/serializers/user-profile.serializer.ts` указанные symbols; `user-profile.serializer.spec.ts` exact shape и private/partial private assertions; reviewed service return paths profiles/media/matches/notifications.
- Negative controls: статически прослежены pending, missing URL, missing publication, private mode; exact expected objects не допускают добавочных keys. Не все комбинации runtime выполнены; rejected-photo case логически исключён equality, но отдельного executed test здесь нет.
- Boundaries: только проекции этих functions, не все API, не direct static media, не logs, не whole export/legal compliance. Parent routes могут ошибочно выбрать разрешённый для них profile — это не исключается serializer assurance.
- Reviewer pending. Minimal reverification: isolated serializer suite с extra sensitive source properties, private flags и photo combinations; caller diff review.

### Candidate — Media owner and filename boundary

- Invariant: set-primary/delete service rejects non-owner до DB mutation/physical delete; local adapter не использует original filename и фильтрует deletion filename до unlink.
- Checklist 35, 37, 73. Evidence: MediaService.setProfilePhotoPrimary/deleteProfilePhoto, `LocalProfilePhotoStorageService.getPhotoFilePath/isWithinDirectory`; specs owner rejection и invalid-key table, no-unlink assertions.
- Negative controls reviewed: чужой owner, missing photo, wrong prefix, traversal, nested path, unsupported extension, non-UUID, absolute path; unsupported MIME before write.
- Boundaries: source control flow + filesystem mocks. Не гарантирует безопасность symlinks, actual OS permissions, uploads decompression, DB/disk recovery или concurrent owner/data changes. SEC-002 остаётся независимо от этого bounded candidate.
- Reviewer pending. Recheck: source changes плюс isolated owner/storage tests, physical filesystem checks только в отдельно согласованной среде.

Best-practice candidates: **нет отдельных**. Точечные рекомендации связаны с установленными causes SEC-001–004; generic архитектура, Vault/Redis/outbox/token-family не объявлены обязательными.

## 10. Conditional inventory / N/A evidence

Presence evidence: manifests обоих приложений; AppModule и auth/module/providers; все backend controller decorators; schema; `main.ts`, config/*.ts, next.config.mjs; frontend app/lib/features/components/hooks/types symbol search; Compose структурно содержит postgres/backend/frontend, без Redis/queue/replica component names. Поиск ограничен source/config, не real environment. Пустой поиск не заменяет эти несколько источников. Совпадение `stripe` в veil-overlay — геометрическая полоса, не платёжный SDK.

| Компонент | Disposition на audit SHA |
| --- | --- |
| Product WSS/WebSocket | **N/A — absence verified в текущих app entry points**: нет gateway/module/client/route/config integration; чат REST. External proxy/runtime вне проверки |
| Redis/queues/workers/webhooks | **N/A — absence verified в текущих app paths**: нет dependencies/providers/consumer routes; NotificationsService синхронно пишет Prisma. Jobs реализации не предполагаются по наличию notifications |
| Product AI/payment integration | **N/A — absence verified в текущих app paths**: нет SDK/client/module/routes/schema flows. Dev AI tooling не product AI |
| Admin/roles/privilege downgrade | **N/A — absence verified для product API**: нет admin controller/role model/provider. Moderation здесь user block/report, не привилегированная консоль |
| OAuth/OIDC/MFA/reset/verification | **N/A — absence verified для backend credential flows**: AuthController ограничен register/login/refresh/logout/me; schema не содержит соответствующие tokens; forgot-password — frontend stub, OTP UI package — не backend MFA |
| Replicas/read routing | **N/A — absence verified в текущей checked-in app/Compose configuration**: один Prisma datasource и PrismaService без routing extension; внешняя фактическая DB topology **Unknown** |
| Account deletion | **Не реализовано**: users controller только GET export, нет account erase/revoke-all workflow. Отсутствие не превращается в assurance retention; отдельная Task 067b |
| Mobile/Kubernetes/analytics/processors | **Conditional/Unknown** в этом bounded pass; полного inventory не было. Наличие @vercel/analytics в frontend manifest отмечено, data flow/PII в analytics не аудирован |

## 11. Owner Decision Required и blind spots

1. **Access после logout:** допустимый TTL или немедленный revoke; current code stateless относительно refresh session. Нет вывода «logout сломан» лишь из отсутствия denylist. Определить session/family/global logout scope и logout concurrent с rotation.
2. **Direct photo links:** private/discoverable/block/rejected/deleted должны запрещать новые GET ранее опубликованного URL или только исключать URL из API? Сейчас static serving не сверяет state, private serializer корректно скрывает URL из новых ответов. PROJECT_STATE явно признаёт отсутствие private media lifecycle. Для media privacy нужен отдельный согласованный contract, включая cache horizon; не проверять реальными фото.
3. **Inactive target profile:** `ProfilesService.getByHandle` проверяет actor active, но не выбирает target status/deletedAt; discovery/likes это делают. Если profile row остаётся open/discoverable после soft delete/disable, прямой handle lookup продолжает сериализацию. Source факт подтверждён; требуемый public target lifecycle уточнить до dependent finding. Сам account-delete workflow отсутствует.
4. **Key/claims policy:** production issuer/audience, environment key separation, allowed alg, TTL ceiling и rotation/grace window. Secret values не читались; одинаковые ключи между средами не утверждаются. Payload email используется frontend identity shape; минимизация требует отдельного совместимого решения.
5. **In-flight requests:** какие действия должны завершаться/отклоняться при account disable/block во время уже начавшейся операции; claims о линейризуемом revoke требуют explicit policy. SEC-003 связан с существующим permanent-close invariant, а не навязывает новую global revoke модель.

Blind spots: runtime exploit/security validation; browser network/cookie order, CSRF/CORS/TLS/edge/proxy; installed crypto behavior, credential parsing errors; DB constraints/migration application/isolation/rollback/concurrency; реальный disk lifecycle/cache; full retention/deletion/backup/log/analytics PII; conditional WSS/admin/AI/full infrastructure audit; supply-chain advisory/secret scanning. Не было новых tests или внешнего research. Отсутствие secrets в прочитанном source не является полным secret-scanning assurance. Нет утверждения production readiness или полного security PASS.

## 12. Recommended next verification

1. Synthesis/Red-Team в новом independent conversation повторно открывает primary source всех четырёх записей, особенно **SEC-003 P1 provisional**; только затем triage/registry. Не объединять sibling findings без проверки причин.
2. После отдельного разрешения — minimal deterministic synthetic проверки SEC-001/002/004. Для SEC-003 отдельная изолированная PostgreSQL среда и barrier-controlled block/start; не использовать real credentials и не считать этот отчёт разрешением исполнения.
3. Согласовать auth policy; проверить actual JwtAccessGuard с valid/expired/modified/wrong-key/wrong-type tokens, malformed refresh locator, disabled/deleted actor, old refresh после logout и concurrent rotation. Проверить сохранение session при signAccessToken failure после rotation; family/reuse semantics выбрать до assertions.
4. Consistency/Idempotency pass: обычный text-send и game-answer/postpone concurrent с block; initial conversation race; media upload count/position/primary conflict; storage orphan cleanup/retry и delete DB failure; refresh/logout response-order и multi-tab; export isolation. Это кандидаты/вопросы, не выполненная полная 121–124 matrix.
5. Media validation pass: bounded direct URL privacy после state changes, synthetic image decode/metadata handling, safe error log capture, физическое удаление/retention. Исключить реальные фото/PII.

## 13. Methods, commands и журнал checks

Все команды выполнялись из выделенного root. Read-only команды иногда объединялись в один PowerShell batch; tool сообщает exit/duration **batch**, не каждого внутреннего Get-Content/rg. Ни один batch exit=0 не используется как доказательство прохождения вложенной упавшей команды. Длительности ниже — wall time tool, не benchmark; индивидуальные длительности не замеренных subcommands **Unknown**.

| Исполненная команда / группа | Result, exit и длительность |
| --- | --- |
| `git branch --show-current`; `git rev-parse HEAD`; `git rev-parse --show-toplevel`; `git rev-parse 'audit/yuni-2026-09-wave1^{commit}'`; `git status -sb`; `git status --porcelain=v1`; `Test-Path <output>` | Первичный frozen batch exit 0, 0.397s; начальный STOP missing EXPECTED, позже matching target с переданными параметрами |
| Те же target/status команды + `Get-Item D:\Yuni-audit-security` + charter/baseline read | Resumed batch exit 0, 0.449s; clean, normal directory |
| `git rev-parse --git-common-dir`; `node --version`; `pnpm --version`; dependency/output Test-Path; source file inventory | Batch 4.679s; Node PASS, pnpm ERROR/EPERM (individual nonzero code не сохранён), missing tools отмечены; конечный exit batch 0 не отменяет pnpm failure |
| `node -e` с `fs.realpathSync.native('.')`, canonical auth path, `os.type/release/arch`, ISO date | PASS, batch с docs read 4.486s; metadata §1; environment values не выводились |
| CodeGraph `symbol_search({query:'AuthService',compact:true,limit:3})` | Tool success, reported query_time_ms 0; total call duration отдельно Unknown; workspace proof неполон |
| CodeGraph `get_ai_context({uri:'file:///D:/Yuni-audit-security/apps/backend/src/modules/auth/auth.service.ts',line:22,intent:'explain',maxTokens:1200})` | Tool success, queryTime 3ms, fallback на interface; binding BLOCKED по отсутствию context API |
| `git diff --name-only 80de2c161f58e821d28bf2eb1d0a6ff7fd6329aa HEAD -- apps package.json pnpm-lock.yaml .github` | Пуст, повторён; latest batch 0.309s, exit 0 |
| `Get-Content` / `Get-Content -Raw` / `[IO.File]::ReadAllLines` для перечисленных в §14 файлов | Read-only source/docs/tests; завершённые batches exit 0; wall times 0.195–9.440s, отдельные первоначальные line-stream reads вернули sessions и затем завершились exit 0. Truncated combined output компенсировался focused повторным чтением source/sections; не рассматривается как test execution |
| Master extraction: переключать `$keep` на `^# (\d+)\.` для списка IDs §2; mapping filter `^\| (\d+) \|`; `Get-FileHash <master> -Algorithm SHA256` | Только назначенные master sections; matching hash §1. Extraction batch completed exit 0; individual duration Unknown. Mapping/hash/ref batch exit 0, 0.281s |
| `rg --files` source/docs/config inventories; `rg -n '@Controller|@(Get|Post|Patch|Delete|Put)|@UseGuards|@UseRateLimit' ... -g '*.controller.ts'` | Entry inventory §3, source discovery; файлов sibling reports не читали |
| `rg -n 'CHECK|UNIQUE|EXCLUDE|lower\(' apps/backend/prisma/migrations -g migration.sql`; focused FK/system-shape reads | SQL evidence §6; initial wildcard path `migrations/*/migration.sql` дал Windows path error, исправлен read-only search через directory + glob; runtime migration не запускалась |
| Scoped `rg -n` по auth/media/profile/chat/matches/notifications/discovery service и `it/test/describe/expect` по reviewed specs | Source/negative-assertion navigation, не исполнение tests; selected reads §14 |
| `rg -n -i 'websocket|socket\.io|websocketgateway|subscribemessage|wss://|ioredis|redis|bullmq|bullmodule|rabbitmq|kafka|@processor|webhook|stripe|paypal|openai|anthropic|langchain|jwks|oauth|oidc|passport|mfa|magic.?link|password.?reset|reset.?password|admin|replica|datasourceUrl'` на app source/manifests/schema | Только forgot-password UI и геометрические stripe matches, product integration не найдено. Дополнительный scan components/hooks/types; initial literal `next.config.*` path дал Windows error, затем прочитан и просканирован найденный next.config.mjs |
| `rg --files apps/frontend/app -g route.* -g middleware.* -g proxy.*`; config filename inventory | App API handlers не найдены; absence только в проверенном tree |
| `rg -n 'localStorage|sessionStorage|document.cookie|dangerouslySetInnerHTML|eval\(' apps/frontend/lib apps/frontend/features ...` | Найден language storage; auth source явно memory-only. Не full XSS audit |
| Read-only `node -e` Compose structural key/component-name extraction | postgres/backend/frontend + named volume; no conditional component-name matches; batch exit 0, 0.272s; значения environment не выводились |
| `rg -n 'argon2@|jsonwebtoken@|@nestjs/jwt@' pnpm-lock.yaml`; corrected next.config scan; pre-output target/status/diff checks | Lock metadata, no runtime; last pre-output batch exit 0, 0.359s; clean target |
| `git diff --check` до output | Exit 0, no diagnostics (batch 0.309s) |

Unit/lint/typecheck/build/Prisma/e2e/security runtime tests: **не запускались**, результаты/exit/duration **N/A — not run**, причины §1. Никаких benchmark, новых exploit probes или fault experiments. Команды app из прочитанных README/scripts не исполнялись. Чтение package scripts и e2e bootstrap не запускает их hooks.

## 14. Files and symbols reviewed

Пути относительно root; чтение означает source/static review, не проверку всех behaviors файла. Для больших services/tests ниже указана глубина.

- Governance/inputs: AGENTS.md; CLAUDE.md; PROJECT_STATE.md/ROADMAP.md (исторические claims/context); active skill; charter, baseline, findings/assurance templates и пустые registers, Wave 1 safety plan, mapping, current specification; назначенные sections master; AI_REVIEW_PROTOCOL и QUALITY_GATES.
- Policy: `docs/security/README.md`, `data-exposure-rules.md`, bounded auth/media/chat sections `docs/api/README.md`; `docs-site/content/modules/auth.md`, tasks/024.md, tasks/047.md; `docs/tasks/067a-user-data-export.md` (self export policy; исторические implementation claims не runtime evidence).
- `apps/backend/src/main.ts`, `app.module.ts`, config/env.validation.ts, auth.config.ts, cors.ts; auth/auth.module.ts, auth.controller.ts, auth.service.ts, guards/jwt-access.guard.ts, dto/register.dto.ts, dto/login.dto.ts: control flow целиком. Related types/imports изучены по usages; ABI runtime не проверен.
- `common/security/access-control.ts`, `common/serializers/user-profile.serializer.ts`, `common/rate-limit/{rate-limit.guard,rate-limit.service,rate-limit.constants,rate-limit.decorator}.ts`, `common/filters/all-exceptions.filter.ts`, `common/prisma/{prisma.service,user-pair-lock}.ts`, pagination/cursor-pagination.dto.ts.
- `modules/media/{media.controller,media.service}.ts`, storage/local-profile-photo-storage.service.ts; profiles/profiles.service.ts, dto/update-profile.dto.ts; settings/settings.service.ts, dto/update-privacy-settings.dto.ts; users/users.service.ts (select scopes и response mapping; отдельный user-data-export serializer не прочитан целиком).
- `modules/moderation/moderation.service.ts`, dto/create-report.dto.ts; likes/likes.service.ts целиком; matches/matches.service.ts — selection/status/transaction/serializer call sites и create branches; notifications/notifications.service.ts и discovery/discovery.service.ts целиком; discovery DTO.
- `modules/chat/chat.service.ts` — symbol inventory, deep read answerGame/sendMessage/lockAndReloadConversation/startConversationFromMatch/findWritableConversationOrThrow/findConversationForRead/activeParticipantWhere/unblockedConversationWhere; вспомогательная полная game/stage matrix вне pass. chat DTO create-message/answer-game; все domain controllers — decorators, CurrentUser, UUID wiring. health controller/service read целиком.
- `apps/backend/prisma/schema.prisma` целиком; migrations — critical CHECK/UNIQUE/exclusion/FK search всех migration.sql, deep reads likes-expiring, matches-expiring, system-message migration и greenfield FK/index slices. Full migration upgrade/data compatibility pass не проводился; seeds/data assets не читались.
- Tests deep read: auth.service.spec refresh/logout и registration transaction assertions; media.service.spec invalid upload/owner/cleanup; local storage spec целиком; access-control.spec и user-profile.serializer.spec целиком; frontend auth-context.test.ts целиком. Navigation/selected assertions: profiles.service.spec, users.service.spec, matches.service.spec, chat.service.spec; match-block-chat.e2e-spec test cases/assertions (не полный harness/runtime).
- Frontend `lib/auth-api.ts`, `lib/auth-context.tsx` целиком; root AuthProvider/logout call sites; source presence/storage searches в app/lib/features/components/hooks/types; `next.config.mjs`. Остальная UI security/XSS и browser states вне pass.
- Tool/check safety: root/backend/frontend package.json; pnpm-lock.yaml relevant crypto versions; backend Jest unit/e2e configs, test/profile-completion-e2e-environment.cjs; `.husky/commit-msg`; Compose structural extraction. CI текущего run не проверялся, использован исторический baseline с явной границей SHA/environment.

## 15. Final verification

После записи выполнены `git diff --check` и `git diff --no-index --check -- /dev/null docs/audits/yuni-2026-09/passes/wave-1/03-SECURITY-DATA-INTEGRITY.md`: diagnostics отсутствуют. `git diff --name-only` и `git diff --cached --name-only` пусты. Target SHA/tag снова совпали с `fed276a97fd84f29032c5eac1b11447bb1f3ed4c`; root `D:/Yuni-audit-security`, canonical root `D:\Yuni-audit-security`. Batch проверки завершён exit 0 за 0.536s, timestamp 2026-09-07 00:12:42 Europe/Moscow. После внесения этих результатов whitespace/allowlist повторно проверяются без изменения source.

`git status --porcelain=v1 --untracked-files=all` содержит ровно:

```text
?? docs/audits/yuni-2026-09/passes/wave-1/03-SECURITY-DATA-INTEGRITY.md
```

`git status -sb`:

```text
## HEAD (no branch)
?? docs/audits/yuni-2026-09/passes/
```

Повторная проверка через read-only Node `spawnSync` зафиксировала индивидуальные результаты: `git diff --check` exit 0 / 35ms; `git diff --no-index --check -- /dev/null <output>` exit 1 / 28ms, stdout/stderr пусты. Для no-index сравнения новый непустой файл отличается от `/dev/null`; exit 1 не назван exit 0 или успешно исполненным application test. Whitespace diagnostics нет. Проверяющий harness вернул exit 1, поскольку механически пометил любой ненулевой exit как ошибку. Остальные команды: full porcelain exit 0 / 33ms, status -sb exit 0 / 34ms, HEAD/tag/root exit 0 / 27/28/26ms, значения неизменны. Сам harness и служебные файлы на диск не сохранялись.

Краткий status сворачивает untracked directory; полный porcelain выше подтверждает один файл. Source/tests/configuration/registries не изменены. Commit, staging, push, cleanup и удаление worktree не выполнялись. Четыре finding ID уникальны и входят в согласованный диапазон. Primary static audit-pass завершён с явно перечисленными BLOCKED/Unknown; runtime security PASS и независимое подтверждение не заявляются. Отчёт оставлен координатору для сохранения и отдельного synthesis review.
