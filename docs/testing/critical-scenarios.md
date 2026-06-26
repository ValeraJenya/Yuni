# Critical Test Scenarios

Карта критичных тест-сценариев Yuni по состоянию на 2026-06-26.

Статусы:
- `covered` — сценарий покрыт unit-тестом в указанном spec-файле
- `not-covered` — теста нет; риск не закрыт
- `needs-recheck` — частично покрыт или покрыт на уровне mock-а, но требует интеграционного/e2e теста с реальной БД

Все тесты — unit-уровень с mock Prisma. Интеграционных и e2e тестов нет.

---

## Auth

Spec: `apps/backend/src/modules/auth/auth.service.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| Регистрация взрослого пользователя | happy | email нормализован lowercase, password захэширован, refresh token не в ответе | `covered` |
| Регистрация до 18 лет | negative | `BadRequestException` до DB-запроса | `covered` |
| birthDate в формате не YYYY-MM-DD | negative | `BadRequestException`, DB не вызывается | `covered` |
| birthDate в будущем | negative | `BadRequestException`, DB не вызывается | `covered` |
| Вход с верными credentials | happy | argon2.verify, access token + refresh cookie, `passwordHash` не в ответе | `covered` |
| Вход с неверным паролем | negative | `UnauthorizedException`, refresh token не создаётся | `covered` |
| Refresh: single-use rotation | happy | старый токен помечается `revoked`, новый выдаётся за одну транзакцию | `covered` |
| Refresh: повторное использование отозванного токена | negative | `UnauthorizedException`, транзакция не запускается | `covered` |
| Refresh: истёкший токен | negative | `UnauthorizedException` до транзакции | `covered` |
| Logout: idempotent revoke | happy | токен отзывается, повторный logout возвращает `success: true` без паники | `covered` |
| Использование отозванного токена после logout | negative | `UnauthorizedException` при попытке refresh | `covered` |
| Регистрация с дублирующимся email | negative | `BadRequestException` при `findFirst` возвращает user | `not-covered` |
| Регистрация с дублирующимся handle | negative | `BadRequestException` при `profile.findFirst` возвращает profile | `not-covered` |
| Вход disabled/deleted пользователя | negative | `UnauthorizedException` для `status=disabled` или `deletedAt != null` | `not-covered` |
| Race: два параллельных refresh с одной cookie | negative | DB exclusion constraint предотвращает двойную сессию | `needs-recheck` |

---

## Owner Checks (common)

Spec: `apps/backend/src/common/security/access-control.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| `assertOwner`: владелец ресурса | happy | не бросает исключение | `covered` |
| `assertOwner`: не-владелец | negative | `ForbiddenException` | `covered` |
| `assertFound`: null ресурс | negative | `NotFoundException` | `covered` |
| `assertCanAccessProfile`: владелец всегда разрешён | happy | даже при `private` + `isDiscoverable=false` | `covered` |
| `assertCanAccessProfile`: чужой открытый профиль | happy | `isDiscoverable=true`, `profileVisibilityMode=open` | `covered` |
| `assertCanAccessProfile`: чужой private профиль | negative | `ForbiddenException` | `covered` |
| `assertCanAccessProfile`: чужой не-discoverable профиль | negative | `ForbiddenException` | `covered` |
| `assertCanAccessPhoto`: владелец (любой статус фото) | happy | pending-фото видно владельцу | `covered` |
| `assertCanAccessPhoto`: чужое approved+published фото | happy | разрешён | `covered` |
| `assertCanAccessPhoto`: чужое pending фото | negative | `ForbiddenException` | `covered` |
| `assertCanAccessPhoto`: чужое approved не-published фото | negative | `ForbiddenException` | `covered` |
| `assertConversationMember`, `assertMatchParticipant` | — | helpers не протестированы в этом spec | `not-covered` |

---

## Serializers / PII-утечки

