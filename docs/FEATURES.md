# Features

Единая матрица продуктовых фич Yuni. Источник каждого факта — реальный файл в репозитории, а не предположение.

Статусы: `done` — реализовано и покрыто тестами; `partial` — реализовано, но с известными ограничениями; `planned` — не реализовано.

Последнее обновление: 2026-06-26. Проверено на commit `6d3d399` (`origin/main`).

---

## Auth

**Статус:** `done`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | `apps/backend/src/modules/auth/auth.controller.ts` |
| Frontend UI | sign-in и sign-up формы, real backend integration | `apps/frontend/features/auth/`, `apps/frontend/app/(auth)/` |
| Frontend API client | `authApi` + `AuthContext` (access token в memory, refresh в HttpOnly cookie) | `apps/frontend/lib/auth-api.ts`, `apps/frontend/lib/auth-context.tsx` |
| Backend tests | `auth.service.spec.ts` | `apps/backend/src/modules/auth/auth.service.spec.ts` |
| Rate limits | register: 3/hour/IP; login: 20/10min/IP + 5/10min/IP+email | `docs/api/README.md` |

**Ограничения:**
- Email verification не реализована (нет backend endpoint).
- Password reset: UI страница существует (`app/(auth)/forgot-password/page.tsx`), но backend endpoint отсутствует; текущая реализация — mock (`setTimeout`).
- Superlike не реализован.

---

## Profiles

**Статус:** `done`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `GET /profiles/me`, `PATCH /profiles/me`, `GET /profiles/:handle` | `apps/backend/src/modules/profiles/profiles.controller.ts` |
| Frontend UI | profile page: просмотр, редактирование полей (displayName, bio, city, country, gender, lookingFor, isDiscoverable) | `apps/frontend/app/(app)/profile/page.tsx` |
| Frontend API client | `profileApi` | `apps/frontend/lib/profile-api.ts` |
| Backend tests | `profiles.service.spec.ts` | `apps/backend/src/modules/profiles/profiles.service.spec.ts` |

**Ограничения:**
- Profile completion lifecycle (обязательные поля, discoverability) уточняется в Task 021 (backlog).
- Поля interests, height, occupation, education присутствуют в frontend типах и mock-data, но не реализованы в backend profile schema как часть текущего MVP.

---

## Media (Profile Photos)

**Статус:** `partial`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `GET /media/profile-photos/me`, `POST /media/profile-photos`, `PATCH /media/profile-photos/:photoId/primary`, `DELETE /media/profile-photos/:photoId` | `apps/backend/src/modules/media/media.controller.ts` |
| Frontend UI | upload, set primary, delete в profile page | `apps/frontend/app/(app)/profile/page.tsx` |
| Frontend API client | `profileApi` (foto methods) | `apps/frontend/lib/profile-api.ts` |
| Backend tests | `media.service.spec.ts`, `local-profile-photo-storage.service.spec.ts` | `apps/backend/src/modules/media/media.service.spec.ts`, `apps/backend/src/modules/media/storage/` |
| Storage adapter | `ProfilePhotoStorage` boundary; current adapter сохраняет в `apps/backend/uploads/profile-photos` | `apps/backend/src/modules/media/storage/` |
| Public URL contract | `/uploads/profile-photos/<generated-uuid>` | `docs/api/README.md` |
| MIME limits | JPEG, PNG, WebP; max 5 MB | `docs/api/README.md` |

**Ограничения:**
- Image sanitization и EXIF stripping **не реализованы**.
- Object storage/CDN (S3 и т.п.) **не реализованы**; используется local adapter.
- Pending/private media lifecycle (очередь модерации) **не реализован**; uploaded photos помечаются `approved` сразу.
- Production media pipeline запланирован как отдельный шаг (Task 023, backlog).

---

## Discovery

