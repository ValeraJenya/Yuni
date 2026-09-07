# Yuni — Audit Checklist Mapping

- Дата подготовки: 2026-09-06.
- Путь исходника: `docs/audits/yuni-2026-09/inputs/YUNI-MASTER-AUDIT-CHECKLIST.md`.
- SHA256 исходника: `44FD1F11FA3953AF03E51C8EFD6233996F1C51C58193ABC106BB252BEBF51B6E`.
- Количество верхнеуровневых разделов: **125**.
- Диапазон номеров: **0–124**.
- Статус исходника: **immutable audit input**. Для этой ревизии действует зафиксированный hash, несмотря на историческое указание living document внутри master.

## Interpretation and scope

Это план распределения проверок, не аудит, findings или подтверждение корректности реализации. Создаётся только этот файл; master, существующие audit-документы и AGENTS.md не изменяются по заданному scope. Mapping конкретизирует план, не вводит новые обязательные архитектурные решения.
Прочитаны AGENTS.md, 00-PRE-AUDIT-PLAN.md, 01-AUDIT-CHARTER.md, 02-BASELINE.md, 03-FINDINGS.md, 04-WAVE-1-PLAN.md и исходник. Baseline evidence относится к `80de2c161f58e821d28bf2eb1d0a6ff7fd6329aa`; финальный audit SHA определяется отдельно. Результаты baseline не переносятся автоматически на другой commit.

- Applicability отражает план: Applicable now — тема текущего продукта, а не доказанная реализация каждого подпункта; Before production — проверка до запуска; At scale — проверка по нагрузочному триггеру; Owner decision required — сначала определить policy/target.
- Conditional требует presence gate: code/manifests/configuration на audit SHA и проверка runtime wiring без secrets. Redis, queues/workers, WebSocket/WSS, product AI, payments, replicas, Kubernetes, mobile и аналогичные компоненты остаются Conditional во всех строках, включая смешанные разделы с иной общей классификацией.
- В смешанной строке основная Applicability описывает общую тему; Decision сохраняет условность отдельных ветвей. Наличие Codex/MCP не доказывает product AI. Примеры архитектуры, credentials, endpoint и SQL не доказывают наличие соответствующей функции.
- После доказанного отсутствия компонента будущая disposition может стать `N/A — absence verified`: записать SHA, scope поиска, evidence и reviewer; затем Applicability = Not applicable, Planned stage = N/A. Сейчас отсутствие компонентов не проверялось: таких закрытий нет. Недостаток данных оставлять Conditional/Unknown.
- Already covered используется только для документированных governance-принципов 0 и 115; это не assurance продукта. Частичное baseline evidence отмечено в Decision, ни один широкий технический раздел не закрыт одним зелёным запуском.
- Planned stage задаёт основного владельца полного раздела. Wave 1 выполняет только ограниченные критические срезы по 04-WAVE-1-PLAN.md; соседние разделы не становятся полным дополнительным scope. Новые предложения ниже требуют отдельного согласования.
- Evidence method — будущий метод, не выполненная проверка: фиксировать SHA, paths/symbols, строки, commands/results, ограничения и независимый review. CodeGraph подтверждать кодом; при недоступности использовать поиск и раскрывать blind spots.
- Runtime/DB/fault/load проверки с записью — только в согласованной изолированной среде с synthetic data; не открывать secrets/PII и не выполнять разрушительные примеры master. BLOCKED не равен PASS или N/A.
- Responsible pass — роль, а не уже запущенный агент. Overlap сохраняет исходные номера: одна причина получает связанное evidence, а не дубли findings; registry изменяется отдельным разрешённым шагом после cross-review.

## Main mapping

