---
title: "Матрица фич"
weight: 30
---


Единая матрица продуктовых фич Yuni. Источник каждого факта — реальный файл в репозитории.

Статусы: `done` — реализовано и покрыто тестами; `partial` — реализовано, но с известными ограничениями; `planned` — не реализовано.

Последнее обновление: 2026-08-20. Проверено на commit `42db25f`.

> Эта страница — ручная копия `docs/FEATURES.md`. Скрипта синхронизации нет;
> при расхождении источником истины считается файл в `docs/`.
>
> В этой ревизии сверены по коду: rate limits, cooldowns, match TTL, лимиты
> пагинации, MIME-ограничения медиа и инвентарь тестов. Остальные строки
> перенесены как есть и отдельно не перепроверялись.

## Сводная таблица по доменам

| Домен | Backend | Frontend | Тесты (backend) | Статус |
|---|---|---|---|---|
| Auth | register, login, refresh, logout, me | sign-in, sign-up формы | ✓ | `done` |
| Profiles | GET/PATCH me, GET :handle | режим просмотра + редактирование в панели, онбординг после регистрации | ✓ | `done` |
| Media | upload, list, set primary, delete | загрузка/удаление фото, заглушки аватара по полу | ✓ | `partial` — local storage, нет EXIF/CDN |
| Discovery | GET /cards | discover page, swipe, like/skip | ✓ | `done` |
| Likes | like, skip | swipe actions + match overlay | ✓ | `done` |
| Matches | GET /me, start conversation | matches page | ✓ | `done` |
| Chat | conversations, staged metadata, games, starters | messages page | ✓ | `partial` — voice audio и contract gaps |
| Moderation | block/unblock/list, report | action из matches page | ✓ | `done` — нет admin UI |
| Notifications | list, unread-count, mark read | notifications page | ✓ | `done` — нет push/realtime |
| Settings | GET/PATCH /settings/privacy и /settings/notifications | `/settings/privacy`, `/settings/notifications` | ✓ | `done` |
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

## Auth

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Frontend UI | sign-in и sign-up формы, real backend integration |
| Rate limits | register: 3/hour/IP; login: 20/10min/IP + 5/10min/IP+email; refresh и logout: 30/10min/IP |

**Ограничения:** Email verification не реализована — `emailVerifiedAt` никогда не заполняется. Password reset — UI stub без backend endpoint.

## Profiles

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /profiles/me`, `PATCH /profiles/me`, `GET /profiles/:handle` |
| Frontend UI | режим просмотра по умолчанию, редактирование в отдельной панели с явным сохранением (Task 069); та же форма используется онбордингом `/onboarding` (Task 070) |
| Profile completion | вычисляется бэкендом из 7 обязательных полей и qualifying photo; список полей — единственный источник и для формы, и для проверки |
| Rate limits | публичный просмотр по handle: 120/10min/user |

**Ограничения:** `gender` и `lookingFor` — свободный текст, canonical enum contract требует отдельной задачи (Task 035). Дата рождения задаётся при регистрации и не редактируется. Поля interests, height, occupation, education в backend profile schema отсутствуют.

## Media (Profile Photos)

**Статус:** `partial`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /media/profile-photos/me`, `POST /media/profile-photos`, `PATCH /media/profile-photos/:photoId/primary`, `DELETE /media/profile-photos/:photoId` |
| Storage | Local adapter, папка `apps/backend/uploads/profile-photos` |
| MIME limits | JPEG, PNG, WebP; max 5 MB; не более 6 фотографий на профиль |
| Rate limits | upload: 20/hour/user; остальные действия: 60/hour/user |
| Заглушка аватара | `defaultAvatarUrl(gender, variant)` — гендерные WebP и нейтральный SVG (Task 071) |

**Ограничения:** Image sanitization и EXIF stripping не реализованы. Object storage/CDN не реализованы. Pending/private media lifecycle не реализован — фотографии получают `approved` сразу при загрузке.

## Discovery

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /discovery/cards` (cursor pagination, default и max limit — 20) |
| Фильтры | self, inactive users, non-discoverable, computed-incomplete profile, нет approved/published фото, active block, active LIKE/SKIP cooldown, active match |
| Rate limits | 120 req/10min/user |

**Ограничения:** Геолокация не реализована (`Profile.latitude`/`longitude` есть в схеме, но никогда не заполняются). Ранжирование не реализовано. Premium-фильтры не реализованы.

## Likes

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `POST /likes/:targetProfileUserId`, `POST /likes/:targetProfileUserId/skip` |
| Cooldowns | LIKE: 3 дня; SKIP: 1 день |
| Rate limits | 60 req/hour/user (shared LIKE + SKIP) |

**Ограничения:** Superlike не реализован: значение `superlike` есть в enum `LikeKind`, эндпоинта нет. `GET /likes/me` не реализован.

## Matches

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /matches/me`, `POST /matches/:matchId/conversation` |
| Match TTL | 7 дней с момента создания |
| Block + match | block завершает active match (`status=blocked`), сериализовано advisory-локом по паре пользователей (Task 042) |

