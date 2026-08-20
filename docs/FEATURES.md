# Features

Единая матрица продуктовых фич Yuni. Источник каждого факта — реальный файл в репозитории, а не предположение.

Статусы: `done` — реализовано и покрыто тестами; `partial` — реализовано, но с известными ограничениями; `planned` — не реализовано.

Последнее обновление: 2026-08-20. Проверено на commit `42db25f`, последний merged PR — #80.

В этой ревизии сверены по коду и подтверждены: rate limits
(`common/rate-limit/rate-limit.constants.ts`), cooldowns LIKE 3 / SKIP 1 дня
(`likes.service.ts:19-20`), match TTL 7 дней (`matches.service.ts:26`), лимиты
пагинации 20/50 (`common/pagination/cursor-pagination.dto.ts:4-5`) и собственный
`DISCOVERY_MAX_LIMIT = 20`, MIME-ограничения и лимит 6 фотографий
(`media/media.constants.ts`), инвентарь тестов. Строки, подтвердить которые
кодом не удалось, оставлены как есть и не переписывались.

---

## Auth

**Статус:** `done`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | `apps/backend/src/modules/auth/auth.controller.ts` |
| Frontend UI | sign-in и sign-up формы, real backend integration | `apps/frontend/features/auth/`, `apps/frontend/app/(auth)/` |
| Frontend API client | `authApi` + `AuthContext` (access token в memory, refresh в HttpOnly cookie) | `apps/frontend/lib/auth-api.ts`, `apps/frontend/lib/auth-context.tsx` |
| Backend tests | `auth.service.spec.ts` | `apps/backend/src/modules/auth/auth.service.spec.ts` |
| Rate limits | register: 3/hour/IP; login: 20/10min/IP + 5/10min/IP+email; refresh и logout: 30/10min/IP | `apps/backend/src/common/rate-limit/rate-limit.constants.ts` |

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
| Frontend UI | режим просмотра по умолчанию, редактирование в отдельной панели с явным «Сохранить»/«Отмена» и предупреждением о несохранённом (Task 069); та же форма — в онбординге `/onboarding` сразу после регистрации (Task 070) | `apps/frontend/app/(app)/profile/page.tsx`, `apps/frontend/features/profile/`, `apps/frontend/app/onboarding/` |
| Frontend API client | `profileApi` | `apps/frontend/lib/profile-api.ts` |
| Backend tests | `profiles.service.spec.ts` | `apps/backend/src/modules/profiles/profiles.service.spec.ts` |
| Profile completion | вычисляется backend из 7 обязательных полей + qualifying photo; self API возвращает `completion` | `apps/backend/src/modules/profiles/profile-completion.policy.ts` |

**Ограничения:**
- `gender` и `lookingFor` временно остаются непустыми free-text строками; canonical enum contract требует отдельной задачи (Task 035). Следствие: заглушка аватара не распознаёт «женщина» как `female` и отдаёт нейтральный вариант.
- Дата рождения задаётся при регистрации и пользователем не редактируется.
- Поля height, occupation, education присутствуют в frontend типах и mock-data, но не реализованы в backend profile schema как часть текущего MVP.
- Интересы: таблицы `Interest` и `ProfileInterest` есть в схеме, но ни одного эндпоинта нет и `UpdateProfileDto` их не принимает; в backend-коде они читаются только сериализатором экспорта. Кнопка «Добавить» в UI неактивна (Task 050).
- `Profile.latitude` и `Profile.longitude` объявлены в схеме, но никогда не заполняются: кода, который бы их писал, в `apps/backend/src` нет.

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
| MIME limits | JPEG, PNG, WebP; max 5 MB; не более 6 фотографий на профиль | `apps/backend/src/modules/media/media.constants.ts` |
| Rate limits | upload: 20/hour/user; остальные действия: 60/hour/user | `apps/backend/src/common/rate-limit/rate-limit.constants.ts` |
| Заглушка аватара | `defaultAvatarUrl(gender, variant)` — гендерные WebP в двух кропах и нейтральный SVG; `/hero-portrait.jpg` больше не используется как аватар (Task 071) | `apps/frontend/lib/default-avatar.ts` |

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
| Backend filters | исключает: self, inactive users, is_discoverable=false, computed-incomplete profile, нет approved/published public photo, active block в любую сторону, active LIKE/SKIP cooldown, active match | `docs/api/README.md` |
| Rate limits | 120 req/10min/user | `docs/api/README.md` |