| Source section | Topic | Applicability | Planned stage | Responsible pass | Evidence method | Overlap / related sections | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Главные принципы аудита | Already covered | Audit governance | Coordination/Synthesis | Сверить charter и AGENTS с принципами источника | 115,118,120 | Метод уже описан в charter; не означает проверку продукта |
| 1 | Формат каждого finding | Applicable now | Audit governance | Coordination/Synthesis | Сопоставить поля registry и требования traceability | 113,114,118,120 | Предложить расширения без правки registry |
| 2 | Карта архитектуры системы | Applicable now | Wave 1 Architecture | Architecture and Spaghetti Code | CodeGraph, исходники модулей, ownership и trust boundaries | 15,92,98,119 | Карта фактического кода; примеры deployment не целевая архитектура |
| 3 | Нефункциональные требования | Owner decision required | Audit governance | Coordination/Synthesis | Решение владельцев о нагрузке, бюджете, privacy и SLO | 23,81,105,106,107 | Согласовать измеримые цели; AI-метрики только Conditional |
| 4 | Сеть и Edge | Before production | Wave 3 DevOps/Production | DevOps/Production | Конфигурация фактической цепочки edge и безопасные сетевые пробы | 5,6,7,8,119 | До production; L4/L7/CDN/WAF выбирать по модели угроз |
| 5 | DNS и домен | Before production | Wave 3 DevOps/Production | DevOps/Production | DNS records, ownership и конфигурация выбранного домена | 4,6,7 | Проверить перед публикацией; email records только при email-домене |
| 6 | TLS / HTTPS / защищённые соединения | Before production | Wave 3 DevOps/Production | DevOps/Production | TLS endpoints и сертификаты всех подтверждённых hops | 4,7,28,75 | Не требовать mTLS везде; Redis/WSS hops Conditional |
| 7 | Нужно ли отбрасывать HTTP-трафик | Before production | Wave 3 DevOps/Production | DevOps/Production | Ingress/firewall config и отсутствие HTTP sensitive actions | 4,6,8 | Выбрать redirect/закрытый порт по deployment policy |
| 8 | Trusted Proxy Configuration | Conditional | Wave 3 DevOps/Production | DevOps/Production | Подтвердить proxy chain; проверить spoofed forwarded headers | 4,38,39 | Trusted proxy проверять при наличии proxy; не доверять headers автоматически |
| 9 | WAF / DDoS / Rate Limiting | Before production | Wave 3 DevOps/Production | DevOps/Production | Edge abuse model и согласованные probes лимитов | 38,44,50,56 | API limits в 38; отсутствие WAF-продукта не finding |
| 10 | Отдельный VPS / инфраструктура PostgreSQL | Before production | Wave 3 DevOps/Production | DevOps/Production | DB network/roles/pooling config, recovery evidence | 11,17,22,23,85 | Отдельный VPS/PgBouncer не обязательны; replicas Conditional |
| 11 | PostgreSQL — архитектура схем | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Prisma/schema/migrations, ownership, search_path | 12,13,15 | Проверить существующую модель; не навязывать несколько schemas |
| 12 | PK / FK / Constraints | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Constraints и delete semantics; synthetic DB checks | 19,20,100,121 | Полная ревизия Wave 2; критические нарушения из Wave 1 передать сюда |
| 13 | Нормализация БД | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Схема, функциональные зависимости и бизнес-инварианты | 11,14,104 | Нормализацию оценивать по смыслу данных |
| 14 | Избыточность данных | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Derived fields, write paths и snapshot contracts | 13,104,121 | Не удалять избыточное поле без проверки snapshot-семантики |
| 15 | Циклы в БД и доменной модели | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | FK graph, каскады и доменные циклы | 2,12,92 | DB детали Wave 2; архитектурные связи от Pass A |
| 16 | Индексы | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Index definitions, query plans на synthetic dataset | 17,18,105 | EXPLAIN ANALYZE только безопасно; индекс не обязан всегда выбираться |
| 17 | Query Performance | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Queries, plans, timings, locks и pool limits | 16,18,45,105 | Сначала ограниченные замеры; нагрузочные сценарии Later validation |
| 18 | N+1 Queries | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | ORM calls и количество SQL на bounded сценариях | 16,17,42 | Подтвердить N+1, не требовать DataLoader как технологию |
| 19 | Транзакции | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Transaction boundaries и partial failure tests | 20,104,121,123 | Полная DB ревизия позже; Wave 1 лишь критические цепочки |
| 20 | Isolation / Race Conditions / Concurrency | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Concurrent synthetic операции и isolation/locks | 19,41,122,123 | Согласовать безопасную БД; payments/jobs только Conditional |
| 21 | Миграции БД | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Migration history, drift, compatibility и CI | 12,19,96,97 | Baseline validate/generate не доказывает migrations; не применять к рабочей БД |
| 22 | Backup / Restore / PITR | Before production | Wave 3 DevOps/Production | DevOps/Production | Backup policy и изолированный restore с integrity checks | 23,89,99 | Рабочие dumps не читать; recovery rehearsal отдельное разрешение |
| 23 | RPO / RTO | Owner decision required | Audit governance | Coordination/Synthesis | Владельцы задают RPO/RTO; затем сопоставить с restore timings | 3,22,81,89 | Цели сейчас, фактическое восстановление до production |
| 24 | Кэширование | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | Inventory cache layers; TTL, keys и invalidation tests | 47,71,121 | Redis/CDN/cache наличие ещё не доказано; не внедрять ради checklist |
| 25 | Password Hashing | Applicable now | Wave 1 Security | Security and Data Integrity | Password hash/verify code и synthetic negative tests | 26,29,58 | Проверить безопасность существующего алгоритма, не навязывать замену |
| 26 | Salt / Pepper | Applicable now | Wave 1 Security | Security and Data Integrity | Library salt handling и параметры hash | 25,29 | Salt проверить; pepper является условным механизмом |
| 27 | Обезличивание данных | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Serializers/export/logging paths на synthetic data | 28,77,99,100 | Отличать masking от anonymization; не читать PII |
| 28 | Шифрование данных | Before production | Wave 3 DevOps/Production | DevOps/Production | Классификация данных и выбранные encryption controls | 6,22,29,99 | Field encryption и KMS по риску; не требовать конкретный продукт |
| 29 | Хранение ключей и секретов | Applicable now | Wave 1 Security | Security and Data Integrity | Secret handling code и безопасные redacted scan результаты | 58,61,77,96 | Не открывать реальные secrets; Vault/KMS Conditional |
| 30 | REST API — базовая архитектура | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Routes/controllers и API resource contracts | 31,33,48,49 | Сверять фактическую модель; RPC-команды не дефект сами по себе |
| 31 | HTTP Methods | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Routes и synthetic method/side-effect проверки | 32,41,122 | Проверять HTTP semantics, без автоматической смены API |
| 32 | HTTP Status Codes | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Responses и contract tests ошибок/успеха | 31,34,49 | Сверить коды с контрактами и условиями |
| 33 | API Versioning | Owner decision required | Wave 2 Backend/API/Database | Backend/API/Database | Consumer inventory и история breaking changes | 30,49 | Решить стратегию совместимости; /v1 не обязательный формат |
| 34 | Единый формат ошибок API | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Error filters и безопасные negative responses | 32,36,50,77 | Единый contract; security disclosure сообщить Pass C |
| 35 | Input Validation | Applicable now | Wave 1 Security | Security and Data Integrity | Validation paths и bounded malicious synthetic inputs | 36,44,50,117 | Выборка критического ввода/files; WSS/webhooks Conditional |
| 36 | Output Validation / DTO | Applicable now | Wave 1 Security | Security and Data Integrity | DTO/serializer boundaries и cross-user response assertions | 34,37,70,73 | Проверить отсутствие лишних данных, не выводить реальные значения |
| 37 | Authentication vs Authorization | Applicable now | Wave 1 Security | Security and Data Integrity | Guards, owner checks и deny matrix | 50,68,70,73,101 | AuthN отдельно от AuthZ; RBAC/ABAC механизм не навязывать |
| 38 | Rate Limiting API | Applicable now | Wave 1 Security | Security and Data Integrity | Limiter config/code и bounded abuse probes | 8,9,44,56 | Критические REST endpoints; edge и WSS позже |
| 39 | CORS | Applicable now | Wave 2 Frontend | Frontend | CORS config и synthetic origin/preflight checks | 40,53,74 | Frontend/backend boundary, не считать CORS authorization |
| 40 | CSRF | Conditional | Wave 2 Frontend | Frontend | Подтвердить ambient cookie auth; проверить cross-site requests | 39,53,74 | CSRF-модель зависит от transport credentials, JWT не решает её автоматически |
| 41 | Idempotency | Applicable now | Cross-cutting Consistency/Idempotency | Consistency/Idempotency | Повтор commands и side-effect contracts | 20,46,91,122,123 | Объединить evidence с 122; key не обязателен для каждого POST |
| 42 | Pagination | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Collection routes, bounds и pagination query plans | 16,17,18,43 | Cursor выбирать по данным, не как обязательный rewrite |
| 43 | Filtering / Sorting | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Query validation и ORM/SQL parameterization | 35,42,50 | Проверить allowlists и bounded sorting/filtering |
| 44 | Request Limits | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Body/file/header/depth limits и bounded rejection checks | 35,38,45,56 | Критические upload риски Pass C; полная матрица позже |
| 45 | API Timeouts | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Request/DB timeout paths и synthetic timeout handling | 17,46,87 | AI/worker/provider ветви Conditional |
| 46 | Retry Policy | Applicable now | Cross-cutting Consistency/Idempotency | Consistency/Idempotency | Retry call sites, backoff и duplicate side effects | 41,45,87,122 | Проверять имеющиеся retries; не внедрять их автоматически |
| 47 | REST API Caching | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | Подтвердить cache semantics; headers и private-data isolation | 24,71,121 | ETag/CDN необязательны; подтвердить применимость |
| 48 | OpenAPI | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | Наличие OpenAPI и сверка с routes/DTO | 30,34,36,49 | Отсутствие OpenAPI само по себе не finding; owner решает необходимость |
| 49 | API Contracts и обратная совместимость | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Frontend/backend contract comparison и nullable/formats | 30,33,48,95 | Schema diff/contract tooling лишь Candidate до оценки пользы |
| 50 | OWASP API Security | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Threat-based API coverage matrix и negative checks | 35,37,38,73,98 | Полная OWASP-карта Wave 2; не дублировать критическую выборку Wave 1 |
| 51 | WebSocket / WSS Security | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | Подтвердить WSS endpoints и auth/message pipeline | 52,53,54,55,56,57,72 | Conditional; после presence gate отдельное backend/security задание |
| 52 | WSS — сценарии несанкционированного доступа | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | WSS presence gate и synthetic credential/origin matrix | 51,63,70,72,117 | Без WSS не запускать и не считать пробел дефектом |
| 53 | Cross-Site WebSocket Hijacking | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | WSS presence gate; Origin/cookie handshake tests | 39,40,51 | Не переносить handshake-проверку на отсутствующую технологию |
| 54 | Message-Level Authorization | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | Message handlers и ownership на synthetic resources | 37,51,73 | Проверять каждое действие после подтверждения WSS |
| 55 | WebSocket Authentication Ticket | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | WSS auth mechanism, TTL и replay tests | 51,58,122 | Ticket лишь вариант; отсутствие ticket не finding |
| 56 | WSS DoS / Resource Protection | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | WSS connection/message limits и bounded load probes | 9,38,44,105 | Не проводить DoS; нагрузка только изолированно |
| 57 | WebSocket Compression | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | WSS compression config и оценка ресурсов/риска | 51,56 | Compression и отключение требуют применимости, без изменения config |
| 58 | Полный Token Inventory | Applicable now | Wave 1 Security | Security and Data Integrity | Inventory типов credentials по code/schema, без значений | 29,59,60,61,63 | Только существующие типы; OAuth/MFA/WS ticket Conditional |
| 59 | JWT Claims Audit | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | JWT validators, claims policy и synthetic malformed tokens | 58,60,61,69 | Детальная claims-матрица после первичного session review |
| 60 | Access Token vs Refresh Token | Applicable now | Wave 1 Security | Security and Data Integrity | Access/refresh validators и wrong-type negative tests | 58,59,62 | Проверить различение типов без требования поля token_use |
| 61 | JWT alg / kid / signing key audit | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Algorithm allowlist и key selection code; synthetic tokens | 29,58,59 | JWKS/kid/rotation mechanisms по фактическому наличию |
| 62 | Refresh Token Rotation | Applicable now | Wave 1 Security | Security and Data Integrity | Atomic refresh rotation и reuse policy tests | 20,60,63,64,122 | Критическая rotation chain; не навязывать структуру family fields |
| 63 | Stale / Revoked Credential Audit | Applicable now | Wave 1 Security | Security and Data Integrity | Stale/revoked credential policy и REST deny tests | 64,65,66,68,70,72 | Сводный security scenario; WSS ветвь Conditional |
| 64 | Старый Refresh Token после logout | Applicable now | Wave 1 Security | Security and Data Integrity | Logout затем refresh на synthetic session | 62,63,122 | Повторно использовать evidence 63, отдельно сохранить traceability |
| 65 | Старый Access Token после logout | Applicable now | Wave 1 Security | Security and Data Integrity | Access после logout vs ожидаемая revocation policy | 63,66,67 | Stateless TTL trade-off требует решения, не автоматический finding |
| 66 | Server-Side Session State | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Session validation code/schema и state transitions | 62,63,65,67 | Проверить существующий механизм; отдельная session table не догма |
| 67 | auth_version / security version | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | Наличие security version либо эквивалента; invalidation tests | 65,66,68 | auth_version необязателен; цель — policy, не поле |
| 68 | Старые токены после изменения прав | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Permission/status changes и synthetic stale claims tests | 37,63,69,101 | MFA/admin-сценарии только при наличии; не терять deny policy |
| 69 | Минимизация JWT Payload | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | JWT payload generation и minimal-data contract | 36,58,59,68 | Проверять имена полей/synthetic payload без реальных токенов |
| 70 | `/me` / Profile Security Matrix | Applicable now | Wave 1 Security | Security and Data Integrity | Bounded /me/profile credential и owner matrix | 36,37,63,73,117 | Критические существующие endpoints; не создавать subscription/dialog API |
| 71 | Cache + Old Credentials | Conditional | Cross-cutting Consistency/Idempotency | Consistency/Idempotency | Presence gate cache; revocation/invalidation paths | 24,47,63,72,121 | Redis/WSS/local cache по подтверждению, не предполагать наличие |
| 72 | Existing WSS после logout | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | WSS presence gate и logout/block connection lifecycle | 51,52,63,71,121 | Проверка только при WSS; отсутствие не finding |
| 73 | Получение данных другого пользователя | Applicable now | Wave 1 Security | Security and Data Integrity | Synthetic user A/B resource ownership checks | 37,50,70,117 | REST и files в выборке; WSS и optional resources Conditional |
| 74 | Browser / JavaScript Security | Applicable now | Wave 2 Frontend | Frontend | DOM/storage/bundle code и synthetic browser checks | 39,40,75,102 | Полная browser security после Wave 1; не читать реальные cookies |
| 75 | Security Headers | Applicable now | Wave 2 Frontend | Frontend | Headers config и безопасные response probes | 6,39,74 | Deployment overrides/TLS повторить перед production |
| 76 | Observability — три сигнала | Before production | Wave 3 DevOps/Production | DevOps/Production | Inventory telemetry и корреляция synthetic запросов | 77,78,79,80 | OTel/Prometheus/Grafana не обязательны как продукты |
| 77 | Structured Logging | Applicable now | Wave 3 DevOps/Production | DevOps/Production | Logging call sites и synthetic redacted events | 29,74,76,99 | Не читать реальные логи с PII; disclosure из Wave 1 передать сюда |
| 78 | Метрики | Before production | Wave 3 DevOps/Production | DevOps/Production | Metric definitions, cardinality и synthetic signals | 76,79,80,82 | Queue/cache/AI метрики Conditional |
| 79 | Визуализация | Before production | Wave 3 DevOps/Production | DevOps/Production | Dashboard coverage по согласованным SLI | 76,78,80,81 | Grafana или иной способ; отсутствие бренда не defect |
| 80 | Alerting | Before production | Wave 3 DevOps/Production | DevOps/Production | Alert rules и безопасные synthetic trigger/runbook checks | 22,76,78,88 | Только actionable signals существующих компонентов |
| 81 | SLI / SLO / SLA | Owner decision required | Audit governance | Coordination/Synthesis | Решение о SLI/SLO/SLA и измеримости обязательств | 3,23,78,82,106 | Не брать проценты доступности из примеров |
| 82 | Percentiles | At scale | Later validation | Later validation | Репрезентативные latency samples и percentile calculation | 17,78,81,105 | Высокие перцентили лишь при достаточном объёме |
| 83 | Health Checks | Before production | Wave 3 DevOps/Production | DevOps/Production | Readiness/liveness code/config и failure simulation | 84,85,87 | Не требовать Kubernetes probes без Kubernetes |
| 84 | Graceful Shutdown | Before production | Wave 3 DevOps/Production | DevOps/Production | Lifecycle hooks и isolated stop/drain rehearsal | 83,86,87,90 | WSS/jobs только Conditional; рабочие процессы не останавливать |
| 85 | Orchestration | Conditional | Wave 3 DevOps/Production | DevOps/Production | Inventory deployment/orchestrator и эксплуатационные требования | 3,83,86,97,115 | Compose из baseline — частичное evidence; Kubernetes/systemd не обязательны |
| 86 | Delivery Strategies | Before production | Wave 3 DevOps/Production | DevOps/Production | Release/rollback plan и isolated deployment rehearsal | 21,84,96,97 | Canary/blue-green/flags выбирать по риску, не внедрять автоматически |
| 87 | Resilience / Failure Modes | Before production | Wave 3 DevOps/Production | DevOps/Production | Fault matrix существующих зависимостей и isolated probes | 19,45,46,89,123 | Redis/AI/queue failures Conditional; circuit breaker не самоцель |
| 88 | Incident Response | Before production | Wave 3 DevOps/Production | DevOps/Production | Owners/runbooks и tabletop incident exercise | 23,29,80,89 | Процедуры определить до production, не объявлять готовыми по документу |
| 89 | Recovery Drills | Before production | Later validation | Later validation | Согласованный isolated restore/recovery rehearsal | 22,23,87,88 | Destructive примеры master не разрешение удалять БД |
| 90 | Очереди и фоновые задачи | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | Presence gate workers/queues; retry/ACK/replay evidence | 46,87,121,122 | Не требовать очередь ради email/images; при отсутствии N/A только с evidence |
| 91 | Webhook Security | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | Presence gate webhooks; signature/timestamp/replay tests | 35,41,46,122 | Payments/provider необязательны; проверять только существующие hooks |
| 92 | Code Quality Audit | Applicable now | Wave 1 Architecture | Architecture and Spaghetti Code | CodeGraph плюс код: coupling, duplication и side effects | 2,15,30,104,115 | Нет findings по длине; dependency absence требует полного evidence |
| 93 | Test Quality Audit | Applicable now | Wave 1 Testing | Test Reliability | Assertions, mocks, fixtures и regression protection | 94,95,117 | Качество выборки, а не число зелёных тестов |
| 94 | Mutation / Fault Injection для тестов | Conditional | Later validation | Later validation | Оценка мутаций Pass B; scoped isolated mutation/fault test | 93,95,117,123 | Исполнение только после отдельного безопасного scope; baseline код не менять |
| 95 | Типы тестов | Applicable now | Wave 1 Testing | Test Reliability | Scripts/suites matrix и gaps по критическим invariants | 21,93,94,117 | Baseline покрывает запуск частично; не все категории обязательны |
| 96 | Secure SDLC | Applicable now | Wave 3 DevOps/Production | DevOps/Production | CI/review permissions, manifests и safe scanning evidence | 21,29,86,97 | Baseline не доказывает supply chain; SBOM/signing оценить по риску |
| 97 | Infrastructure as Code | Applicable now | Wave 3 DevOps/Production | DevOps/Production | Compose и actual infra definitions vs environment claims | 10,21,85,96 | Terraform/Ansible/Kubernetes Conditional, не требовать все инструменты |
| 98 | Threat Modeling | Applicable now | Wave 1 Security | Security and Data Integrity | Asset/entry/trust-boundary matrix критических flows | 2,37,50,99 | Ограничить Wave 1 auth/profile/media; остальное в профильные волны |
| 99 | Privacy / Data Lifecycle | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Data lifecycle по schema/serializers/deletion paths | 27,28,77,100 | Полный retention/export/processors позже; PII примеры synthetic |
| 100 | Удаление аккаунта end-to-end | Applicable now | Wave 2 Backend/API/Database | Backend/API/Database | Deletion workflow и synthetic failure/retry checks | 12,63,99,121,122 | Wave 1 проверяет критические revoke/owner риски; optional stores Conditional |
| 101 | Admin / Privileged Access | Conditional | Wave 2 Backend/API/Database | Backend/API/Database | Presence gate admin routes/roles; privilege tests | 37,68,98 | Admin/MFA/break-glass механизмы не предполагать существующими |
| 102 | Frontend / Mobile Security & Reliability | Conditional | Wave 2 Frontend | Frontend | Web states, requests/storage и bounded browser scenarios | 62,74,75,103,122 | Web часть Applicable now по baseline; mobile/deep-link ветвь Conditional |
| 103 | Accessibility | Owner decision required | Wave 2 Frontend | Frontend | Согласовать accessibility target; keyboard/semantics/contrast QA | 102,106 | Не назначать WCAG уровень без решения; проверка базовой доступности планируется |
| 104 | Business Invariants / State Machines | Applicable now | Cross-cutting Consistency/Idempotency | Consistency/Idempotency | Domain states и invariant-to-write/test matrix | 12,19,20,100,121,122 | State-machine контракт, не требование state-machine framework |
| 105 | Performance / Capacity Planning | At scale | Later validation | Later validation | Нагрузочная модель и isolated capacity measurements | 3,16,17,82,106,107 | Числа пользователей из master — примеры; AI/queue нагрузка Conditional |
| 106 | Performance Budgets | Owner decision required | Audit governance | Coordination/Synthesis | UX/SLO и согласование performance budgets | 3,81,102,105,107 | Цели перед измерениями; AI latency Conditional |
| 107 | Cost Control | Owner decision required | Wave 3 DevOps/Production | DevOps/Production | Бюджет владельцев и cost model выбранных компонентов | 3,76,105,106,108 | AI/token расходы Conditional; не заявлять реальные расходы без данных |
| 108 | AI / LLM Audit | Conditional | Later validation | Later validation | Presence gate product AI; provider/prompt/output inventory | 109,110,111 | Codex tooling не доказательство product AI; отдельное задание при наличии |
| 109 | AI Security | Conditional | Later validation | Later validation | AI presence gate и synthetic injection/tool threat tests | 98,108,110,111 | Не объявлять LLM safety gap при отсутствии product AI |
| 110 | AI Evals | Conditional | Later validation | Later validation | AI presence gate; approved synthetic eval set и metrics | 93,105,108,109 | Создание eval suite — отдельная задача, не действие mapping |
| 111 | AI Agent Permissions | Conditional | Later validation | Later validation | AI tools inventory и server-side policy tests | 37,98,108,109 | Product agents не равны audit sub-agents; не внедрять agents |
| 112 | Documentation Audit | Applicable now | Wave 3 Documentation | Documentation | Claims-to-code/commit links и drift review | 0,48,113,114 | Документы не доказательство реализации; только предложения правок |
| 113 | Metadata для ключевых Markdown-документов | Owner decision required | Wave 3 Documentation | Documentation | Сравнить metadata и update triggers существующих документов | 1,112,114 | Формат metadata согласовать, не массово переписывать Markdown |
| 114 | Долговременная инженерная база знаний | Applicable now | Wave 3 Documentation | Documentation | Traceability accepted decisions к evidence/review/ADR | 1,112,113,118 | Знания только после review; WSS/AI/runbooks по применимости |
| 115 | Что не считать обязательным без доказательства | Already covered | Audit governance | Coordination/Synthesis | Сверить charter best-practice acceptance и ограничения | 0,3,85,92,119 | Принцип уже описан; не означает доказанное отсутствие overengineering |
| 116 | Приоритет аудита Yuni | Applicable now | Audit governance | Coordination/Synthesis | Согласовать mapping с Wave 1 и дальнейшими scope | 2,93,98,118,120 | Приоритеты master адаптировать; условные блоки не включать автоматически |
| 117 | Критические security-тесты, которые должны существовать | Applicable now | Wave 1 Testing | Test Reliability | Traceability critical scenarios к assertions/code | 35,37,62,70,73,95 | Выборка auth/user-data/DB; WSS Conditional, полная матрица позже |
| 118 | Финальное требование для мощной модели | Applicable now | Audit governance | Coordination/Synthesis | Сверить deliverables, разрешённые checks и evidence coverage | 0,1,114,120 | Создание тестов/исправления только отдельным scope, master не разрешение |
| 119 | Итоговая целевая карта production-архитектуры для проверки | Owner decision required | Wave 3 DevOps/Production | DevOps/Production | Reference diagram vs требования и фактическая topology | 2,3,4,85,108,115 | Redis/AI/WSS/queue Conditional; схема не обязательная production-архитектура |
| 120 | Definition of Done для аудита | Applicable now | Audit governance | Coordination/Synthesis | Coverage/disposition matrix по всем завершённым passes | 1,95,116,118,124 | DoD учитывает BLOCKED/Conditional/N/A, не требует внедрить технологии |
| 121 | Consistency Audit — проверка консистентности данных | Applicable now | Cross-cutting Consistency/Idempotency | Consistency/Idempotency | Cross-table/read-after-write/state invariants и partial failure matrix | 12,19,20,24,71,104,123 | Отдельный cross-cutting pass; cache/replicas/queue/WSS/providers Conditional |
| 122 | Idempotency Audit — проверка идемпотентности | Applicable now | Cross-cutting Consistency/Idempotency | Consistency/Idempotency | Retry/replay/concurrent operation contracts и synthetic checks | 20,41,46,62,90,91,100,123 | Отдельный cross-cutting pass; payments/AI/mobile/queue Conditional |
| 123 | Consistency + Idempotency Combined Failure Matrix | Applicable now | Cross-cutting Consistency/Idempotency | Consistency/Idempotency | Матрица операций: retry, concurrency, partial failure, expected invariant | 19,20,87,104,121,122 | Примеры payment/AI/webhook не доказывают наличие; gate каждую колонку |
| 124 | Дополнение к Definition of Done | Applicable now | Cross-cutting Consistency/Idempotency | Consistency/Idempotency | Проверить evidence/disposition каждого применимого cross-cutting DoD | 120,121,122,123 | Закрывать после отдельного review; неподтверждённое отсутствие не N/A |