**Статус:** `done`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `GET /discovery/cards` (cursor pagination, max limit 20) | `apps/backend/src/modules/discovery/discovery.controller.ts` |
| Frontend UI | discover page: карточки профилей с reveal-эффектом, swipe actions (like/skip) | `apps/frontend/app/(app)/discover/page.tsx`, `apps/frontend/features/discover/` |
| Frontend API client | `discoveryApi` | `apps/frontend/lib/discovery-api.ts` |
| Backend tests | `discovery.service.spec.ts` | `apps/backend/src/modules/discovery/discovery.service.spec.ts` |
| Backend filters | исключает: self, inactive users, is_discoverable=false, нет completed_at, нет approved фото, active block в любую сторону, active LIKE/SKIP cooldown, active match | `docs/api/README.md` |
| Rate limits | 120 req/10min/user | `docs/api/README.md` |

**Ограничения:**
- Геолокация и radius filter не реализованы.
- Ранжирование (scoring/ranking) не реализовано; сортировка стабильная: `createdAt desc`, затем `userId desc`.
- Premium-фильтры не реализованы.
- Фильтры по возрасту/полу в UI присутствуют в виде UI-элементов, но не подключены к backend query.

---

## Likes

**Статус:** `done`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `POST /likes/:targetProfileUserId` (like), `POST /likes/:targetProfileUserId/skip` (skip/pass) | `apps/backend/src/modules/likes/likes.controller.ts` |
| Frontend UI | swipe actions в discover page; match overlay при взаимном лайке | `apps/frontend/app/(app)/discover/page.tsx` |
| Frontend API client | `likesApi` | `apps/frontend/lib/likes-api.ts` |
| Backend tests | `likes.service.spec.ts` | `apps/backend/src/modules/likes/likes.service.spec.ts` |
| Cooldowns | LIKE: 3 дня; SKIP: 1 день | `docs/api/README.md` |
| Rate limits | 60 req/hour/user (shared LIKE + SKIP) | `docs/api/README.md` |
| Block check | active block в любую сторону запрещает LIKE/SKIP | `docs/api/README.md` |

**Ограничения:**
- Superlike не реализован.
- `GET /likes/me` (история отправленных лайков) не реализован.

---

## Matches

**Статус:** `done`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `GET /matches/me`, `POST /matches/:matchId/conversation` | `apps/backend/src/modules/matches/matches.controller.ts`, `apps/backend/src/modules/chat/match-conversations.controller.ts` |
| Frontend UI | matches page: список активных матчей; block/report из matches page; переход в чат | `apps/frontend/app/(app)/matches/page.tsx` |
| Frontend API client | `matchesApi` | `apps/frontend/lib/matches-api.ts` |
| Backend tests | `matches.service.spec.ts` | `apps/backend/src/modules/matches/matches.service.spec.ts` |
| Match TTL | 7 дней с момента создания | `docs/api/README.md` |
| Match + block | block завершает active match (`status=blocked`), unblock не восстанавливает | `docs/api/README.md` |

**Ограничения:**
- Cron/job для автоматического перевода `status` в `expired` по истечении TTL не реализован; expiry применяется через фильтр `expiresAt > now` на чтение.
- Unmatch (разрыв матча без блока) не реализован.

---

## Chat

**Статус:** `done`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `GET /chat/conversations`, `GET /chat/conversations/:conversationId/messages`, `POST /chat/conversations/:conversationId/messages` | `apps/backend/src/modules/chat/chat.controller.ts` |
| Frontend UI | messages page: список conversations + просмотр + отправка сообщений | `apps/frontend/app/(app)/messages/page.tsx` |
| Frontend API client | `chatApi` | `apps/frontend/lib/chat-api.ts` |
| Backend tests | `chat.service.spec.ts` | `apps/backend/src/modules/chat/chat.service.spec.ts` |
| Access control | send разрешён только active participant в active conversation; active block в любую сторону возвращает `403` | `docs/api/README.md` |
| Message limits | max text 2000 символов; plain text only; тело не логируется | `docs/api/README.md` |
| Rate limits | 30 msg/min + 120 msg/10min | `docs/api/README.md` |

**Ограничения:**
- WebSocket/realtime **не реализован**; polling или ручное обновление.
- Read receipts не реализованы.
- Typing indicators не реализованы.
- Вложения/медиа-сообщения не реализованы.
- Поиск по чату не реализован.

---

## Moderation (Blocks & Reports)

