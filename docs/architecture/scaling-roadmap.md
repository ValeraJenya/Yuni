# Scaling Roadmap

Yuni should scale by strengthening the modular monolith first, then extracting only proven bottlenecks.

Microservices are not the current strategy.

## Stage 1 - Modular Monolith

Current target.

- One Next.js frontend.
- One NestJS backend.
- PostgreSQL via Prisma migrations.
- Local Docker/PostgreSQL workflow.
- Shared docs and architecture conventions.
- Domain modules inside one backend process.

Goal: small team can ship MVP safely without distributed-system overhead.

## Stage 2 - Production-Ready Monolith

Before wider testing:

- Docker Compose server deployment;
- Nginx or equivalent reverse proxy;
- HTTPS;
- PostgreSQL backups and restore drills;
- CI/CD;
- logs and basic monitoring;
- error tracking;
- documented deploy and rollback steps.

Goal: one service boundary, but operationally reliable.

## Stage 3 - Object Storage / CDN for Media

After local upload MVP is stable:

- replace local uploads with object storage;
- add CDN delivery;
- add signed/private media access where needed;
- move media metadata and visibility rules through backend;
- add production media moderation pipeline.

Goal: media storage no longer depends on one backend filesystem.

## Stage 4 - Redis / Valkey

Add only when there is a clear need:

- rate limit counters;
- short-lived cache;
- temporary state;
- idempotency or lock helpers if PostgreSQL alone is not enough.

Goal: support abuse prevention and hot-path temporary state without changing product module boundaries.

## Stage 5 - Workers / Queues

Add for heavy or async work:

- media processing;
- EXIF/metadata stripping;
- thumbnails or blurhash generation;
- notifications;
- moderation jobs;
- retryable background tasks.

Goal: keep request/response endpoints fast while preserving the same source of truth in PostgreSQL.

## Stage 6 - Realtime Chat Layer

After basic chat API exists:

- WebSocket gateway;
- message delivery state;
- read receipts;
- typing/presence if needed;
- anti-spam controls.

Goal: realtime behavior without moving all chat domain logic out of the monolith too early.

## Stage 7 - Discovery Optimization

After discover API exists and real usage data appears:

- strong indexes;
- cursor pagination;
- block-aware filtering;
- caching for repeated queries;
- possible search engine later if PostgreSQL is not enough.

Goal: improve discover latency and abuse resistance based on measured bottlenecks.

## Stage 8 - Selective Service Extraction

Only extract a service when the monolith has a proven bottleneck or operational mismatch.

Possible candidates:

- media worker;
- chat realtime;
- notifications;
- recommendations;
- analytics.

Extraction rule:

- first define the boundary inside the modular monolith;
- measure the bottleneck;
- extract only the narrow component that benefits;
- keep shared security and data exposure rules documented.

## What Not To Do Now

- Do not start with microservices.
- Do not add Redis/event bus without a concrete use case.
- Do not build a complex recommendation system before discover basics.
- Do not build production CDN/media pipeline before local upload flow is stable.
- Do not add heavy admin tooling before basic reports/blocks exist.
- Do not optimize for huge traffic before indexes, pagination and auth/media/security foundations are solid.