**Ограничения:**
- Геолокация и radius filter не реализованы; колонки `latitude`/`longitude` существуют, но никогда не заполняются.
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
- Superlike не реализован: значение `superlike` есть в enum `LikeKind` (`schema.prisma:29`), но во всём `apps/backend/src` оно не встречается ни разу — эндпоинта нет.
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

**Статус:** `partial`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | list/read/send плюс stage, starters и game current/postpone/answer | `apps/backend/src/modules/chat/chat.controller.ts` |
| Frontend UI | messages page: список conversations + просмотр + отправка сообщений | `apps/frontend/app/(app)/messages/page.tsx` |
| Frontend API client | `chatApi` | `apps/frontend/lib/chat-api.ts` |
| Backend tests | `chat.service.spec.ts` | `apps/backend/src/modules/chat/chat.service.spec.ts` |
| Access control | send разрешён только active participant в active conversation; active block в любую сторону возвращает `403` | `docs/api/README.md` |
| Message contract | text, staged metadata, voice duration/weight и system transition messages; тело не логируется | `docs/api/README.md` |
| Staged mechanics | stages 1–3, игры по message-weight thresholds, postpone один раз, переходы после 2/3 завершённых игр | `apps/backend/src/modules/chat/chat.service.ts` |
| Rate limits | 30 msg/min + 120 msg/10min | `docs/api/README.md` |

**Ограничения:**
- WebSocket/realtime **не реализован**; polling или ручное обновление.
- Read receipts не реализованы.
- Typing indicators не реализованы.
- Настоящая загрузка/проверка длительности/обрезка voice media не реализована; `voiceDurationSec` — число от клиента (Task 068).
- Nullable system sender расходится с frontend DTO; staged contract tests отсутствуют (Task 048).
- Поиск по чату не реализован.

**Закрыто с прошлой ревизии** (стояло здесь как ограничение, реализовано):

- Гонка при завершении игр — Task 043, PR #39.
- Гонка при отправке голосовых поверх лимита этапа 2 — Task 044: `lockAndReloadConversation` берёт `SELECT ... FOR UPDATE` и пересчитывает остаток внутри транзакции.
- Пустой `GET /chat/starters` на чистой БД — Task 045, PR #77: `conversation_starters` наполняется четырьмя активными фразами демо-сидом. На незасеянной базе список по-прежнему пуст — production-пути наполнения каталога нет.

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

## Settings

**Статус:** `done`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `GET`/`PATCH /settings/privacy`, `GET`/`PATCH /settings/notifications` | `apps/backend/src/modules/settings/settings.controller.ts` |
| Frontend UI | `/settings/privacy` (8 переключателей) и `/settings/notifications` (4 переключателя); переключение оптимистичное, при ошибке запроса значение откатывается | `apps/frontend/app/(app)/settings/`, `apps/frontend/features/settings/` |
| Frontend API client | `settingsApi` | `apps/frontend/lib/settings-api.ts` |
| Backend tests | `settings.service.spec.ts`, `settings.e2e-spec.ts` | `apps/backend/src/modules/settings/`, `apps/backend/test/` |

**Ограничения:**
- `isDiscoverable` в профиле и `PrivacySettings.discoverable` — два независимых флага, рассинхронизированы (Task 061).
- `anonymousAvatarKey` вынесен в отдельное security-решение и в API не отдаётся.
- Смены пароля и удаления аккаунта в настройках нет — соответствующих эндпоинтов не существует.

---

## Экспорт персональных данных

**Статус:** `partial`

| Аспект | Состояние | Источник |
|---|---|---|
| Backend endpoints | `GET /users/me/export` под `JwtAccessGuard` | `apps/backend/src/modules/users/users.controller.ts` |
| Состав выгрузки | allowlist по Prisma `select`, нигде `include`: новое поле схемы по умолчанию в выгрузку не попадает | `apps/backend/src/modules/users/user-data-export.serializer.ts` |
| Frontend UI | **отсутствует** — эндпоинт доступен только прямым запросом | — |
| Backend tests | `users.service.spec.ts`, `user-data-export.e2e-spec.ts` | `apps/backend/src/modules/users/`, `apps/backend/test/` |
| Rate limits | 3/hour/user + 10/hour/IP | `apps/backend/src/common/rate-limit/rate-limit.constants.ts` |

**Ограничения:**
- Кнопки в интерфейсе нет; TODO-блок на `/privacy` про обработку писем в срок до 30 дней снят не был — он правится, когда закрыта и вторая половина Task 067.
- Фотографии выгружаются метаданными и `publicUrl`; сами файлы в JSON не вкладываются.
- Сообщения собеседника не выгружаются намеренно (ст. 15(4) GDPR), поэтому экспорт диалога односторонний.
- `likesReceived`, `blockedByUsers`, `reportsReceived`, `notificationsActed` исключены целиком; секция интересов присутствует в контракте и всегда пуста.
- Удаления аккаунта (`DELETE /users/me`) не существует — Task 067b.