**Статус:** `done`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `POST /blocks/:targetUserId`, `DELETE /blocks/:targetUserId`, `GET /blocks/me`, `POST /reports` | `apps/backend/src/modules/moderation/moderation.controller.ts` |
| Frontend UI | block/report действия доступны из matches page; `blocksApi` и `reportsApi` подключены | `apps/frontend/app/(app)/matches/page.tsx`, `apps/frontend/lib/blocks-api.ts`, `apps/frontend/lib/reports-api.ts` |
| Backend tests | `moderation.service.spec.ts` | `apps/backend/src/modules/moderation/moderation.service.spec.ts` |
| Report reasons | spam, fake_profile, harassment, sexual_content, hate_speech, scam_or_money, underage_suspected, violence_or_threats, other | `docs/api/README.md` |
| Block side effects | block завершает active match (`status=blocked`); active block скрывает пару из discovery, matches, chat, notifications | `docs/api/README.md` |
| Rate limits | `POST /reports`: 10/hour/user | `docs/api/README.md` |

**Ограничения:**
- `GET /reports/me` (история отправленных жалоб) не реализован.
- Admin/moderation panel не реализован.
- Автоматическая обработка жалоб не реализована; `status` фиксируется как `received`.
- Dedicated frontend UI для просмотра/управления своим списком блокировок отсутствует (только action из matches).

---

## Notifications

**Статус:** `done`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:notificationId/read`, `POST /notifications/read-all` | `apps/backend/src/modules/notifications/notifications.controller.ts` |
| Frontend UI | notifications page: список, mark read, unread-count badge | `apps/frontend/app/(app)/notifications/page.tsx` |
| Frontend API client | `notificationsApi` + `NOTIFICATIONS_UPDATED_EVENT` (custom DOM event) | `apps/frontend/lib/notifications-api.ts` |
| Backend tests | `notifications.service.spec.ts` | `apps/backend/src/modules/notifications/notifications.service.spec.ts` |
| Notification types | `match_created`, `message_received`, `system` | `docs/api/README.md` |
| Block filter | notifications от заблокированных пользователей скрываются | `docs/api/README.md` |
| Rate limits | GET: 120/10min; unread-count: 240/10min; mark-read: 120/10min | `docs/api/README.md` |

**Ограничения:**
- WebSocket/realtime delivery **не реализован**; frontend полагается на polling или ручное обновление через DOM event.
- Push notifications (mobile/browser) не реализованы.
- Email notifications не реализованы.
- Notification preferences UI не реализован.

---

## Инфраструктура и cross-cutting

| Аспект | Состояние | Источник |
|---|---|---|
| Health endpoint | `GET /health` — real check | `apps/backend/src/modules/health/health.controller.ts` |
| Rate limiting | global fallback (300 req/10min/IP) + per-endpoint in-memory limiter | `docs/api/README.md`, `apps/backend/src/common/rate-limit/` |
| Cursor pagination | реализована для всех list endpoints (default 20, max 50) | `apps/backend/src/common/pagination/` |
| Safe serializers | запрет raw Prisma rows; storageKey/paths не отдаются клиенту | `apps/backend/src/common/serializers/`, `docs/security/data-exposure-rules.md` |
| Security helpers | `assertOwner`, `assertConversationMember`, `assertMatchParticipant`, `assertCanAccessProfile`, `assertCanAccessPhoto` | `apps/backend/src/common/security/access-control.spec.ts` |
| Docker Compose | local development workflow (postgres + backend + frontend) | `docker-compose.yml`, `docs/onboarding/local-docker-workflow.md` |
| CI | GitHub Actions `quality-gates` на PR и push в main | `.github/` |
| Backend tests | 17 spec files, 166 tests passed (verified on ca50baf) | `apps/backend/src/`, `docs/PROJECT_STATE.md` |
| Frontend tests | отсутствуют | — |
| Production deployment | **не реализован** | `docs/PROJECT_STATE.md` |
| Demo mode | `DemoSessionProvider` (sessionStorage); `DemoGate` UI | `apps/frontend/lib/demo-session.tsx`, `apps/frontend/features/app-shell/components/demo-gate.tsx` |

---

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