Spec: `apps/backend/src/common/serializers/user-profile.serializer.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| Публичный профиль: только approved+published фото | happy | pending и not-published фото отфильтрованы | `covered` |
| Публичный профиль в private mode: поля скрыты | negative | `displayName`, `bio`, `city`, `country` = null, `photos` = [] | `covered` |
| Публичный профиль в private mode с частичными настройками | happy | разрешённые поля видны, фото всё равно скрыты | `covered` |
| Self-profile: включает `birthDate`, `moderationStatus` | happy | self-serializer отдаёт расширенный набор | `covered` |
| Self-photo: `storageKey` не в ответе | negative | `storageKey` отсутствует в объекте фото | `covered` |
| `email`, `passwordHash` не в публичном ответе | negative | проверяется в auth и likes спеках через `expectNoCredentialKeys` | `covered` |
| `birthDate` не в публичном ответе | negative | проверяется в profiles, discovery, matches спеках | `covered` |

---

## Profiles

Spec: `apps/backend/src/modules/profiles/profiles.service.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| GET /profiles/me для активного пользователя | happy | self-поля включены, `storageKey` отсутствует | `covered` |
| GET /profiles/me для disabled/deleted пользователя | negative | `UnauthorizedException`, profile.findUnique не вызывается | `covered` |
| GET /profiles/me когда profile row отсутствует | negative | `NotFoundException` | `covered` |
| PATCH /profiles/me: обновляются только переданные поля | happy | `userId` берётся только из токена, не из body | `covered` |
| PATCH /profiles/me: пустой body не создаёт DB-запрос | happy | `profile.update` не вызывается | `covered` |
| GET /profiles/:handle: case-insensitive lookup | happy | `mode: 'insensitive'` в Prisma query | `covered` |
| GET /profiles/:handle: block в любую сторону → 404 | negative | `NotFoundException` (не раскрывает факт блокировки) | `covered` |
| GET /profiles/:handle: private profile → 403 | negative | `ForbiddenException` | `covered` |
| GET /profiles/:handle: non-discoverable → 403 | negative | `ForbiddenException` | `covered` |
| GET /profiles/:handle: `birthDate` не в ответе | negative | `result.profile` не имеет `birthDate` | `covered` |
| PATCH /profiles/me с запрещёнными полями (userId, handle, birthDate) | negative | DTO с `whitelist`+`forbidNonWhitelisted` должна отклонять | `not-covered` |

---

## Media

Spec: `apps/backend/src/modules/media/media.service.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| Загрузка фото для inactive пользователя | negative | `UnauthorizedException` до storage | `covered` |
| Загрузка без файла / пустой файл | negative | `BadRequestException` до DB и storage | `covered` |
| Неподдерживаемый MIME-тип (image/gif) | negative | `BadRequestException` до storage | `covered` |
| Файл > 5 MB | negative | `BadRequestException` до storage | `covered` |
| Невалидная сигнатура файла (не изображение) | negative | `BadRequestException` до storage | `covered` |
| Достигнут лимит фото | negative | `BadRequestException` до storage и create | `covered` |
| Валидные JPEG/PNG/WebP сигнатуры | happy | каждый формат проходит signature-проверку | `covered` |
| Первое фото = approved primary (MVP auto-approve) | happy | `is_primary=true`, `moderationStatus=approved`, `published_at` установлен | `covered` |
| Последующие фото = non-primary | happy | `is_primary=false`, позиция +1 | `covered` |
| Ошибка DB при create: storage cleanup best-effort | negative | `storage.deleteProfilePhoto` вызван, исходная ошибка сохранена | `covered` |
| set-primary: отсутствующее или чужое фото | negative | `NotFoundException` / `ForbiddenException` | `covered` |
| set-primary: ответ без `storageKey` | negative | `storageKey` не в response | `covered` |
| delete: отсутствующее или чужое фото | negative | `NotFoundException` / `ForbiddenException` | `covered` |
| delete primary: следующее фото промотируется | happy | `update` вызван для следующего фото | `covered` |
| delete: хранилище недоступно → DB удаление не откатывается | negative | `success: true`, ошибка storage проглочена | `covered` |
| EXIF/metadata stripping | negative | не реализовано, тест отсутствует | `not-covered` |
| Path traversal в local storage adapter | negative | защита в `LocalProfilePhotoStorageService`; spec файл есть, но сценарий не проверяется | `not-covered` |
| `storageKey` не в публичном response | negative | проверяется в media, profiles, serializer спеках | `covered` |

---

## Discovery

Spec: `apps/backend/src/modules/discovery/discovery.service.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| Inactive текущий пользователь | negative | `UnauthorizedException` до DB-запроса | `covered` |
| Self-exclusion | negative | `userId: { not: CURRENT_USER.id }` в query | `covered` |
| Inactive/deleted target users excluded | negative | `user.status=active`, `deletedAt=null` в where | `covered` |
| Non-discoverable, incomplete, private, non-discoverable PrivacySettings | negative | `isDiscoverable=true`, `completedAt: not null`, `profileVisibilityMode=open`, `discoverable=true` | `covered` |
| Нет approved+published фото | negative | `photos.some.moderationStatus=approved`, `publishedAt: not null` | `covered` |
| Block в любую сторону | negative | `blockedUsers.none` + `blockedByUsers.none` | `covered` |
| Active LIKE cooldown | negative | `likesReceived.none.expiresAt > now` | `covered` |
| Active SKIP/PASS cooldown через тот же фильтр | negative | фильтр не имеет `kind`, covers both LIKE and PASS | `covered` |
| Истёкший LIKE/SKIP не блокирует rediscovery | happy | `expiresAt: { gt: now }` — expired не попадает в фильтр | `covered` |
| Active match excluded | negative | `matchesAsUserA.none` + `matchesAsUserB.none` с `status=active`, `expiresAt > now` | `covered` |
| Expired match не блокирует rediscovery | happy | `expiresAt: { gt: now }` | `covered` |
| `birthDate` не в ответе, `age` вычислен | negative | response содержит `age`, не `birthDate` | `covered` |
| Cursor pagination: limit clamped to 20 | happy | `take: 21` (limit+1) при любом значении > 20 | `covered` |
| Server-side max limit 20 enforcement | negative | `limit: 99` → `take: 21` в query | `covered` |
| Unlimited list bypass | negative | limit clamped, нет возможности получить все данные | `covered` |

