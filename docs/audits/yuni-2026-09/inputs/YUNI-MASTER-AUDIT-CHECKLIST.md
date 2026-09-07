# Yuni — Master Technical, Security & Production Audit Checklist

> Единый master-файл для комплексного технического аудита проекта Yuni.
>
> Цель: не просто найти ошибки, а проверить фактическую корректность архитектуры, безопасности, данных, API, тестов, AI-компонентов и production-инфраструктуры, а затем превратить выводы в долговременную инженерную базу знаний проекта.

---

# 0. Главные принципы аудита

Аудит должен проверять не только наличие технологий, конфигураций и тестов, но и **фактическую корректность их работы**.

Обязательные правила:

- Не считать документацию источником истины без сверки с кодом.
- Не считать прохождение тестов доказательством качества тестов.
- Не считать высокий coverage доказательством корректности.
- Не считать наличие HTTPS доказательством защищённого канала на всей цепочке.
- Не считать криптографически валидный JWT автоматически действующей авторизованной сессией.
- Не считать успешный WebSocket-handshake разрешением на все дальнейшие сообщения.
- Не считать backup рабочим, пока не выполнен успешный restore-test.
- Не считать Kubernetes, Redis, Kafka, microservices, CQRS, Event Sourcing или multi-region обязательными без доказанной необходимости.
- Не добавлять архитектурную сложность без измеримой проблемы, которую она решает.
- Для каждого вывода предоставлять доказательство из кода, конфигурации, БД, тестов или инфраструктуры.
- Все устойчивые архитектурные решения, инварианты, риски и практики сохранять в Markdown-базе знаний проекта.

---

# 1. Формат каждого finding

Для каждого обнаруженного вопроса использовать единый формат:

```text
Finding ID:
Область:
Severity:
Confidence:

Что обнаружено:
Доказательство:
Файл / строки / конфигурация / SQL / endpoint:

Сценарий отказа или атаки:
Вероятность:
Последствия:

Корневая причина:

Минимальное исправление:
Целевое исправление:

Acceptance criteria:
Какой тест должен подтвердить исправление:

Приоритет:
Сейчас / перед production / при масштабировании / не требуется

Зависимости:
Оценка сложности:
Документация, которую нужно обновить:
```

Также фиксировать **доказанно корректные области**, чтобы следующий аудит не выполнял ту же работу заново.

---

# 2. Карта архитектуры системы

Построить фактическую архитектуру Yuni.

Пример целевой карты:

```text
Пользователь
   ↓
Web / Mobile Client
   ↓
DNS
   ↓
CDN / WAF
   ↓
L4/L7 Load Balancer / Reverse Proxy
   ↓
REST API / WSS
   ↓
Application Modules
   ├── Authentication
   ├── User / Profile
   ├── Dialog
   ├── Path / Progress
   ├── AI
   ├── Notifications
   └── Admin
   ↓
PostgreSQL / Redis / Queue / Object Storage / External AI
```

Проверить:

- какие модули существуют фактически;
- какие зависимости существуют между ними;
- кому принадлежит каждая бизнес-сущность;
- нет ли циклических зависимостей;
- нет ли shared/global-логики, которую меняют разные части приложения;
- не дублируются ли бизнес-правила;
- соответствует ли код архитектурным документам;
- является ли проект модульным монолитом, микросервисами или случайной смесью;
- есть ли преждевременное дробление на сервисы;
- есть ли god modules / god services / god controllers.

Зафиксировать минимум:

1. System Context.
2. Containers / Deployment.
3. Components / Modules.
4. Data Flow.
5. Trust Boundaries.

---

# 3. Нефункциональные требования

Для проекта явно определить:

```text
Expected users
Expected concurrent users
Requests/sec
Peak requests/sec
Availability target
Latency target
p50
p95
p99
RPO
RTO
Expected DB growth
Expected log growth
AI requests/minute
Monthly infrastructure budget
Privacy requirements
Security requirements
```

Без этого нельзя доказательно решать, нужен ли Kubernetes, Redis, отдельный DB-кластер или multi-region.

---

# 4. Сеть и Edge

## 4.1 L4 и L7 балансировка

Проверить необходимость L4 и/или L7.

### L4

Transport layer:

- TCP/UDP;
- высокая производительность;
- не анализирует HTTP;
- может использоваться для PostgreSQL, Redis, TCP-сервисов.

### L7

Application layer:

- HTTP/HTTPS;
- понимает Host, URL, headers, cookies;
- routing;
- rate limiting;
- TLS termination;
- WAF;
- sticky sessions при необходимости;
- canary routing.

Пример:

```text
Internet
   ↓
CDN / WAF
   ↓
L7 Load Balancer / Reverse Proxy
   ↓
Backend replicas
```

Отдельно проверить внутренние L4-сервисы.

---

# 5. DNS и домен

Проверить:

- основной домен;
- `www`;
- `api`;
- `admin`;
- `assets`;
- wildcard DNS при необходимости;
- DNS provider;
- DNSSEC;
- CAA;
- TTL;
- failover;
- защита origin IP;
- CDN;
- email-записи:
  - SPF;
  - DKIM;
  - DMARC.

Пример:

```text
domain.com
www.domain.com
api.domain.com
admin.domain.com
assets.domain.com
```

---

# 6. TLS / HTTPS / защищённые соединения

Проверить всю цепочку передачи данных, а не только браузер → edge.

```text
Client
  ↓ HTTPS
CDN / WAF / LB
  ↓ HTTPS
Reverse Proxy / Ingress
  ↓ HTTPS или mTLS
Backend
  ↓ TLS
PostgreSQL / Redis / другие сервисы
```

Проверить:

- TLS 1.2/1.3;
- актуальные cipher suites;
- валидные сертификаты;
- Let's Encrypt / ACME;
- автоматическое renewal;
- мониторинг срока сертификата;
- HSTS;
- HTTP → HTTPS redirect;
- TLS termination;
- повторное шифрование после Load Balancer;
- internal TLS;
- PostgreSQL TLS при необходимости;
- Redis TLS или строго private network;
- `wss://` вместо `ws://`;
- отсутствие API keys / access tokens / refresh tokens в URL;
- `Secure`, `HttpOnly`, `SameSite` cookies.

---

# 7. Нужно ли отбрасывать HTTP-трафик

Проверить выбранную стратегию.

Обычный вариант:

```text
HTTP :80
   ↓
301 / 308
   ↓
HTTPS :443
```

Для API:

- HTTP не должен выполнять чувствительные действия;
- допустим только redirect;
- либо порт 80 полностью закрыт.

Пример внешнего firewall:

```text
22    SSH — ограниченный доступ
80    redirect only
443   HTTPS
```

PostgreSQL и Redis не должны быть доступны интернету:

```text
Internet → PostgreSQL  ❌
Backend  → PostgreSQL  ✅
```

---

# 8. Trusted Proxy Configuration

Если есть Cloudflare / LB / reverse proxy:

```text
Cloudflare
   ↓
Load Balancer
   ↓
Application
```

проверить доверие к:

```text
X-Forwarded-Proto
X-Forwarded-For
X-Real-IP
Forwarded
```

Нельзя доверять proxy headers от любого клиента.

Проверить trusted proxy allowlist.

---

# 9. WAF / DDoS / Rate Limiting

Проверить:

- WAF;
- DDoS protection;
- per-IP rate limits;
- per-user rate limits;
- per-session rate limits;
- endpoint-specific limits;
- expensive endpoint protection;
- AI endpoint limits;
- login brute-force protection;
- password reset abuse protection;
- API scraping.

---

# 10. Отдельный VPS / инфраструктура PostgreSQL

Рассмотреть схему:

```text
VPS / Node 1
Application

VPS / Node 2
PostgreSQL

VPS / Node 3
Observability / Logs
```

Проверить:

- private network;
- firewall;
- закрытый `5432`;
- отдельный application DB user;
- запрет использования superuser приложением;
- TLS;
- connection pooling;
- PgBouncer;
- `max_connections`;
- backup;
- WAL;
- PITR;
- replication при необходимости;
- failover;
- disaster recovery.

