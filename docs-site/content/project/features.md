---
title: "Матрица фич"
weight: 30
---


Единая матрица продуктовых фич Yuni. Источник каждого факта — реальный файл в репозитории.

Статусы: `done` — реализовано и покрыто тестами; `partial` — реализовано, но с известными ограничениями; `planned` — не реализовано.

Последнее обновление: 2026-06-26. Проверено на commit `6d3d399`.

## Сводная таблица по доменам

| Домен | Backend | Frontend | Тесты (backend) | Статус |
|---|---|---|---|---|
| Auth | register, login, refresh, logout, me | sign-in, sign-up формы | ✓ | `done` |
| Profiles | GET/PATCH me, GET :handle | просмотр + редактирование | ✓ | `done` |
| Media | upload, list, set primary, delete | загрузка/удаление фото в profile | ✓ | `partial` — local storage, нет EXIF/CDN |
| Discovery | GET /cards | discover page, swipe, like/skip | ✓ | `done` |
| Likes | like, skip | swipe actions + match overlay | ✓ | `done` |
| Matches | GET /me, start conversation | matches page | ✓ | `done` |
| Chat | conversations, messages, send | messages page | ✓ | `done` — нет realtime |
| Moderation | block/unblock/list, report | action из matches page | ✓ | `done` — нет admin UI |
| Notifications | list, unread-count, mark read | notifications page | ✓ | `done` — нет push/realtime |
| Password reset | **нет** | UI stub (mock) | — | `planned` |
| Email verification | **нет** | нет | — | `planned` |
| Admin panel | **нет** | нет | — | `planned` |
| Superlike | **нет** | нет | — | `planned` |
| Realtime/WebSocket | **нет** | нет | — | `planned` |
| Production deployment | **нет** | — | — | `planned` |

## Auth

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Frontend UI | sign-in и sign-up формы, real backend integration |
| Rate limits | register: 3/hour/IP; login: 20/10min/IP + 5/10min/IP+email |

**Ограничения:** Email verification не реализована. Password reset — UI stub без backend endpoint.

## Profiles

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /profiles/me`, `PATCH /profiles/me`, `GET /profiles/:handle` |
| Frontend UI | просмотр и редактирование (displayName, bio, city, country, gender, lookingFor, isDiscoverable) |

**Ограничения:** Profile completion lifecycle уточняется в Task 021.

## Media (Profile Photos)

**Статус:** `partial`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /media/profile-photos/me`, `POST /media/profile-photos`, `PATCH /media/profile-photos/:photoId/primary`, `DELETE /media/profile-photos/:photoId` |
| Storage | Local adapter, папка `apps/backend/uploads/profile-photos` |
| MIME limits | JPEG, PNG, WebP; max 5 MB |

**Ограничения:** Image sanitization и EXIF stripping не реализованы. Object storage/CDN не реализованы. Pending/private media lifecycle не реализован.

## Discovery

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /discovery/cards` (cursor pagination, max limit 20) |
| Фильтры | self, inactive users, non-discoverable, нет фото, active block, active LIKE/SKIP cooldown, active match |
| Rate limits | 120 req/10min/user |

**Ограничения:** Геолокация не реализована. Ранжирование не реализовано. Premium-фильтры не реализованы.

## Likes

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `POST /likes/:targetProfileUserId`, `POST /likes/:targetProfileUserId/skip` |
| Cooldowns | LIKE: 3 дня; SKIP: 1 день |
| Rate limits | 60 req/hour/user (shared LIKE + SKIP) |

**Ограничения:** Superlike не реализован. `GET /likes/me` не реализован.

## Matches

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /matches/me`, `POST /matches/:matchId/conversation` |
| Match TTL | 7 дней с момента создания |
| Block + match | block завершает active match (`status=blocked`) |

**Ограничения:** Cron для auto-expire не реализован. Unmatch не реализован.

## Chat

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /chat/conversations`, `GET /chat/conversations/:conversationId/messages`, `POST /chat/conversations/:conversationId/messages` |
| Message limits | max 2000 символов, plain text only |
| Rate limits | 30 msg/min + 120 msg/10min |

**Ограничения:** WebSocket/realtime не реализован. Read receipts, typing indicators, вложения не реализованы.

## Moderation (Blocks & Reports)

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `POST /blocks/:targetUserId`, `DELETE /blocks/:targetUserId`, `GET /blocks/me`, `POST /reports` |
| Report reasons | spam, fake_profile, harassment, sexual_content, hate_speech, scam_or_money, underage_suspected, violence_or_threats, other |
| Rate limits | `POST /reports`: 10/hour/user |

**Ограничения:** Admin/moderation panel не реализован. Автоматическая обработка жалоб не реализована.

## Notifications

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:notificationId/read`, `POST /notifications/read-all` |
| Типы | `match_created`, `message_received`, `system` |
| Rate limits | GET: 120/10min; unread-count: 240/10min |

**Ограничения:** WebSocket/realtime не реализован. Push/email notifications не реализованы.