---

## Likes

Spec: `apps/backend/src/modules/likes/likes.service.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| LIKE с 3-дневным TTL | happy | `expiresAt = now + 3d`, ответ содержит `action: 'like'` | `covered` |
| SKIP/PASS с 1-дневным TTL | happy | `expiresAt = now + 1d`, matches не создаётся | `covered` |
| Self-like / self-skip до DB-запроса | negative | `BadRequestException`, `user.findUnique` не вызывается | `covered` |
| Inactive текущий пользователь | negative | `UnauthorizedException`, `profile.findUnique` не вызывается | `covered` |
| Missing/inactive/deleted target | negative | `NotFoundException`, `like.create` не вызывается | `covered` |
| Private / non-discoverable target | negative | `ForbiddenException`, `like.create` не вызывается | `covered` |
| Active block в любую сторону | negative | `ForbiddenException`, block check до cooldown check | `covered` |
| Duplicate active interaction (409) | negative | `ConflictException`, `like.create` не вызывается | `covered` |
| DB exclusion constraint collision → safe 409 | negative | `PrismaClientKnownRequestError P2004` → `ConflictException` без деталей constraint | `covered` |
| Expired interaction разрешает новый LIKE | happy | query фильтрует `expiresAt > now`, expired не блокирует | `covered` |
| Response не содержит `id`, `likerUserId`, `email`, `storageKey` | negative | `expectNoRawLikeOrPrivateKeys` | `covered` |
| Race: два параллельных LIKE от разных пользователей | negative | DB exclusion constraint; unit-mock не воспроизводит гонку | `needs-recheck` |

---

## Matches

Spec: `apps/backend/src/modules/matches/matches.service.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| Взаимный active LIKE → match создаётся | happy | reciprocal `LikeKind.like`, `expiresAt > now` | `covered` |
| Односторонний LIKE → match не создаётся | negative | `like.findFirst` возвращает null, match.create не вызывается | `covered` |
| Block в любую сторону → match не создаётся | negative | `hasBlockBetween=true`, все проверки до DB | `covered` |
| SKIP/PASS → match не создаётся | negative | query содержит `kind: LikeKind.like` | `covered` |
| Expired reciprocal LIKE → match не создаётся | negative | `expiresAt: { gt: now }` в reciprocal-like query | `covered` |
| Duplicate active match → возвращается существующий | happy | `match.create` не вызывается, notifications не дублируются | `covered` |
| Rematch после истечения предыдущего | happy | `status=active`, `expiresAt > now` в check-query | `covered` |
| Canonical pair order normalization | happy | `userAId < userBId` по UUID-порядку | `covered` |
| Self-match rejected at normalizePair | negative | `BadRequestException` | `covered` |
| DB exclusion constraint race → существующий match | negative | `PrismaClientKnownRequestError P2004` → re-fetch existing | `needs-recheck` |
| getMyMatches: только активные матчи текущего пользователя | happy | `status=active`, `expiresAt > now`, фильтр по участнику | `covered` |
| getMyMatches: blocked пары скрыты | negative | `getBlockedUserIdsFor` + фильтрация в сервисе | `covered` |
| getMyMatches: inactive/deleted matched users скрыты | negative | пара возвращается пустой | `covered` |
| Inactive текущий пользователь | negative | `UnauthorizedException` | `covered` |
| Response не содержит `userAId`, `userBId`, `email`, `storageKey` | negative | `expectNoRawMatchOrPrivateKeys` | `covered` |
| Notifications создаются для обоих участников после нового match | happy | `createMatchNotifications` вызван с обоими userId | `covered` |
| getMyMatches pagination | — | не тестируется (cursor pagination для matches) | `not-covered` |