---

# 11. PostgreSQL — архитектура схем

Проверить фактическую структуру.

Пример:

```text
PostgreSQL
├── auth
│   ├── users
│   ├── sessions
│   └── credentials
├── core
│   ├── profiles
│   ├── paths
│   └── progress
└── audit
    └── events
```

Проверить:

- оправданность схем;
- ownership;
- разграничение доступа;
- дублирование таблиц;
- дублирование сущностей;
- использование public schema;
- search_path;
- безопасность функций и процедур.

---

# 12. PK / FK / Constraints

Проверить:

```text
PRIMARY KEY
FOREIGN KEY
UNIQUE
NOT NULL
CHECK
```

Для FK проверить:

```text
ON DELETE CASCADE
ON DELETE RESTRICT
ON DELETE SET NULL
```

и семантику удаления.

Пример:

```sql
users
-----
id UUID PRIMARY KEY
```

Проверить UUID vs bigint с учётом:

- enumeration;
- distributed generation;
- индексного размера;
- производительности.

---

# 13. Нормализация БД

Проверить минимум:

- 1NF;
- 2NF;
- 3NF.

Но не требовать максимальной нормализации автоматически.

Проверить:

- повторяющиеся атрибуты;
- дублирование справочников;
- денормализацию;
- snapshot-данные;
- derived fields;
- бизнес-причины хранения вычисляемых значений.

---

# 14. Избыточность данных

Искать поля, которые можно вычислить из других.

Пример:

```text
quantity
price
total_price
```

Если:

```text
total_price = quantity × price
```

проверить, зачем хранится `total_price`.

Допустимые причины:

- исторический snapshot;
- бизнес-аудит;
- независимость от будущего изменения source fields.

---

# 15. Циклы в БД и доменной модели

Проверить:

```text
A → B
B → C
C → A
```

Особенно:

- circular ownership;
- циклические каскады;
- сложные удаления;
- миграционные проблемы;
- взаимные nullable FK;
- нелогичные зависимости домена.

---

# 16. Индексы

Проверить:

- B-tree;
- GIN;
- GiST;
- BRIN;
- composite indexes;
- partial indexes;
- unique indexes;
- expression indexes.

Главное:

> наличие индекса ≠ использование индекса.

Проверить:

```sql
EXPLAIN
EXPLAIN ANALYZE
```

Также:

- missing indexes;
- unused indexes;
- duplicate indexes;
- индексирование FK;
- over-indexing;
- write amplification.

---

# 17. Query Performance

Проверить:

- slow queries;
- full table scans;
- lock waits;
- deadlocks;
- long transactions;
- connection saturation;
- bad query plans;
- sequential scans на крупных таблицах;
- memory-heavy sorts;
- unbounded queries.

Использовать:

```text
pg_stat_statements
```

---

# 18. N+1 Queries

Особенно при ORM.

Плохой сценарий:

```text
1 query users
+
100 queries profiles
```

Проверить:

- eager/lazy loading;
- batch loading;
- joins;
- DataLoader;
- prefetch;
- ORM query plans.

---

# 19. Транзакции

Проверить атомарность бизнес-операций.

```text
BEGIN
...
COMMIT
```

или:

```text
ROLLBACK
```

Проверить:

- transaction boundaries;
- слишком длинные транзакции;
- DB + external API в одной логической операции;
- outbox pattern при необходимости;
- частично созданные сущности.

---

# 20. Isolation / Race Conditions / Concurrency

Проверить:

- double submit;
- lost update;
- duplicate jobs;
- concurrent refresh;
- повторные платежи;
- concurrent state transitions;
- write skew;
- phantom/read anomalies.

Механизмы:

```text
row locks
optimistic locking
unique constraints
transactions
idempotency keys
version columns
```

---

# 21. Миграции БД

Проверить:

- migration tool;
- migration history;
- immutable migrations;
- backward compatibility;
- zero-downtime migration;
- rollback strategy;
- migration validation;
- migrations в CI;
- data migrations;
- lock-heavy migrations;
- schema drift;
- ручные изменения production DB.

---

# 22. Backup / Restore / PITR

Проверить:

- автоматические backup;
- шифрование backup;
- retention;
- off-site backup;
- WAL;
- PITR;
- restore test;
- integrity verification.

Backup считается рабочим только после:

```text
backup
+
automated restore test
```

---

# 23. RPO / RTO

Определить:

- **RPO** — сколько данных допустимо потерять;
- **RTO** — сколько времени допустимо восстанавливать систему.

Проверить фактические значения, а не декларации.

---

# 24. Кэширование

Проверить уровни:

```text
Browser Cache
 ↓
CDN
 ↓
Application Cache
 ↓
Redis
 ↓
PostgreSQL
```

Проверить:

- TTL;
- invalidation;
- stale data;
- cache stampede;
- cache poisoning;
- distributed cache;
- cache key design;
- cache namespacing;
- cache consistency;
- cache hit ratio;
- stale authorization data;
- удаление cache при account/session changes.

---

# 25. Password Hashing

Для пользовательских паролей проверить:

- Argon2id;
- bcrypt;
- scrypt;
- PBKDF2.

Не использовать обычный быстрый hash как password storage.

Плохо:

```text
SHA256(password)
BLAKE2(password)
```

Правильно:

```text
password
  +
unique salt
  ↓
Argon2id
  ↓
password_hash
```

---

# 26. Salt / Pepper

Проверить:

- уникальный salt;
- автоматическое управление salt;
- server-side pepper при необходимости;
- хранение pepper вне БД;
- rotation strategy.

Пример:

```text
password
+
salt
+
server-side pepper
↓
Argon2id
```

---

# 27. Обезличивание данных

Различать:

## Masking

```text
ivan.petrov@example.com
→
i***@example.com
```

## Pseudonymization

```text
user@email.com
→
user_81f24c
```

## Anonymization

Обратная идентификация практически невозможна.

Проверить, что термины не смешиваются.

---

# 28. Шифрование данных

Проверить:

## In transit

TLS.

## At rest

- disk encryption;
- DB encryption;
- backup encryption.

## Application-level encryption

Для особо чувствительных полей:

```text
plaintext
 ↓
AES-256-GCM
 ↓
ciphertext
```

---

# 29. Хранение ключей и секретов

Нельзя хранить secrets в:

```text
Git
source code
.env.example
Docker image
database
frontend bundle
CI logs
```

Проверить:

- Secret Manager / Vault / KMS;
- rotation;
- versioning;
- access policies;
- least privilege;
- audit logs;
- emergency revoke;
- secret scanning.

---

# 30. REST API — базовая архитектура

Проверить ресурсную модель:

```text
/api/v1/users
/api/v1/sessions
/api/v1/profile
/api/v1/path
```

Проверить согласованность и отсутствие RPC-подобного хаоса, если выбран REST.

---

# 31. HTTP Methods

Использовать семантически:

```text
GET     получить
POST    создать / выполнить команду
PUT     заменить
PATCH   частично изменить
DELETE  удалить
```

Плохо:

```text
GET /deleteUser?id=123
```

Лучше:

```text
DELETE /api/v1/users/123
```

---

# 32. HTTP Status Codes