## Mapping statistics

Всего: **125** строк данных; каждый раздел учитывается один раз по основному назначению. Нулевые категории сохранены; числа не являются результатами аудита.

### Applicability

| Applicability | Count |
| --- | ---: |
| Applicable now | 69 |
| Conditional | 25 |
| Before production | 18 |
| At scale | 2 |
| Owner decision required | 9 |
| Not applicable | 0 |
| Already covered | 2 |

### Planned stage

| Planned stage | Count |
| --- | ---: |
| Audit governance | 10 |
| Baseline | 0 |
| Wave 1 Architecture | 2 |
| Wave 1 Testing | 3 |
| Wave 1 Security | 16 |
| Wave 2 Backend/API/Database | 45 |
| Wave 2 Frontend | 6 |
| Wave 3 DevOps/Production | 24 |
| Wave 3 Documentation | 3 |
| Cross-cutting Consistency/Idempotency | 8 |
| Later validation | 8 |
| N/A | 0 |

### Responsible pass

| Responsible pass | Count |
| --- | ---: |
| Coordination/Synthesis | 10 |
| Baseline | 0 |
| Architecture and Spaghetti Code | 2 |
| Test Reliability | 3 |
| Security and Data Integrity | 16 |
| Backend/API/Database | 45 |
| Frontend | 6 |
| DevOps/Production | 24 |
| Documentation | 3 |
| Consistency/Idempotency | 8 |
| Later validation | 8 |
| N/A | 0 |