---

## Chat

Spec: `apps/backend/src/modules/chat/chat.service.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| Inactive текущий пользователь (list/send/start) | negative | `UnauthorizedException` до DB | `covered` |
| Список разговоров: только active participant | negative | `participants.some.userId=current, leftAt=null` | `covered` |
| Blocked conversations скрыты из списка | negative | `participants.none` с block check в обе стороны | `covered` |
| Чтение сообщений: не-participant → 404 | negative | `NotFoundException`, `message.findMany` не вызывается | `covered` |
| Чтение сообщений при block → not-found style | negative | `NotFoundException` (не 403) | `covered` |
| Отправка: не-participant → 404 | negative | `NotFoundException`, `message.create` не вызывается | `covered` |
| Отправка в closed conversation | negative | `ForbiddenException`, `message.create` не вызывается | `covered` |
| Отправка при active block в любую сторону | negative | `ForbiddenException`, notifications не создаётся | `covered` |
| Отправка при inactive/deleted другом участнике | negative | `ForbiddenException` | `covered` |
| Отправка без второго участника (single-participant) | negative | `ForbiddenException` | `covered` |
| Whitespace-only текст отклоняется на сервисе | negative | `BadRequestException`, `conversation.findFirst` не вызывается | `covered` |
| DTO: trim, не-пустой, max 2000 символов | negative | `class-validator` проверяется на уровне DTO | `covered` |
| `body` (DB-field) не в response, маппится как `text` | negative | `expectNoForbiddenKeys` включает `body` | `covered` |
| Старт conversation: не-participant матча → 404 | negative | `NotFoundException`, `conversation.create` не вызывается | `covered` |
| Старт conversation: create + оба participants в транзакции | happy | `conversation.create` с `participants.create` | `covered` |
| Старт conversation: idempotent для expired match с существующим conversation | happy | возвращает существующий, `conversation.create` не вызывается | `covered` |
| Старт conversation: expired match без conversation | negative | `ConflictException` | `covered` |
| Старт conversation при block | negative | `ForbiddenException` | `covered` |
| Старт conversation: inactive другой участник | negative | `ForbiddenException` | `covered` |
| Race на unique `match_id` → existing conversation | negative | `PrismaClientKnownRequestError P2002` → re-fetch | `needs-recheck` |
| `conversationId` без membership не даёт доступ | negative | membership check enforced через participant query | `covered` |
| Cursor pagination conversations/messages | happy | limit clamping, nextCursor, skip/cursor | `covered` |

---

## Moderation

Spec: `apps/backend/src/modules/moderation/moderation.service.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| Self-block до DB-запроса | negative | `BadRequestException`, DB не вызывается | `covered` |
| Block создаётся, active matches завершаются | happy | `match.updateMany` с `status=blocked`, `endedAt=now` | `covered` |
| Duplicate block → idempotent success | negative | `block.create` не вызывается, match всё равно check | `covered` |
| Race на unique constraint при block → idempotent | negative | `P2002` → re-fetch existing block | `needs-recheck` |
| Unblock: hard delete scoped к current user pair | happy | `block.deleteMany` с `blockerUserId=current`, `match.updateMany` не вызывается | `covered` |
| Unblock не восстанавливает матчи | negative | `match.updateMany` не вызывается при unblock | `covered` |
| `GET /blocks/me`: только исходящие блоки current user | negative | `where.blockerUserId=current` | `covered` |
| Inactive current user → 401 | negative | `UnauthorizedException` | `covered` |
| Missing target user | negative | `NotFoundException` | `covered` |
| Self-report до DB-запроса | negative | `BadRequestException`, `report.create` не вызывается | `covered` |
| Report: safe public status только `"received"` | negative | внутренний `ReportStatus` не в ответе | `covered` |
| Report DTO: invalid reason, details > 1000 символов | negative | `class-validator`, 2 ошибки для invalid DTO | `covered` |
| Report DTO: whitespace-only details → null | negative | `details` трансформируется в null | `covered` |
| `hasBlockBetween` проверяет обе стороны | negative | `OR [blocker=A,blocked=B] OR [blocker=B,blocked=A]` | `covered` |
| Block response не содержит `blockerUserId`, `reporterUserId`, `email` | negative | `expectNoPrivateModerationKeys` | `covered` |
| Admin review workflow | — | не реализован, тест отсутствует | `not-covered` |

---

## Notifications

Spec: `apps/backend/src/modules/notifications/notifications.service.spec.ts`