**Ограничения:** Cron для auto-expire не реализован; expiry применяется фильтром на чтение. Unmatch не реализован.

## Chat

**Статус:** `partial`

| Аспект | Состояние |
|---|---|
| Endpoints | list/read/send плюс stage, starters и game current/postpone/answer |
| Staged mechanics | stages 1–3; игры по message weight; system transition messages |
| Message contract | text, `voiceDurationSec`, `messageWeight`, `isSystemMessage` |
| Rate limits | 30 msg/min + 120 msg/10min |
| Starters | `conversation_starters` наполняется демо-сидом (Task 045/072); `GET /chat/starters` больше не возвращает `[]` на засеянной базе |

**Ограничения:** WebSocket/realtime не реализован. `voiceDurationSec` доверяет числу клиента, реальной загрузки и обрезки аудио нет (Task 068). Contract alignment по nullable system sender открыт (Task 048). Гонки при завершении игр и отправке голосовых закрыты — Task 043 и Task 044.

## Settings

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET`/`PATCH /settings/privacy`, `GET`/`PATCH /settings/notifications` |
| Frontend UI | `/settings/privacy` (8 переключателей), `/settings/notifications` (4 переключателя); переключение оптимистичное с откатом при ошибке |

**Ограничения:** `isDiscoverable` в профиле и `PrivacySettings.discoverable` — два независимых флага, рассинхронизированы (Task 061). `anonymousAvatarKey` вынесен в отдельное security-решение.

## Экспорт персональных данных

**Статус:** `partial`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /users/me/export` под `JwtAccessGuard` |
| Состав | allowlist по Prisma `select`; второй участник диалога — всегда голый UUID |
| Rate limits | 3/hour/user + 10/hour/IP |

**Ограничения:** Кнопки в интерфейсе нет — эндпоинт доступен только прямым запросом. Фотографии выгружаются метаданными и `publicUrl`, сами файлы в JSON не вкладываются. Сообщения собеседника не выгружаются намеренно (ст. 15(4) GDPR), поэтому экспорт диалога односторонний. Секция интересов присутствует в контракте и всегда пуста.

## Moderation (Blocks & Reports)

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `POST /blocks/:targetUserId`, `DELETE /blocks/:targetUserId`, `GET /blocks/me`, `POST /reports` |
| Report reasons | spam, fake_profile, harassment, sexual_content, hate_speech, scam_or_money, underage_suspected, violence_or_threats, other |
| Rate limits | `POST /reports`: 10/hour/user |

**Ограничения:** Admin/moderation panel не реализован. Автоматическая обработка жалоб не реализована. Жалоба привязана к пользователю целиком, хотя схема поддерживает привязку к контенту (Task 062).

## Notifications

**Статус:** `done`

| Аспект | Состояние |
|---|---|
| Endpoints | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:notificationId/read`, `POST /notifications/read-all` |
| Типы | `match_created`, `message_received`, `system` |
| Rate limits | GET: 120/10min; unread-count: 240/10min; mark-read: 120/10min |

**Ограничения:** WebSocket/realtime не реализован. Push/email notifications не реализованы.

## Инфраструктура

| Аспект | Состояние |
|---|---|
| Health endpoint | `GET /health` — `SELECT 1` через Prisma; 200 + `status: ok` либо 503 + `dependencies.database: down` |
| Cursor pagination | default 20, max 50 (`common/pagination/cursor-pagination.dto.ts`); Discovery использует собственный DTO с max 20 |
| Rate limiting | global fallback + per-endpoint in-memory limiter |
| CI | GitHub Actions `quality-gates` на PR и push в main; Postgres 16 сервисом, backend e2e отдельным шагом |
| CD | публикация образов backend/frontend в GHCR; деплоя в окружение нет |
| Демо-данные | `pnpm --dir apps/backend prisma:seed` — 9 анкет, матч, диалоги на этапах 1 и 2; guard против production и `yuni_test` |
| Demo mode | удалён (Task 038) |

## Test inventory

В репозитории зафиксированы 20 unit-spec-файлов и 6 e2e-файлов: `game-race`, `match-block-chat`, `media-path-params`, `profile-completion`, `settings`, `user-data-export`.

Число unit-тестов взято из прогона на `42db25f`: 20 сьютов, 211 тестов, все зелёные. E2E не запускались — им нужен реальный Postgres, по ним зафиксирован только инвентарь файлов.

Frontend-тестов нет: в `apps/frontend` ни одного `*.test.*` или `*.spec.*`.