Проверить корректность:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Content
429 Too Many Requests
500 Internal Server Error
503 Service Unavailable
```

Не возвращать бизнес-ошибку как HTTP 200 без причины.

---

# 33. API Versioning

Проверить стратегию:

```text
/api/v1/...
/api/v2/...
```

Новая версия нужна только при breaking changes.

---

# 34. Единый формат ошибок API

Пример:

```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Email is already registered",
    "request_id": "..."
  }
}
```

Не отдавать:

- stack traces;
- SQL errors;
- внутренние пути;
- секреты;
- implementation details.

---

# 35. Input Validation

Все входные данные считать недоверенными:

```text
body
query
path params
headers
files
webhook payload
WebSocket messages
```

Проверять:

- type;
- length;
- format;
- range;
- enums;
- nested objects;
- file type;
- content size;
- dangerous fields.

---

# 36. Output Validation / DTO

Не возвращать DB model напрямую.

```text
Database Model
≠
API Response Model
```

Проверить утечки:

- password_hash;
- refresh token;
- internal flags;
- private notes;
- admin fields;
- PII.

---

# 37. Authentication vs Authorization

Разделять:

**Authentication** — кто пользователь.

**Authorization** — что ему разрешено.

Проверить:

- RBAC;
- ABAC при необходимости;
- ownership;
- admin endpoints;
- privilege escalation;
- BOLA / IDOR;
- function-level authorization;
- object-property authorization.

---

# 38. Rate Limiting API

Особенно:

```text
/login
/register
/password-reset
/token-refresh
/search
AI endpoints
expensive queries
webhooks
```

Проверить proxy-aware IP extraction.

---

# 39. CORS

Не использовать без необходимости:

```text
Access-Control-Allow-Origin: *
```

особенно с credentials.

Проверить allowlist:

```text
https://yuni.com
https://app.yuni.com
```

Проверить:

- origins;
- methods;
- headers;
- credentials;
- preflight;
- cache.

---

# 40. CSRF

Если auth через cookies:

```text
SameSite
+
CSRF token
+
Origin / Referer validation
```

JWT сам по себе не означает защиту от CSRF.

---

# 41. Idempotency

Критично для:

- платежей;
- создания сущностей;
- external API commands;
- webhook;
- retryable operations;
- AI jobs при списании лимитов.

Использовать:

```text
Idempotency-Key
```

---

# 42. Pagination

Не возвращать неограниченные коллекции.

Предпочтительно:

```text
GET /users?limit=50&cursor=...
```

Для крупных таблиц проверить необходимость cursor pagination вместо большого OFFSET.

---

# 43. Filtering / Sorting

Проверить:

```text
?status=active
?sort=created_at
```

Не позволять пользователю напрямую определять SQL expression.

---

# 44. Request Limits

Проверить:

- max body size;
- max upload size;
- max headers;
- max JSON depth;
- request timeout;
- query complexity;
- decompression bomb;
- oversized multipart.

---

# 45. API Timeouts

Определить:

- connection timeout;
- request timeout;
- DB statement timeout;
- external provider timeout;
- AI timeout;
- worker timeout.

---

# 46. Retry Policy

Не все операции можно безопасно повторять.

Проверить:

- exponential backoff;
- jitter;
- max attempts;
- retryable errors;
- idempotency;
- duplicate side effects;
- retry storm.

---

# 47. REST API Caching

Проверить:

```text
Cache-Control
ETag
Last-Modified
```

Различать public и private data.

---

# 48. OpenAPI

Использовать OpenAPI 3.x.

Должны быть описаны:

```text
routes
parameters
request schemas
response schemas
authentication
status codes
errors
```

Проверить:

```text
OpenAPI
↕
Actual backend
```

---

# 49. API Contracts и обратная совместимость

Добавить:

- schema diff в CI;
- contract tests;
- реестр endpoint’ов;
- ownership endpoint’ов;
- status `active / deprecated / removed`;
- breaking-change detection;
- compatibility frontend ↔ backend;
- versioning webhook/events;
- nullable/non-nullable consistency;
- единые UUID/date/decimal formats.

Правило:

> Любое breaking API-изменение должно обнаруживаться CI до deployment.

---

# 50. OWASP API Security

Проверить минимум:

- Broken Object Level Authorization;
- Broken Authentication;
- Broken Object Property Level Authorization;
- Unrestricted Resource Consumption;
- Broken Function Level Authorization;
- Sensitive Business Flows;
- SSRF;
- Security Misconfiguration;
- Improper Inventory Management;
- Unsafe Consumption of APIs.

---

# 51. WebSocket / WSS Security

Сам `wss://` обеспечивает шифрование, но не authorization.

Проверить цепочку:

```text
Client
   ↓
WSS / TLS
   ↓
Origin validation
   ↓
Authentication
   ↓
Session validation
   ↓
Authorization
   ↓
Message validation
   ↓
Business permission check
```

---

# 52. WSS — сценарии несанкционированного доступа

Протестировать:

- без токена;
- с повреждённым токеном;
- с expired token;
- с revoked token;
- со старым token после logout;
- после password change;
- после role change;
- после account suspension;
- после account deletion;
- с токеном другого пользователя;
- с токеном другого audience;
- с token от staging;
- с refresh token вместо access;
- с токеном неправильного issuer;
- с чужого Origin;
- replay WebSocket ticket;
- reconnect старой session;
- существующее соединение после logout.

---

# 53. Cross-Site WebSocket Hijacking

Проверить:

- `Origin` allowlist;
- cookies;
- CSRF-like WebSocket handshake attack;
- отсутствие доверия к любому Origin;
- session cookies;
- SameSite;
- WebSocket endpoint isolation.

---

# 54. Message-Level Authorization

Нельзя считать:

```text
WebSocket authenticated
=
все сообщения разрешены
```

Для каждого message/action проверять resource ownership и permissions.

Пример:

```json
{
  "action": "get_dialog",
  "dialog_id": "dialog_of_user_456"
}
```

User A не должен получить dialog User B.

---

# 55. WebSocket Authentication Ticket

Рассмотреть безопасную схему:

```text
REST
POST /ws-ticket
      ↓
one-time ticket
TTL 30–60 sec
      ↓
WSS connect
      ↓
ticket consumed
```

Не передавать refresh token в query string.

Проверить:

- one-time use;
- short TTL;
- binding к session/user;
- replay protection;
- audit.

---

# 56. WSS DoS / Resource Protection

Проверить:

```text
connections / user
connections / IP
messages / second
message size
idle timeout
connection lifetime
memory / connection
queue depth
```

Механизмы:

```text
maxPayload
rate limits
connection limits
ping/pong
idle timeout
backpressure
```

---

# 57. WebSocket Compression

Проверить необходимость `permessage-deflate`.

Если не нужен — отключить.

Особенно осторожно при передаче секретов и чувствительных данных.

---

# 58. Полный Token Inventory

Найти все credentials в реальном коде.

Проверить минимум:

| Token / Credential | Назначение |
|---|---|
| Access Token | API access |
| Refresh Token | обновление access |
| Session ID | web session |
| ID Token | OIDC identity |
| Authorization Code | OAuth |
| `state` | OAuth CSRF |
| `nonce` | OIDC replay protection |
| CSRF Token | CSRF protection |
| Password Reset Token | reset |
| Email Verification Token | email confirm |
| Magic Link | passwordless login |
| MFA OTP | MFA |
| Recovery Code | MFA recovery |
| WS Ticket | WSS auth |
| API Key | integration |
| Service Token | service-to-service |
| Invite Token | invitations |

Для каждого определить:

```text
generation
storage
transmission
validation
rotation
expiration
revocation
destruction
```

---

# 59. JWT Claims Audit

Проверить:

```json
{
  "sub": "...",
  "iss": "...",
  "aud": "...",
  "exp": "...",
  "nbf": "...",
  "iat": "...",
  "jti": "...",
  "sid": "...",
  "scope": "...",
  "token_use": "access"
}
```

Проверить:

```text
signature
algorithm allowlist
issuer
audience
expiration
not-before
scope
token type
subject
session
revocation
```

---

# 60. Access Token vs Refresh Token

Сервер должен различать тип.

Например:

```text
token_use = access
token_use = refresh
```

Refresh token не должен работать как access token.

Access token не должен работать как refresh token.

---

# 61. JWT alg / kid / signing key audit

Проверить:

- `alg=none`;
- algorithm confusion;
- неожиданный algorithm;
- `kid` injection;
- JWKS trust;
- old signing keys;
- key rotation;
- key revocation;
- environment key separation;
- public/private key misuse.

Сервер должен заранее иметь allowlist алгоритмов.

---

# 62. Refresh Token Rotation

Модель:

```text
Refresh A
   ↓
Access B
Refresh B
   ↓
Refresh A INVALID
```