Wave 1: **21/125** основных назначений; остальные **104** не назначены первой волне. Это распределение тем, не оценка трудозатрат.

## Proposed changes to existing audit documents

Предложения ниже не внесены в другие документы и не являются findings или принятыми best practices.

### 03-FINDINGS.md

- Добавить `Source checklist sections` (включая subsection IDs), `Source input SHA256`, `Applicability / presence evidence`, `Verification disposition` (PASS/FAIL/BLOCKED/SKIPPED/N/A — absence verified отдельно от lifecycle), `Last verified SHA / environment / date` и `Recheck trigger`.
- Добавить `Remediation horizon` (now/before production/at scale), `Minimal fix / Target fix`, `Dependencies / effort estimate`, `Decision owner` и явные `Invariant / failure or attack scenario / likelihood`. Не дублировать уже имеющиеся risk, confidence, acceptance criteria, tests required и documentation impact: расширить их структуру.
- Сохранить стабильные ID, существующие lifecycle-статусы и разделение Confirmed/Inferred/Unknown. `Accepted risk`/trade-off фиксировать с owner, сроком/триггером пересмотра, не путать с исправлением Verified.

### Assurance Register

Предлагается отдельный Assurance Register для доказанно корректных ограниченных областей; не создавать его в этой задаче. Поля: assurance ID, invariant/scope, checklist IDs, checked SHA/environment/date, code/test/runtime evidence, negative controls, coverage limits, reviewer, valid-until/recheck triggers, related findings.
Assurance действует только для проверенных условий и версии. Отсутствие finding, наличие технологии, зелёный тест или N/A не являются assurance; изменённые зависимости/контракты требуют recheck. Отдельно хранить coverage/disposition неподтверждённых и отсутствующих компонентов.