---

## Инфраструктура и cross-cutting

| Аспект | Состояние | Источник |
|---|---|---|
| Health endpoint | `GET /health` — проверяет доступность Postgres (`SELECT 1`); 200 + `status: ok` либо 503 + `status: degraded` и `dependencies.database: down` | `apps/backend/src/modules/health/health.controller.ts` |
| Rate limiting | global fallback (300 req/10min/IP) + per-endpoint in-memory limiter | `docs/api/README.md`, `apps/backend/src/common/rate-limit/` |
| Cursor pagination | реализована для всех list endpoints (default 20, max 50) | `apps/backend/src/common/pagination/` |
| Safe serializers | запрет raw Prisma rows; storageKey/paths не отдаются клиенту | `apps/backend/src/common/serializers/`, `docs/security/data-exposure-rules.md` |
| Security helpers | `assertOwner`, `assertConversationMember`, `assertMatchParticipant`, `assertCanAccessProfile`, `assertCanAccessPhoto` | `apps/backend/src/common/security/access-control.spec.ts` |
| Docker Compose | local development workflow (postgres + backend + frontend) | `docker-compose.yml`, `docs/onboarding/local-docker-workflow.md` |
| CI | GitHub Actions `quality-gates` на PR и push в main | `.github/` |
| Backend test inventory | 20 unit-spec-файлов и 6 e2e-файлов: `game-race`, `match-block-chat`, `media-path-params`, `profile-completion`, `settings`, `user-data-export`. Прогон на `42db25f`: 20 сьютов / 211 unit-тестов зелёные; e2e не запускались — нужен реальный Postgres | `apps/backend/src/`, `apps/backend/test/` |
| Frontend tests | отсутствуют: ни одного `*.test.*` или `*.spec.*` в `apps/frontend` | — |
| CD | публикация образов backend/frontend в GHCR (Task 065); деплоя в окружение нет | `.github/workflows/application-images.yml` |
| Production deployment | **не реализован** | `docs/PROJECT_STATE.md` |
| Демо-данные | `pnpm --dir apps/backend prisma:seed` — 9 анкет с фото, матч, диалоги на этапах 1 и 2, наполненная `conversation_starters`; guard против production и `yuni_test` | `apps/backend/prisma/seed/`, `apps/backend/README.md` |
| Demo mode | удалён (Task 038): `DemoSessionProvider` и `DemoGate` нигде не подключались | — |

---

## Сводная таблица по доменам

| Домен | Backend | Frontend | Тесты (backend) | Статус |
|---|---|---|---|---|
| Auth | register, login, refresh, logout, me | sign-in, sign-up формы | ✓ | `done` |
| Profiles | GET/PATCH me, GET :handle | просмотр + редактирование в панели, онбординг | ✓ | `done` |
| Media | upload, list, set primary, delete | загрузка/удаление фото, заглушки аватара по полу | ✓ | `partial` — local storage, нет EXIF/CDN |
| Discovery | GET /cards | discover page, swipe, like/skip | ✓ | `done` |
| Likes | like, skip | swipe actions + match overlay | ✓ | `done` |
| Matches | GET /me, start conversation | matches page | ✓ | `done` |
| Chat | conversations, staged metadata, games, starters | messages page | ✓ | `partial` — voice audio (068) и contract gaps (048) |
| Moderation | block/unblock/list, report | action из matches page | ✓ | `done` — нет admin UI |
| Notifications | list, unread-count, mark read | notifications page | ✓ | `done` — нет push/realtime |
| Settings | GET/PATCH privacy и notifications | два экрана настроек | ✓ | `done` |
| Health | GET /health с проверкой Postgres | — | ✓ | `done` |
| Экспорт данных | GET /users/me/export | **нет** | ✓ | `partial` — нет UI, фото без файлов |
| Удаление аккаунта | **нет** | нет | — | `planned` |
| Интересы | **нет** (только таблицы в схеме) | кнопка «Добавить» неактивна | — | `planned` |
| Password reset | **нет** | UI stub (mock) | — | `planned` |
| Email verification | **нет** | нет | — | `planned` |
| Admin panel | **нет** | нет | — | `planned` |
| Superlike | **нет** (только значение в enum `LikeKind`) | нет | — | `planned` |
| Realtime/WebSocket | **нет** | нет | — | `planned` |
| Production deployment | **нет** (образы публикуются в GHCR) | — | — | `planned` |