Повторное использование:

```text
Refresh A
   ↓
REUSE DETECTED
```

Проверить token family.

Полезные поля:

```text
session_id
refresh_family_id
token_hash
created_at
expires_at
used_at
revoked_at
replaced_by
```

Не хранить raw refresh token в БД без необходимости.

---

# 63. Stale / Revoked Credential Audit

Критический блок.

После login:

```text
Access A
Refresh A
```

После logout проверить:

```text
Access A → /me
Access A → /profile
Access A → /dialogs
Refresh A → /token/refresh
Access A → WSS
Existing WSS → private messages/data
```

Нужно определить ожидаемую policy и доказать её тестами.

---

# 64. Старый Refresh Token после logout

После logout старый refresh token не должен выпускать новый access token.

```text
Refresh A
↓
logout
↓
Refresh A → new Access
```

Ожидание:

```text
DENY
```

---

# 65. Старый Access Token после logout

Если JWT полностью stateless, он может быть валиден до `exp`.

Это должно быть осознанным security trade-off.

Для чувствительных сценариев рассмотреть server-side session validation.

---

# 66. Server-Side Session State

Пример:

```text
JWT:
sub = user_123
sid = session_987
```

API:

```text
signature valid
exp valid
 ↓
session_987 active?
 ↓
user active?
 ↓
ALLOW / DENY
```

После logout:

```text
session_987.revoked_at = now
```

Старый JWT должен быть отклонён, если policy требует мгновенной инвалидизации.

---

# 67. auth_version / security version

Возможный механизм глобальной инвалидизации:

```text
user.auth_version = 8
token.auth_version = 8
```

После:

- password change;
- logout all devices;
- security incident;

```text
user.auth_version = 9
```

Token версии 8:

```text
DENY
```

---

# 68. Старые токены после изменения прав

Критический сценарий:

```text
role = admin
↓
JWT issued
↓
role changed to user
```

Проверить, не сохраняет ли старый JWT admin permissions.

Тестировать после:

- role downgrade;
- permission removal;
- account suspension;
- account deletion;
- password reset;
- email change;
- MFA enable/disable;
- security incident.

---

# 69. Минимизация JWT Payload

Не помещать без необходимости:

```text
email
name
birth_date
profile
sensitive data
large authorization state
```

JWT обычно подписан, а не зашифрован.

Проверить:

- утечки;
- stale claims;
- слишком длинные tokens;
- доверие устаревшим roles/scopes.

---

# 70. `/me` / Profile Security Matrix

Проверить:

```text
GET /me
GET /profile
GET /dialogs
GET /settings
GET /subscription
```

с:

```text
valid token
expired token
revoked token
old access token
old refresh token
token другого пользователя
token удалённого пользователя
token заблокированного пользователя
token до password change
token до role change
token до logout
token другой session
token от staging
wrong audience
wrong issuer
old signing key
modified payload
```

---

# 71. Cache + Old Credentials

Проверить, не выдаёт ли cache данные после revocation.

Проверить:

```text
Redis
CDN
application memory
WebSocket subscriptions
DataLoader cache
local caches
```

При:

```text
logout
account block
permission change
account deletion
```

cache invalidation должна соответствовать security policy.

---

# 72. Existing WSS после logout

Критический тест:

```text
User login
 ↓
WSS connected
 ↓
User logout
 ↓
HTTP access closed
```

Проверить, остаётся ли:

```text
WSS connected
private messages available
subscriptions alive
```

При logout/revocation должна быть возможность:

```text
revoke session
 ↓
connection registry
 ↓
close all WSS for sid/user
```

---

# 73. Получение данных другого пользователя

Проверить:

```text
Token User A
+
resource ID User B
```

Через:

- REST;
- WSS;
- query params;
- path params;
- body;
- dialog IDs;
- message IDs;
- profile IDs;
- file IDs;
- progress IDs;
- subscription IDs.

Сервер должен проверять:

```text
authenticated_user
↕
resource.owner
```

---

# 74. Browser / JavaScript Security

Проверить:

- XSS;
- DOM XSS;
- CSP;
- CSRF;
- CORS;
- `HttpOnly`;
- `Secure`;
- `SameSite`;
- LocalStorage;
- SessionStorage;
- IndexedDB;
- source maps;
- secrets в JS bundle;
- dangerous DOM APIs;
- dependency vulnerabilities;
- third-party scripts;
- SRI при необходимости;
- iframe policy;
- clickjacking;
- security headers.

Особое внимание:

- не хранить долгоживущий refresh token небезопасно;
- не считать frontend защитой от server-side privilege escalation.

---

# 75. Security Headers

Проверить:

```text
Strict-Transport-Security
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
frame-ancestors / X-Frame-Options
```

---

# 76. Observability — три сигнала

Проверить:

```text
Metrics
Logs
Traces
```

Рекомендуемая база:

- OpenTelemetry;
- Prometheus;
- Grafana;
- Loki / OpenSearch / ClickHouse;
- Vector / Fluent Bit.

---

# 77. Structured Logging

Предпочитать:

```json
{
  "event": "login_failed",
  "request_id": "...",
  "user_id": "...",
  "reason": "invalid_credentials"
}
```

Не логировать:

- passwords;
- access tokens;
- refresh tokens;
- API keys;
- cookies;
- private keys;
- лишнюю PII;
- sensitive dialogs.

---

# 78. Метрики

Проверить:

- CPU;
- RAM;
- disk;
- requests/sec;
- error rate;
- p50;
- p95;
- p99;
- DB query latency;
- DB connections;
- connection pool usage;
- queue depth;
- queue lag;
- cache hit ratio;
- external API latency;
- AI latency;
- AI token usage;
- worker failures.

---

# 79. Визуализация

Grafana или аналог.

Dashboard должен показывать минимум:

```text
Requests/sec
Error %
p50
p95
p99
CPU
Memory
DB latency
DB connections
Cache hit ratio
Queue depth
AI latency
AI cost
```

---

# 80. Alerting

Проверить actionable alerts.

Примеры:

```text
5xx > threshold
p99 > threshold
DB CPU > threshold
disk < threshold
certificate expires soon
backup failed
restore test failed
queue lag high
AI provider errors
token reuse detected
unusual login failures
```

Alert должен требовать понятного действия.

---

# 81. SLI / SLO / SLA

## SLI

Что измеряется.

Пример:

```text
99.95% successful API requests
```

## SLO

Какой уровень хотим поддерживать.

```text
99.9% successful requests per month
```

## SLA

Внешнее обязательство перед клиентом.

Для внутреннего проекта сначала важнее SLI + SLO.

---

# 82. Percentiles

Проверять:

```text
p50
p95
p99
```

p99.9 / p99.99 использовать только при реальной необходимости и большом объёме.

Не полагаться на average latency.

---

# 83. Health Checks

Проверить:

- liveness;
- readiness;
- startup checks;
- DB dependency;
- external provider dependency;
- graceful removal from LB.

---

# 84. Graceful Shutdown

При deployment/process stop:

- перестать принимать новые запросы;
- завершить активные;
- закрыть WSS;
- корректно завершить jobs;
- закрыть DB connections;
- не терять messages.

---

# 85. Orchestration

Проверить необходимость:

```text
Docker Compose
systemd
reverse proxy
```

или:

```text
Kubernetes
```

Если Kubernetes:

```text
Deployment
Service
Ingress
ConfigMap
Secret
HPA
Jobs
CronJobs
PDB
NetworkPolicy
```

Не считать Kubernetes целью сам по себе.

---

# 86. Delivery Strategies

Проверить необходимость:

- rolling deploy;
- blue-green;
- canary;
- feature flags;
- rollback;
- immutable images;
- release versioning.

---

# 87. Resilience / Failure Modes

Проверить сценарии:

```text
PostgreSQL unavailable
Redis unavailable
AI provider timeout
AI provider 500
email provider unavailable
disk full
DB pool exhausted
deploy partial failure
migration partial failure
duplicate request
worker crash
network partition
queue outage
```