### Wave 1: уточнения без расширения до полного master

- Pass A: фактическая карта модулей, data flow/trust boundaries и inventory условных компонентов из 2/92; не строить целевую production-архитектуру из 119.
- Pass B: ограниченная выборка assertions/false positives и traceability auth/owner/rollback сценариев из 93/95/117. Из 94 включить только оценку возможности mutation testing; исполнение — Later validation с отдельным разрешением.
- Pass C: единая bounded auth/session матрица 58/60/62–65/70/73 вместо повторения каждой проверки в отдельных отчётах; определить ожидаемую revocation policy. Сохранить input/files/serializer/rate-limit и критические data-integrity срезы действующего плана.
- Из 121–124 передавать только обнаруженные критические invariants и вопросы в backlog отдельного Consistency/Idempotency pass. Не переносить всю failure matrix в Wave 1. После первичного независимого анализа связать ARCH/TEST/SEC кандидатов на cross-review.
- До запуска координатор задаёт конкретные workflows/paths, границы выборки, безопасные команды и критерии остановки. Новые разделы не являются автоматическим разрешением дополнительных тестов или записи.

### Последующие волны

- Wave 2 Backend/API/Database: полные schema/constraints/migrations/query и REST/contract matrices, детальные token cases и data lifecycle/deletion. WSS/webhooks/admin/cache проверять после presence gate.
- Wave 2 Frontend: browser/storage/CORS/CSRF, UI loading/error/empty/offline, accessibility и contract consistency; mobile часть только Conditional.
- Отдельный Consistency/Idempotency pass: 121–124 вместе с 41/46/71/104; начать после inventory критических workflows, повторно использовать evidence Wave 1/2, отдельно проверить retries/concurrency/partial writes и условные интеграции.
- Wave 3 DevOps/Production: edge/TLS/DNS, secrets delivery, CI/supply chain, deploy/recovery/telemetry. Известные локальные CI/config темы можно анализировать раньше, но отсутствие ещё не выбранной production topology не finding.
- Wave 3 Documentation: claims/metadata/ADR/engineering memory только после evidence. Later validation: scoped mutation, restore drills, load/capacity и AI-проверки при подтверждённом product AI.
- Best-practice кандидаты оцениваются по пользе, альтернативам и операционной стоимости; реализация и будущая production-архитектура требуют отдельных owner решений.