| Сценарий | Тип | Что проверяется | Статус |
|---|---|---|---|
| Match notifications: создаются для обоих, message body не хранится | negative | `messageKey` хранится, не тело; `body`/`email` не в data | `covered` |
| Message notification: только для recipient, не для sender | negative | один `notification.create` | `covered` |
| Self-notification не создаётся | negative | `notification.create` не вызывается | `covered` |
| Block в любую сторону → notification не создаётся | negative | `hasBlockBetween=true` | `covered` |
| `NotificationSettings.matchesEnabled=false` | negative | `notification.create` не вызывается для матча | `covered` |
| `NotificationSettings.messagesEnabled=false` | negative | `notification.create` не вызывается для сообщения | `covered` |
| Список: только current user + safe shape | happy | `where.recipientUserId=current` | `covered` |
| Blocked actor notifications скрыты | negative | `actor.blockedUsers.none` + `actor.blockedByUsers.none` в where | `covered` |
| Actorless match/message notification скрыта | negative | только `type=system` допускает `actor=null` в ответе | `covered` |
| Unread count: только current user | negative | `where.recipientUserId=current, readAt=null` | `covered` |
| markOneRead: foreign/missing notification → 404 | negative | `NotFoundException`, `update` не вызывается | `covered` |
| markAllRead: только current user | negative | `where.recipientUserId=current, readAt=null` | `covered` |
| Inactive current user → 401 | negative | `UnauthorizedException`, `findMany` не вызывается | `covered` |
| Response не содержит `body`, `email`, `birthDate`, `storageKey` | negative | `expectNoForbiddenKeys` | `covered` |
| Duplicate match notification при existing match race | negative | covered via matches.spec: `createMatchNotifications` не вызывается для existing match | `covered` |
| Cursor pagination | happy | limit clamping, nextCursor, cursor/skip | `covered` |

---

## Cross-cutting: отсутствующее покрытие

Ниже — сценарии, которые не закрыты ни в одном spec файле.

### HTTP/Controller layer (нет тестов)

| Сценарий | Риск | Что нужно |
|---|---|---|
| `JwtAccessGuard` блокирует неаутентифицированные запросы | Доступ к защищённым эндпоинтам без токена | Controller-level или e2e тест |
| `ValidationPipe` отклоняет лишние DTO поля (`forbidNonWhitelisted`) | Передача `userId`, `isAdmin`, `role` в body обходит whitelist | e2e тест с реальным HTTP-запросом |
| Rate limits применены к нужным эндпоинтам | Спам без ограничений | Controller-level или e2e тест |
| Cookie-only refresh flow (`credentials: include`) | Refresh token в header вместо HttpOnly cookie | e2e тест |

### Integration / E2E (нет тестов)

| Сценарий | Риск | Что нужно |
|---|---|---|
| `likes_no_overlapping_active_interactions` (btree_gist) | Race при параллельных LIKE от разных пользователей | Интеграционный тест с реальной PostgreSQL |
| `matches_no_overlapping_active_pairs` (btree_gist) | Race при параллельном создании матча | Интеграционный тест с реальной PostgreSQL |
| Duplicate email/handle при регистрации под нагрузкой | Гонка между `findFirst` и `create` | Интеграционный тест |
| `lower(email)` / `lower(handle)` case-insensitive unique | Bypass через регистр символов | Интеграционный тест |

### Frontend tests (отсутствуют)

Frontend spec-файлов нет. Документально отражено в `docs/FEATURES.md`.

---

## Итоговая сводка по доменам

| Домен | Покрыто | Не покрыто | Needs-recheck |
|---|---|---|---|
| Auth | register, login, refresh, logout, PII | дубль email/handle, login disabled user | parallel refresh race |
| Owner checks | assertOwner, assertFound, assertCanAccessProfile, assertCanAccessPhoto | assertConversationMember, assertMatchParticipant | — |
| Serializers | PII exclusion, private mode | — | — |
| Profiles | getMe, updateMe, getByHandle, block/private access | PATCH с запрещёнными полями (DTO-уровень) | — |
| Media | upload validation (MIME, size, signature, limit), owner checks, storage cleanup | EXIF stripping, path traversal | — |
| Discovery | все фильтры, pagination, safe shape | — | — |
| Likes | happy path, все negative, block, cooldown, constraint | — | parallel race |
| Matches | happy path, все negative, normalization, constraint | pagination | parallel race |
| Chat | membership, block bypass, closed conversation, DTO, idempotent start | — | conversation race |
| Moderation | block/unblock/report, side effects, DTO, idempotency | admin review workflow | block race |
| Notifications | create/list/mark-read, block filter, settings, safe shape | — | — |
| HTTP/Controller | — | JwtAccessGuard enforcement, DTO whitelist, rate limit wiring | — |