Механизмы:

- timeouts;
- bounded retries;
- exponential backoff;
- jitter;
- circuit breaker;
- bulkhead isolation;
- backpressure;
- load shedding;
- idempotency;
- dead-letter queue;
- graceful degradation.

---

# 88. Incident Response

Проверить:

- severity levels;
- on-call / owner;
- notification channels;
- incident runbooks;
- rollback runbook;
- key revoke procedure;
- compromised token response;
- DB restore procedure;
- VPS loss procedure;
- migration rollback;
- data breach procedure;
- postmortem;
- corrective actions.

---

# 89. Recovery Drills

Периодически выполнять:

```text
delete test DB
restore backup
apply WAL / PITR
verify integrity
measure actual RPO / RTO
```

---

# 90. Очереди и фоновые задачи

Если используются:

- email;
- AI;
- notifications;
- image processing;
- imports;
- file processing.

Проверить:

- retry;
- idempotency;
- job ID;
- dead-letter queue;
- duplicate execution;
- worker restart;
- versioned payload;
- poison message;
- concurrency limits;
- manual replay;
- job retention.

---

# 91. Webhook Security

Проверить:

```text
Signature validation
Timestamp validation
Replay protection
Idempotency
Payload schema
Source verification where appropriate
Rate limiting
Secret rotation
```

---

# 92. Code Quality Audit

Проверить:

- overly complex functions;
- duplicated business logic;
- dead code;
- unreachable code;
- unused dependencies;
- tight coupling;
- wrong dependency direction;
- global mutable state;
- oversized interfaces;
- unjustified abstractions;
- hidden side effects;
- swallowed errors;
- empty catch;
- unsafe casts;
- `any`;
- mixed DTO/domain/ORM;
- business logic in controllers/UI;
- inconsistent error handling;
- duplicate implementations.

---

# 93. Test Quality Audit

Не ограничиваться:

```text
Tests passed
Coverage %
```

Проверить:

- tautological tests;
- weak tests;
- assertions that are always true;
- tests without meaningful assertions;
- excessive mocking;
- testing mock behavior instead of application behavior;
- meaningless snapshots;
- auto-updated snapshots;
- tests that pass after removing core logic;
- happy-path-only tests;
- flaky tests;
- order-dependent tests;
- shared mutable fixtures;
- DB isolation;
- nondeterministic time/randomness;
- skipped tests;
- unreachable branches.

---

# 94. Mutation / Fault Injection для тестов

Намеренно сломать production logic:

```text
remove authorization check
invert condition
return wrong status
remove validation
replace result with constant
skip business step
break FK assumption
```

Правильный тест должен упасть.

Если не падает — тест потенциально false-positive.

---

# 95. Типы тестов

Проверить покрытие уровнями:

```text
Unit
Integration
Database integration
API contract
End-to-end
Authorization/security
Migration
Concurrency
Property-based
Load/performance
Recovery/failure
```

Критичную PostgreSQL-логику по возможности проверять на реальной PostgreSQL в integration tests.

---

# 96. Secure SDLC

Проверить:

- branch protection;
- pull request review;
- CODEOWNERS;
- запрет direct push в production;
- CI least privilege;
- production secrets недоступны untrusted PR;
- secret scanning;
- SAST;
- dependency scanning;
- container scanning;
- lockfiles;
- dependency update policy;
- EOL dependencies;
- license review;
- SBOM;
- build provenance;
- signed artifacts;
- controlled base images;
- reproducible builds;
- build/deploy permission separation.

---

# 97. Infrastructure as Code

Проверить:

- Terraform;
- Ansible;
- Docker Compose;
- Kubernetes manifests;
- environment reproducibility;
- drift detection;
- secret separation;
- code review infra changes.

Не должно быть критических production-настроек, существующих только вручную.

---

# 98. Threat Modeling

Для каждой критичной функции определить:

```text
Asset
Threat actor
Entry point
Trust boundary
Abuse scenario
Impact
Existing controls
Residual risk
Test
```

Отдельно:

- auth;
- password reset;
- refresh token flow;
- profile;
- AI dialogs;
- file upload;
- admin;
- webhook;
- PostgreSQL;
- logs;
- CI/CD;
- backups.

---

# 99. Privacy / Data Lifecycle

Создать реестр данных:

| Данные | Создание | Хранение | Передача | Retention | Удаление |
|---|---|---|---|---|---|
| Email | registration | PostgreSQL | email provider | policy | account deletion |
| Dialog | AI | DB | AI provider? | policy | deletion |
| Analytics | app | provider | provider | policy | lifecycle |
| Logs | backend | log storage | observability | 7/30/90d | TTL |
| Backups | DB | backup storage | provider | policy | lifecycle |

Проверить:

- data minimization;
- purpose;
- consent;
- export;
- deletion;
- retention;
- external processors;
- test/staging dumps;
- PII in logs;
- PII in analytics;
- PII in crash reports;
- AI provider data flow.

---

# 100. Удаление аккаунта end-to-end

Проверить:

```text
User requests deletion
 ↓
account blocked
 ↓
tokens revoked
 ↓
sessions revoked
 ↓
WSS closed
 ↓
primary data deleted
 ↓
files deleted
 ↓
cache invalidated
 ↓
search index cleaned
 ↓
analytics mapping removed
 ↓
external processors notified
 ↓
minimal audit record retained if legally needed
```

Проверить остатки в:

- Redis;
- logs;
- embeddings/vector DB;
- files;
- analytics;
- test dumps;
- queues;
- provider history;
- traces;
- backups.

---

# 101. Admin / Privileged Access

Проверить:

- MFA;
- admin role separation;
- support/admin/superadmin;
- reauthentication for critical actions;
- admin audit log;
- tamper-resistant audit;
- VPN/IP restrictions if justified;
- session timeout;
- active session view;
- revoke all sessions;
- temporary production access;
- former employee offboarding;
- break-glass account;
- impersonation audit.

---

# 102. Frontend / Mobile Security & Reliability

Проверить:

- loading states;
- error states;
- empty states;
- offline;
- double submit;
- slow network;
- interrupted request;
- expired access token;
- concurrent refresh across tabs;
- XSS;
- CSP;
- cookies;
- local storage;
- source maps;
- PII in analytics;
- PII in crash reports;
- deep links;
- bundle size;
- image optimization;
- memory leaks;
- event listener leaks;
- rerender loops;
- visual regression.

---

# 103. Accessibility

Определить целевой уровень, например WCAG 2.2 AA.

Проверить:

- keyboard navigation;
- focus visibility;
- contrast;
- labels;
- accessible forms;
- status messages;
- target sizes;
- screen reader semantics;
- error communication.

---

# 104. Business Invariants / State Machines

Описать допустимые состояния.

Пример:

```text
User:
pending → active → blocked → deleted

Subscription:
trial → active → past_due → cancelled → expired

AI request:
created → processing → completed
                    ↘ failed
                    ↘ cancelled
```

Проверить:

- impossible transitions;
- repeated transitions;
- authorization;
- race conditions;
- partial operations;
- DB ↔ provider inconsistency;
- recovery;
- timezone;
- DST;
- delete/restore;
- replay.

Инварианты должны защищаться:

```text
Domain code
Database constraints
Tests
Observability
```

---

# 105. Performance / Capacity Planning

Определить модель:

```text
1 000 users
10 000 users
100 000 users
```

Проверить:

- average load;
- peak load;
- AI requests/min;
- data/user;
- DB growth/month;
- logs/day;
- p50/p95/p99;
- throughput;
- saturation;
- connection pool;
- memory growth;
- queue lag;
- cache hit ratio;
- AI concurrency;
- graceful degradation;
- scaling threshold.

---

# 106. Performance Budgets

Пример, только как шаблон:

```text
p95 API < target
p99 API < target
AI first token < target
DB pool usage < target
Error rate < target
```

Конкретные цифры должны выводиться из UX, нагрузки и бюджета.

---

# 107. Cost Control

Особенно для AI.

Измерять:

```text
cost / user
cost / AI dialog
cost / 1k requests
cost / stored user
cost / logs
cost / backup
egress cost
```

Проверить:

- budget alerts;
- token limits;
- max context size;
- model routing;
- cache;
- log retention;
- high-cardinality metrics;
- idle resources;
- AI cost regression tests.

---

# 108. AI / LLM Audit

Для Yuni отдельный блок.

Проверить:

- model provider;
- model version;
- prompt version;
- prompt storage;
- prompt rollback;
- environment-specific prompts;
- secret leakage in prompts;
- reproducibility;
- output schemas;
- model fallback.

---

# 109. AI Security

Проверить:

- prompt injection;
- indirect prompt injection;
- system prompt leakage;
- sensitive data disclosure;
- excessive agency;
- unsafe output handling;
- data poisoning;
- tool abuse;
- cross-user data leakage;
- SSRF through tools;
- SQL injection through tool calls;
- command injection through tool calls;
- hidden instructions in uploaded content.

---

# 110. AI Evals

Создать стабильный eval set:

```text
normal request
ambiguous request
unsafe request
prompt injection
cross-user data request
long context
conflicting context
provider failure
invalid JSON output
tool-call error
```

Измерять:

- quality;
- groundedness;
- hallucination rate;
- safety;
- output format;
- tool-call accuracy;
- latency;
- token usage;
- cost;
- regression across model versions.

---

# 111. AI Agent Permissions

Нельзя доверять security system prompt.

Правильная схема:

```text
LLM proposes action
        ↓
Policy / Authorization Layer
        ↓
Schema Validation
        ↓
User confirmation for critical action
        ↓
Tool execution
        ↓
Audit record
```

Проверить:

- tool allowlist;
- per-tool permissions;
- server-side authorization;
- least privilege;
- call limits;
- cost limits;
- timeout;
- sandbox;
- запрет arbitrary SQL;
- запрет arbitrary shell;
- confirmation для delete/payment/send/publish;
- audit trail.

---

# 112. Documentation Audit

Полноценный объект аудита:

```text
AGENTS.md
AI_CONTEXT.md
README.md
ADR/*
ROADMAP.md
PROJECT_STATE.md
SECURITY.md
TESTING.md
AUDIT/*
DEPLOYMENT.md
```

Проверить:

- актуальность;
- соответствие коду;
- противоречия;
- устаревшие компоненты;
- отсутствующие компоненты;
- дублирование;
- source of truth;
- ownership;
- update trigger;
- token efficiency;
- конфликт AI-инструкций;
- secrets;
- устаревшие security/testing правила.

---

# 113. Metadata для ключевых Markdown-документов

Рассмотреть формат:

```yaml
status: current
owner: backend
last_verified_commit: abc123
update_when:
  - auth flow changes
  - database schema changes
  - token policy changes
source_of_truth: src/auth/
```

---

# 114. Долговременная инженерная база знаний

Аудит должен создавать/обновлять:

- Architecture overview;
- ADR;
- Security model;
- Auth/session model;
- Token lifecycle;
- DB invariants;
- REST contracts;
- WebSocket protocol;
- Testing strategy;
- Threat model;
- SLO/SLI;
- Incident runbooks;
- Backup/restore policy;
- AI safety model;
- Data lifecycle;
- Deployment architecture;
- Known risks;
- Accepted trade-offs.

---

# 115. Что не считать обязательным без доказательства

Не внедрять автоматически:

```text
Kubernetes
Service Mesh
Kafka
Microservices
CQRS
Event Sourcing
Multi-region active-active
Database sharding
p99.99 SLO
Complex API Gateway
Separate Redis cluster
```

Для каждого решения ответить:

1. Какую реальную проблему решает?
2. Есть ли эта проблема сейчас?
3. Почему простое решение не подходит?
4. Какова стоимость эксплуатации?
5. Кто будет поддерживать?
6. Как измеряется польза?
7. Как откатиться?

---

# 116. Приоритет аудита Yuni

Рекомендуемый порядок:

1. Фактическая архитектура и зависимости.
2. Качество тестов и false-positive tests.
3. PostgreSQL: схема, связи, constraints, migrations, concurrency.
4. Authentication / Authorization / Sessions / Tokens.
5. Stale/revoked token audit.
6. WSS / WebSocket authorization.
7. Data lifecycle / privacy.
8. AI security / evals / tool permissions.
9. CI/CD / secrets / supply chain.
10. Backup / restore / incident response.
11. Observability / SLO.
12. REST/OpenAPI contracts.
13. Documentation audit.
14. Performance / capacity.
15. Cost control.
16. Overengineering review.

---

# 117. Критические security-тесты, которые должны существовать

## Auth / Token

```text
expired access token → denied
revoked access token → denied according to policy
old refresh after rotation → denied
old refresh after logout → denied
old token after password change → denied according to policy
old admin token after role downgrade → denied
token from another environment → denied
wrong audience → denied
wrong issuer → denied
modified JWT → denied
wrong token type → denied
old signing key → expected policy
```

## User Data

```text
User A token + User B profile ID → denied
User A token + User B dialog ID → denied
User A token + User B message ID → denied
old/revoked token + /me → denied according to policy
deleted account token + /profile → denied
blocked account token + private data → denied
```

## WSS

```text
no token → denied
expired token → denied
revoked token → denied
wrong Origin → denied
cross-user message → denied
old WS ticket replay → denied
existing WSS after logout → closed
existing WSS after block → closed
oversized message → rejected
message flood → rate limited
```

## Database

```text
invalid FK → DB rejects
duplicate unique entity → DB rejects
invalid state → DB/domain rejects
concurrent duplicate creation → one succeeds
transaction partial failure → rollback
```

## REST

```text
wrong method → correct response
invalid body → 4xx
wrong ownership → 403/404 policy
double idempotent POST → one side effect
oversized body → rejected
timeout → controlled failure
```

---

# 118. Финальное требование для мощной модели

Провести полный технический, security, production, data, API, WebSocket, token, test-quality и AI-аудит Yuni.

Не ограничиваться статическим анализом.

Обязательно:

- читать код;
- анализировать конфигурацию;
- анализировать миграции;
- анализировать SQL;
- анализировать тесты;
- проверять инфраструктурные файлы;
- проверять документацию;
- строить dependency/data-flow maps;
- искать false-positive tests;
- создавать негативные security tests;
- проверять stale/revoked credentials;
- проверять cross-user access;
- проверять WebSocket after logout;
- проверять cache invalidation;
- проверять recovery;
- проверять AI tool authorization;
- проверять documentation drift.

Для каждого finding:

- доказательство;
- scenario;
- severity;
- root cause;
- minimal fix;
- target fix;
- acceptance criteria;
- test;
- documentation update.

Все устойчивые выводы преобразовать в долговременную Markdown-базу знаний проекта.

---

# 119. Итоговая целевая карта production-архитектуры для проверки

Не считать эту схему обязательной — использовать как reference model для сравнения с реальными требованиями Yuni.

```text
                         Internet
                            │
                            ▼
                         DNS/CDN
                            │
                            ▼
                       WAF / DDoS
                            │
                            ▼
                   L7 LB / Reverse Proxy
                     │               │
                  HTTPS             WSS
                     │               │
                     └───────┬───────┘
                             ▼
                         Backend
                  ┌──────────┼──────────┐
                  ▼          ▼          ▼
               Auth       Domain       AI
                  │          │          │
                  │          │          ▼
                  │          │      AI Provider
                  │          │
                  ▼          ▼
              Sessions   PostgreSQL
                  │          │
                  ▼          ▼
                Redis     Backups/PITR
                  │
                  ▼
              WSS Session
               Registry

                  Backend / Workers
                         │
             ┌───────────┼────────────┐
             ▼           ▼            ▼
           Queue       Email       Webhooks

All components
     │
     ▼
OpenTelemetry
     │
 ┌───┼────┐
 ▼   ▼    ▼
Logs Metrics Traces
     │
     ▼
   Grafana / Alerting
```