### Решения Валеры и Жени

- Утвердить финальный audit SHA/tag, отдельные pass scopes, границы runtime/DB/mutation/load/recovery окружений и владельца cross-cutting направления.
- Определить аудитируемые функции и presence gates для Redis/queues/WSS/AI/payments/replicas/Kubernetes/mobile; не включать их в архитектуру ради checklist.
- Согласовать NFR, бюджеты, SLI/SLO, RPO/RTO, нагрузочные триггеры, production topology и эксплуатационную ответственность (3/23/81/105–107/119).
- Уточнить logout/revocation/role-change policy, consistency/retry contracts и допустимые временные окна; не навязывать instant revoke, auth_version или Idempotency-Key как универсальные механизмы.
- Определить privacy/retention/export/deletion и внешних processors, API compatibility/versioning, accessibility target и необходимые admin controls.
- Принять либо отклонить поля registry, отдельный Assurance Register, metadata conventions и критерии завершения при BLOCKED/Conditional; исходник остаётся immutable, изменения политики оформляются отдельно.

## Completeness validation

Программная проверка основного mapping выполнена по первому столбцу между `## Main mapping` и `## Mapping statistics`; числа в overlap и тексте не считаются строками разделов.

- Исходные заголовки сопоставлены по выражению `^# (\d+)\. (.+)$`: 125, последовательность 0–124.
- Строк данных основной таблицы: **125**; уникальных Source section: **125**.
- Все номера 0–124 присутствуют ровно один раз; пропущенные: **нет**, дубли: **нет**, номера вне диапазона: **нет**.
- Topic каждой строки совпадает с исходным заголовком; все восемь колонок заполнены. Applicability/Planned stage проверены по разрешённым значениям.
- Разделы 121–124 имеют Planned stage `Cross-cutting Consistency/Idempotency` и Responsible pass `Consistency/Idempotency`.
- Статистика каждой из трёх групп рассчитана из основной таблицы; сумма каждой группы — **125**.
- SHA256 исходника повторно совпадает с указанным immutable input hash. Проверка подтверждает полноту mapping, не полноту или результат технического аудита.

Для повторной проверки: извлечь строки первого столбца, сравнить отсортированный список с `list(range(125))`, проверить `Counter` каждого ID равным 1, сверить Topic с заголовками исходника и пересчитать группировки колонок 3–5.