---

# 120. Definition of Done для аудита

Аудит считается завершённым только если:

- [ ] Архитектура восстановлена по реальному коду.
- [ ] Все security boundaries описаны.
- [ ] Все виды токенов найдены.
- [ ] Lifecycle каждого token/credential документирован.
- [ ] Проверены старые/revoked tokens.
- [ ] Проверен logout на REST и WSS.
- [ ] Проверен cross-user access.
- [ ] Проверено изменение ролей и permissions.
- [ ] Проверена PostgreSQL schema.
- [ ] Проверены PK/FK/constraints/indexes.
- [ ] Проверены migrations.
- [ ] Проверены transactions/races/idempotency.
- [ ] Проверены backups и restore.
- [ ] Проверено HTTPS/TLS по всей цепочке.
- [ ] Проверен HTTP filtering/redirect.
- [ ] Проверена trusted proxy configuration.
- [ ] Проверена REST architecture.
- [ ] Проверена OpenAPI consistency.
- [ ] Проверена WebSocket security.
- [ ] Проверено observability/logging.
- [ ] Проверены alerts.
- [ ] Определены SLI/SLO.
- [ ] Проведён test-quality audit.
- [ ] False-positive tests подтверждены mutation/fault tests.
- [ ] Проведён Secure SDLC audit.
- [ ] Проведён threat modeling.
- [ ] Проведён privacy/data lifecycle audit.
- [ ] Проведён AI/LLM audit.
- [ ] Проверена AI tool authorization.
- [ ] Проведён documentation audit.
- [ ] Зафиксированы accepted risks.
- [ ] Зафиксированы unnecessary complexity / overengineering.
- [ ] Findings имеют доказательства и acceptance criteria.
- [ ] Все долговременные выводы внесены в Markdown knowledge base.

---

**Статус документа:** master checklist  
**Назначение:** технический аудит Yuni  
**Формат:** living document — обновлять вместе с архитектурой проекта


---

# 121. Consistency Audit — проверка консистентности данных

Провести отдельный аудит консистентности данных и состояния системы.

Проверять не только PostgreSQL, но всю цепочку:

```text
Client
  ↓
REST / WSS
  ↓
Application
  ↓
PostgreSQL
  ↕
Redis / Cache
  ↕
Queue / Workers
  ↕
External Providers
  ↕
Search / Analytics / AI storage
```

Цель:

> После любой успешной, неуспешной, повторной или частично выполненной операции система не должна оставаться в противоречивом состоянии.

## 121.1 Database Consistency

Проверить:

- PK/FK integrity;
- UNIQUE constraints;
- CHECK constraints;
- NOT NULL;
- domain invariants;
- transaction boundaries;
- isolation levels;
- lost updates;
- dirty/non-repeatable reads при релевантных уровнях;
- write skew;
- race conditions;
- partial writes;
- concurrent updates;
- orphan records;
- dangling references;
- несогласованные статусы сущностей.

Пример инварианта:

```text
order.status = paid
```

не должен существовать, если:

```text
payment.status != succeeded
```

если бизнес-модель требует строгой связи.

## 121.2 Cross-Table Consistency

Проверить согласованность между таблицами.

Примеры:

```text
users.status = deleted
```

но при этом:

```text
sessions.active = true
```

— потенциальная ошибка.

Другой пример:

```text
subscription.status = cancelled
```

но:

```text
access_entitlements.active = true
```

— нарушение бизнес-инварианта, если доступ должен быть закрыт.

## 121.3 Cache Consistency

Проверить:

```text
PostgreSQL
↕
Redis
```

Сценарии:

- запись в БД успешна, cache не очищен;
- cache обновлён, DB transaction rollback;
- stale cache после role change;
- stale cache после logout;
- stale profile после account deletion;
- stale authorization result;
- TTL скрывает ошибку слишком долго;
- один node обновил local cache, другой нет.

Проверить стратегии:

```text
cache-aside
write-through
write-behind
read-through
```

и фактическую корректность invalidation.

## 121.4 Read-After-Write Consistency

После:

```text
PATCH /profile
```

следующий:

```text
GET /profile
```

должен возвращать ожидаемое состояние согласно контракту.

Проверить:

- primary DB;
- read replicas;
- replica lag;
- cache;
- eventual consistency;
- frontend optimistic update.

Если используется eventual consistency, она должна быть явно задокументирована:

```text
Expected propagation delay:
Maximum tolerated delay:
User-visible behavior:
Conflict behavior:
```

## 121.5 Replica Consistency

Если есть read replicas:

Проверить:

- replication lag;
- stale reads;
- read-after-write;
- critical reads с primary;
- failover;
- split brain;
- promotion process;
- sequence/identity behavior;
- replication monitoring.

## 121.6 Queue / Event Consistency

Проверить сценарий:

```text
DB write
   ↓
publish event
```

Ошибка между двумя шагами может привести к:

```text
DB updated
event not published
```

или наоборот:

```text
event published
DB rollback
```

Проверить необходимость:

- transactional outbox;
- inbox pattern;
- at-least-once delivery handling;
- duplicate events;
- event ordering;
- event versioning;
- poison messages;
- dead-letter queue.

## 121.7 External Service Consistency

Проверить операции:

```text
DB
+
Email
+
Payment
+
AI provider
+
Object Storage
```

Например:

```text
payment succeeded
DB update failed
```

или:

```text
DB says email verified
provider operation failed
```

Для каждой distributed operation определить:

```text
source of truth
compensation action
retry policy
manual recovery
audit trail
```

Не пытаться имитировать ACID-транзакцию между независимыми внешними системами без ясной модели.

## 121.8 WebSocket Consistency

Проверить:

```text
REST state
↕
WSS state
```

Сценарии:

- REST обновил профиль, WSS отправил старое состояние;
- пользователь logout, WSS subscription осталась;
- role changed, WSS permission cache не обновился;
- message delivered до commit DB;
- DB rollback, но событие уже ушло клиенту;
- reconnect получает другой sequence/state.

Проверить version / sequence / event ordering там, где это требуется.

## 121.9 State Machine Consistency

Для каждой сущности определить разрешённые переходы.

Пример:

```text
created → pending → active → cancelled
```

Не позволять:

```text
cancelled → active
```

без отдельного разрешённого сценария.

Проверить:

- invalid transitions;
- duplicate transitions;
- out-of-order events;
- concurrent transitions;
- rollback;
- compensation.

## 121.10 Consistency Reconciliation

Для eventual/distributed систем предусмотреть проверку расхождений.

Примеры:

```text
DB says active
provider says cancelled
```

Нужны:

- reconciliation jobs;
- integrity checks;
- discrepancy reports;
- repair procedures;
- alerting.

## 121.11 Consistency Audit Tests

Обязательные негативные тесты:

```text
DB commit succeeds + cache update fails
DB rollback + event publish attempted
duplicate event arrives
events arrive out of order
worker retries after partial success
read replica is stale
role changes while request is executing
logout while WSS is active
same entity updated concurrently
external provider succeeds but DB write fails
```

Для каждого сценария определить ожидаемый invariant.

---

# 122. Idempotency Audit — проверка идемпотентности

Провести отдельный аудит идемпотентности всех операций, которые могут быть повторены из-за:

```text
network retry
client retry
double click
mobile reconnect
proxy retry
queue redelivery
worker restart
webhook resend
timeout uncertainty
user refresh
```

Цель:

> Повтор одного и того же логического запроса не должен создавать дополнительные побочные эффекты, если операция по контракту должна быть идемпотентной.

## 122.1 HTTP Idempotency

По HTTP-семантике проверить:

```text
GET     safe / idempotent
PUT     idempotent
DELETE  idempotent по конечному состоянию
POST    обычно не idempotent автоматически
PATCH   зависит от операции
```

Но не полагаться только на HTTP method — проверять фактическое поведение backend.

## 122.2 Idempotency-Key

Для критичных POST/command endpoint’ов рассмотреть:

```text
Idempotency-Key: <unique-value>
```

Пример:

```text
POST /payments
Idempotency-Key: abc-123
```

Первый запрос:

```text
payment created
response stored
```

Повтор:

```text
same key
same logical request
↓
same result
no duplicate side effect
```

## 122.3 Idempotency Key Storage

Проверить хранение:

```text
key
user/session
endpoint/action
request fingerprint
status
response code
response body/reference
created_at
expires_at
```

Не допускать reuse одного key с другим payload.

Если:

```text
same key
different payload
```

ожидание:

```text
409 / validation error
```

или иной явно задокументированный отказ.

## 122.4 Atomic Idempotency

Критично:

Проверить, что:

```text
check key
+
execute side effect
+
save idempotency result
```

не реализованы как три небезопасных независимых шага.

Иначе два concurrent requests могут пройти проверку одновременно.

Использовать:

- unique constraint;
- transaction;
- row lock;
- atomic insert;
- compare-and-set;
- distributed lock только если действительно нужен.

## 122.5 Duplicate Request Concurrency

Тестировать:

```text
2 requests simultaneously
10 requests simultaneously
100 duplicate requests
```

с одним idempotency key.

Ожидание:

```text
one logical side effect
```

## 122.6 Payment / Billing Idempotency

Обязательно проверить:

- charge;
- subscription creation;
- purchase;
- refund;
- credit/debit;
- quota deduction;
- AI paid action.

Не должно быть:

```text
timeout
↓
client retries
↓
double charge
```

## 122.7 Webhook Idempotency

Webhook часто доставляется at-least-once.

Проверить:

```text
same webhook event delivered 2–20 times
```

Использовать provider event ID / unique event key.

Ожидание:

```text
one state transition
```

Проверить:

- duplicate delivery;
- delayed delivery;
- out-of-order delivery;
- replay attack;
- signature + timestamp validation;
- event retention.

## 122.8 Queue / Worker Idempotency

Сценарий:

```text
worker performs action
↓
crashes before ACK
↓
message redelivered
```

Вторая обработка не должна создавать второй side effect.

Проверить:

- job IDs;
- deduplication;
- inbox table;
- unique constraints;
- idempotent handlers;
- external provider idempotency keys.

## 122.9 Token Refresh Idempotency / Concurrency

Особый случай.

Два параллельных запроса:

```text
Refresh A
Refresh A
```

могут вызвать гонку при rotation.

Проверить:

- single-use refresh;
- reuse detection;
- grace window, если он предусмотрен;
- concurrent browser tabs;
- atomic rotation;
- session family state.

Не допускать случайного выпуска нескольких независимых refresh descendants из одного одноразового token, если политика это запрещает.

## 122.10 Logout Idempotency

Повтор:

```text
POST /logout
POST /logout
POST /logout
```

не должен:

- возвращать server error;
- восстанавливать session;
- ломать состояние;
- создавать новые side effects.

Конечное состояние:

```text
session revoked
```

## 122.11 Account Deletion Idempotency

Повторный delete должен приводить к одному конечному состоянию.

Проверить:

- повторную deletion job;
- repeated external processor delete;
- repeated cache cleanup;
- repeated file deletion;
- already-deleted objects;
- tombstone state.

## 122.12 Idempotent State Transitions

Например:

```text
activate subscription
```

не должна повторно:

- начислять бонус;
- отправлять несколько обязательных side-effect событий;
- дублировать entitlements;
- создавать повторный invoice.

Сама операция должна разделять:

```text
desired state
vs
side effect occurrence
```

## 122.13 PUT / PATCH Semantics

Проверить:

```text
PATCH balance += 10
```

не является идемпотентным:

повтор:

```text
+10
+10
```

даёт другой результат.

Вместо этого для критичных команд нужен отдельный command/idempotency mechanism.

Проверить разницу:

```text
SET balance = 100
```

и:

```text
INCREMENT balance by 10
```

## 122.14 AI Operations Idempotency

Если AI-запрос:

- списывает quota;
- создаёт dialog message;
- запускает expensive job;
- создаёт файл;
- отправляет notification;

проверить повтор после timeout/reconnect.

Не должно быть:

```text
1 user action
→ 2 quota deductions
→ 2 messages
→ 2 jobs
```

если это не предусмотрено.

## 122.15 File Upload Idempotency

Проверить:

- duplicate upload retry;
- same multipart request;
- same content;
- object storage key collision;
- metadata duplication;
- antivirus/processing jobs duplication.

## 122.16 Idempotency TTL

Определить:

```text
сколько хранить idempotency keys
```

TTL должен быть длиннее разумного retry window.

Проверить последствия слишком короткого TTL:

```text
original key expired
↓
late retry
↓
duplicate side effect
```

## 122.17 Idempotency Response Replay

Определить policy:

При повторе возвращать:

- исходный response;
- ссылку на исходный resource;
- актуальное resource state;
- conflict.

Поведение должно быть стабильным и документированным.

## 122.18 Idempotency + Authorization

Idempotency key должен быть scoped минимум к:

```text
user / account / tenant
+
operation
```

Пользователь B не должен получить результат запроса пользователя A, просто угадав idempotency key.

## 122.19 Idempotency Logging / Observability

Логировать безопасно:

```text
idempotency_key_hash
operation
first_seen
duplicate_detected
final_result
request_id
```

Не логировать чувствительный raw key, если он является security-sensitive.

Метрики:

```text
duplicate request rate
idempotency conflict rate
replayed webhook count
duplicate job count
refresh reuse count
```

## 122.20 Idempotency Acceptance Tests

Обязательные тесты:

```text
double-click POST → one resource
same request 10 times → one side effect
same key + same payload → same logical result
same key + different payload → rejected
concurrent same key → one side effect
worker crash before ACK → no duplicate effect
webhook replay → one transition
payment timeout + retry → one charge
logout repeated → stable revoked state
account deletion repeated → stable deleted state
refresh token concurrent reuse → expected rotation policy
AI timeout + retry → quota deducted once
```

---

# 123. Consistency + Idempotency Combined Failure Matrix

Для критичных бизнес-операций составить таблицу.

| Операция | Повтор запроса | Concurrent запрос | Частичный сбой | Cache stale | Queue replay | External retry | Ожидаемый invariant |
|---|---|---|---|---|---|---|---|
| Login | проверить | проверить | проверить | N/A | N/A | N/A | одна корректная session policy |
| Token refresh | критично | критично | критично | session state | N/A | N/A | одна допустимая rotation chain |
| Logout | безопасный повтор | проверить | проверить | invalidate | close WSS | N/A | session revoked |
| Profile update | повтор безопасен по контракту | проверить lost update | rollback | invalidate | event replay | N/A | DB/cache consistent |
| Payment | критично | критично | critical | N/A | replay-safe | provider retry | один charge |
| AI message | критично | проверить | critical | dialog cache | job replay | model retry | один logical message/quota charge |
| Account delete | повтор безопасен | проверить | critical | clear | job replay | processor retry | один deleted final state |
| Webhook | replay-safe | проверить | partial | N/A | duplicate | provider resend | one state transition |

---

# 124. Дополнение к Definition of Done

Аудит не считается завершённым, пока не выполнено:

- [ ] Проверены cross-table invariants.
- [ ] Проверена DB ↔ cache consistency.
- [ ] Проверена read-after-write consistency.
- [ ] Проверена replica lag policy, если есть replicas.
- [ ] Проверена DB ↔ queue consistency.
- [ ] Проверены duplicate/out-of-order events.
- [ ] Проверены distributed partial failures.
- [ ] Проверена REST ↔ WSS consistency.
- [ ] Для critical POST/commands определена idempotency policy.
- [ ] Проверены concurrent duplicate requests.
- [ ] Проверены repeated webhooks.
- [ ] Проверены repeated background jobs.
- [ ] Проверена idempotent token rotation/session behavior.
- [ ] Проверены AI operations на duplicate side effects.
- [ ] Для каждого критичного workflow сформулирован invariant.
- [ ] Есть негативные тесты, которые искусственно создают partial failure.

