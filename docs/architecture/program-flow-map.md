# Program Flow Map

This document maps current Yuni flows from frontend to backend and database. It is the main reference for how new flows should be shaped.

General flow:

```text
frontend page/component
  -> frontend API client
  -> AuthProvider/authenticatedRequest when protected
  -> backend controller
  -> DTO / guards / CurrentUser
  -> service
  -> Prisma/PostgreSQL
  -> serializer or explicit response shape
  -> frontend state/UI
```

Frontend is not a security boundary. Backend must enforce auth, ownership, membership, validation and visibility.

## A. Auth Flow

### Frontend Files

- `apps/frontend/app/(auth)/signin/page.tsx`
- `apps/frontend/app/(auth)/join/page.tsx`
- `apps/frontend/app/(auth)/layout.tsx`
- `apps/frontend/features/auth/components/sign-in-form.tsx`
- `apps/frontend/features/auth/components/sign-up-form.tsx`
- `apps/frontend/features/auth/components/birthdate-field.tsx`
- `apps/frontend/lib/auth-api.ts`
- `apps/frontend/lib/auth-context.tsx`
- `apps/frontend/features/app-shell/components/app-content.tsx`

### Backend Files

- `apps/backend/src/modules/auth/auth.controller.ts`
- `apps/backend/src/modules/auth/auth.service.ts`
- `apps/backend/src/modules/auth/dto/register.dto.ts`
- `apps/backend/src/modules/auth/dto/login.dto.ts`
- `apps/backend/src/modules/auth/guards/jwt-access.guard.ts`
- `apps/backend/src/modules/auth/decorators/current-user.decorator.ts`
- `apps/backend/src/common/serializers/user-profile.serializer.ts`

### Database Models

- `User`
- `RefreshToken`
- `Profile`
- `PrivacySettings`
- `NotificationSettings`

### Register

```text
SignUpForm
  -> useAuth().register
  -> authApi.register
  -> POST /auth/register
  -> RegisterDto
  -> AuthService.register
  -> User/Profile/PrivacySettings/NotificationSettings create
  -> refresh token hash stored in RefreshToken
  -> toSafeAuthUser
  -> accessToken JSON + HttpOnly refresh cookie
  -> AuthProvider memory state
```

Security:

- frontend age validation is UX only;
- backend independently enforces `birthDate` format and 18+;
- raw password is hashed and not stored;
- raw refresh token is not stored;
- refresh cookie is HttpOnly.

### Login

```text
SignInForm
  -> useAuth().login
  -> authApi.login
  -> POST /auth/login
  -> LoginDto
  -> AuthService.login
  -> password verify
  -> refresh token hash stored in RefreshToken
  -> toSafeAuthUser
  -> accessToken JSON + HttpOnly refresh cookie
  -> AuthProvider memory state
```

Security:

- invalid credentials use safe error;
- password is never returned;
- refresh token is cookie-only.

### Refresh

```text
AuthProvider bootstrap or authenticatedRequest 401 retry
  -> shared refresh promise
  -> authApi.refresh
  -> POST /auth/refresh with credentials include
  -> AuthController reads refresh cookie
  -> AuthService.refresh
  -> verify hashed refresh token
  -> atomic revoke old RefreshToken
  -> create new RefreshToken
  -> accessToken JSON + new HttpOnly refresh cookie
  -> AuthProvider memory state
```

Security:

- refresh rotation is single-use;
- parallel refresh with same cookie can only create one new valid session;
- reused/revoked/expired refresh returns `401`;
- frontend access token remains memory-only.

### Logout

```text
UI logout
  -> useAuth().logout
  -> authApi.logout
  -> POST /auth/logout
  -> AuthService.logout
  -> revoke refresh session if present
  -> clear refresh cookie
  -> clear frontend memory state
```

Security:

- logout is idempotent from frontend perspective;
- cookie is cleared by backend;
- frontend state is cleared even if logout request fails.

### Me

```text
authApi.me or protected backend call
  -> GET /auth/me with Bearer access token
  -> JwtAccessGuard
  -> CurrentUser
  -> AuthService.getMe
  -> toSafeAuthUser
```

Security:

- access token is read from memory state;
- backend guard validates token;
- response is safe user shape, not raw `User`.

## B. Profile Self Flow

### Frontend Files

- `apps/frontend/app/(app)/profile/page.tsx`
- `apps/frontend/lib/profile-api.ts`
- `apps/frontend/lib/auth-context.tsx`

### Backend Files

- `apps/backend/src/modules/profiles/profiles.controller.ts`
- `apps/backend/src/modules/profiles/profiles.service.ts`
- `apps/backend/src/modules/profiles/dto/update-profile.dto.ts`
- `apps/backend/src/common/serializers/user-profile.serializer.ts`

### Database Models

- `Profile`
- `ProfilePhoto`
- `User`

### GET `/profiles/me`

```text
/profile page
  -> profileApi.me(authenticatedRequest)
  -> authenticatedRequest attaches Bearer access token
  -> GET /profiles/me
  -> JwtAccessGuard
  -> CurrentUser
  -> ProfilesService.getMe
  -> Prisma profile findUnique by CurrentUser.id
  -> toSelfProfile
  -> frontend profile state
```

Security:

- user id comes from `CurrentUser`;
- self response may include `birthDate`;
- self response does not include password/session/token fields.

### PATCH `/profiles/me`

```text
/profile page edit fields
  -> profileApi.updateMe(authenticatedRequest, payload)
  -> PATCH /profiles/me
  -> UpdateProfileDto
  -> ValidationPipe whitelist + forbidNonWhitelisted
  -> ProfilesService.updateMe
  -> Prisma profile update by CurrentUser.id
  -> toSelfProfile
```

Security:

- `userId` from body is not accepted;
- allowlisted fields only: `displayName`, `bio`, `gender`, `lookingFor`, `city`, `country`, `isDiscoverable`;
- forbidden fields are rejected by global ValidationPipe.

## C. Public Profile Flow

### Frontend Files

- `apps/frontend/lib/profile-api.ts`
- Future discover/profile detail UI to be defined.

### Backend Files

- `apps/backend/src/modules/profiles/profiles.controller.ts`
- `apps/backend/src/modules/profiles/profiles.service.ts`
- `apps/backend/src/common/security/access-control.ts`
- `apps/backend/src/common/serializers/user-profile.serializer.ts`

### Database Models

- `Profile`
- `ProfilePhoto`
- `PrivacySettings`

### GET `/profiles/:handle`

```text
future public profile/discover UI
  -> profileApi.byHandle(authenticatedRequest, handle)
  -> GET /profiles/:handle
  -> JwtAccessGuard
  -> CurrentUser
  -> ProfilesService.getByHandle
  -> Prisma profile findFirst handle case-insensitive
  -> assertCanAccessProfile
  -> toPublicProfile
  -> frontend public profile view
```

Security:

- public profile lookup still requires authenticated user in current MVP;
- no email;
- no birthDate;
- no private settings;
- private/hidden profile uses safe denial through backend access-control;
- public photos are filtered by `toPublicProfilePhotos`.

## D. Profile Photos / Media Flow

### Frontend Files

- `apps/frontend/app/(app)/profile/page.tsx`
- `apps/frontend/lib/profile-api.ts`
- `apps/frontend/lib/auth-api.ts`
- `apps/frontend/lib/auth-context.tsx`

### Backend Files

- `apps/backend/src/modules/media/media.controller.ts`
- `apps/backend/src/modules/media/media.service.ts`
- `apps/backend/src/modules/media/media.constants.ts`
- `apps/backend/src/modules/media/types/uploaded-profile-photo-file.ts`
- `apps/backend/src/main.ts`
- `apps/backend/src/common/serializers/user-profile.serializer.ts`

### Database Models

- `ProfilePhoto`
- `Profile`
- `User`

### GET `/media/profile-photos/me`

```text
/profile page or media UI
  -> profileApi.myPhotos(authenticatedRequest)
  -> GET /media/profile-photos/me
  -> JwtAccessGuard
  -> CurrentUser
  -> MediaService.getMyProfilePhotos
  -> Prisma profilePhoto findMany by CurrentUser.id
  -> toSelfProfilePhoto
```

### POST `/media/profile-photos`

```text
/profile photo input
  -> profileApi.uploadPhoto(authenticatedRequest, File)
  -> FormData field "file"
  -> POST /media/profile-photos
  -> FileInterceptor file size limit
  -> JwtAccessGuard
  -> CurrentUser
  -> MediaService.uploadProfilePhoto
  -> MIME/type/size validation
  -> generated UUID filename
  -> local write to apps/backend/uploads/profile-photos
  -> Prisma ProfilePhoto create
  -> toSelfProfile + toSelfProfilePhoto
  -> frontend profile state update
```

Security:

- accepts only `image/jpeg`, `image/png`, `image/webp`;
- max size is `5 MB`;
- original filename is not used as storage filename;
- local uploads are MVP-only;
- self response does not expose `storageKey` or local path.

### PATCH `/media/profile-photos/:photoId/primary`

```text
/profile photo action
  -> profileApi.setPrimaryPhoto(authenticatedRequest, photoId)
  -> PATCH /media/profile-photos/:photoId/primary
  -> JwtAccessGuard
  -> CurrentUser
  -> MediaService.setProfilePhotoPrimary
  -> Prisma find photo
  -> assertOwner(photo.userId, CurrentUser.id)
  -> transaction: clear previous primary + set target primary
  -> toSelfProfile + toSelfProfilePhoto list
```

Security:

- `photoId` is not proof of ownership;
- owner check is backend-side.

### DELETE `/media/profile-photos/:photoId`

```text
/profile photo action
  -> profileApi.deletePhoto(authenticatedRequest, photoId)
  -> DELETE /media/profile-photos/:photoId
  -> JwtAccessGuard
  -> CurrentUser
  -> MediaService.deleteProfilePhoto
  -> Prisma find photo
  -> assertOwner(photo.userId, CurrentUser.id)
  -> transaction: delete row and promote next primary if needed
  -> best-effort local file unlink
  -> toSelfProfile + toSelfProfilePhoto list
```

Security:

- non-owner cannot delete;
- local file cleanup does not expose local path to client.

### Public Photo Exposure

```text
GET /profiles/:handle
  -> toPublicProfile
  -> toPublicProfilePhotos
  -> only publicUrl + approved + published photos
```

Public photo response does not expose:

- `storageKey`;
- local filesystem path;
- original filename;
- moderation internals.

## E. Future Flow Placeholders

These sections are intentionally short. They document expected boundaries without inventing endpoints.

### Likes Flow - Step 12 MVP

Implemented module: `LikesModule`.

Frontend files:

- `apps/frontend/app/(app)/discover/page.tsx`
- `apps/frontend/features/discover/components/swipe-actions.tsx`
- `apps/frontend/lib/likes-api.ts`
- `apps/frontend/lib/auth-context.tsx`

Backend files:

- `apps/backend/src/modules/likes/likes.controller.ts`
- `apps/backend/src/modules/likes/likes.service.ts`
- `apps/backend/src/modules/likes/likes.module.ts`

Database model:

- `Like`

`targetProfileUserId` means `profiles.user_id`. Profile primary key is user id; Step 12 does not introduce a separate profile id.

```text
discover card action
  -> likesApi.likeProfile or likesApi.skipProfile
  -> authenticatedRequest attaches Bearer access token
  -> POST /likes/:targetProfileUserId or /likes/:targetProfileUserId/skip
  -> JwtAccessGuard
  -> CurrentUser
  -> LikesService
  -> assert active actor
  -> find target profile by Profile.userId
  -> assert target user active/not deleted
  -> assertCanAccessProfile for discoverable/open target
  -> ModerationService.assertNoBlockBetween(actor, target)
  -> reject active duplicate Like where expiresAt > now
  -> create Like with expiresAt
  -> explicit safe interaction response
  -> frontend removes card only after successful response
```

Security:

- authenticated user comes from `CurrentUser`;
- frontend never chooses actor user id;
- self-like and self-skip are rejected;
- target profile must be discoverable/open by current rules;
- blocked pairs in either direction cannot LIKE/SKIP;
- `like` maps to `LikeKind.like`;
- `skip`/`pass` maps to `LikeKind.pass`;
- LIKE cooldown is 3 days;
- SKIP/PASS cooldown is 1 day;
- expired interactions do not block a new action;
- active duplicate interactions return safe `409`;
- DB overlap constraint conflicts are mapped to safe `409`;
- response is `{ interaction: { targetProfileUserId, action, expiresAt } }`, not a raw Prisma `Like` row.

Out of scope for Step 12:

- superlike;
- match lifecycle ownership, implemented in Step 13 by `MatchesService`;
- backend discovery feed ownership, implemented in Step 15 by `DiscoveryModule`.

### Matches Flow - Step 13 MVP

Implemented module: `MatchesModule`.

Frontend files:

- `apps/frontend/app/(app)/matches/page.tsx`
- `apps/frontend/app/(app)/discover/page.tsx`
- `apps/frontend/lib/matches-api.ts`
- `apps/frontend/lib/likes-api.ts`

Backend files:

- `apps/backend/src/modules/matches/matches.controller.ts`
- `apps/backend/src/modules/matches/matches.service.ts`
- `apps/backend/src/modules/matches/matches.module.ts`
- `apps/backend/src/modules/likes/likes.service.ts`

Database models:

- `Like`
- `Match`
- `Conversation` only as nullable relation marker; chat is not implemented in Step 13.

Match creation:

```text
discover LIKE action
  -> POST /likes/:targetProfileUserId
  -> JwtAccessGuard
  -> CurrentUser
  -> LikesService creates expiring LikeKind.like
  -> MatchesService.tryCreateMatchFromLike
  -> return null if ModerationService detects block in either direction
  -> find reciprocal active LikeKind.like where expiresAt > now
  -> normalize pair to userAId < userBId
  -> find active match where status=active and expiresAt > now
  -> create Match with matchedAt=now and expiresAt=now+7 days if no active duplicate
  -> return optional safe match shape in LIKE response
  -> frontend shows match overlay only if backend returned match
```

Match list:

```text
/matches page
  -> matchesApi.getMyMatches(authenticatedRequest)
  -> GET /matches/me
  -> JwtAccessGuard
  -> CurrentUser
  -> MatchesService.getMyMatches
  -> assert active current user
  -> Prisma match findMany for current user where status=active and expiresAt > now
  -> filter out matched users blocked in either direction
  -> compact public matched profile response
  -> frontend renders active matches
```

Security:

- authenticated user comes from `CurrentUser`;
- frontend never decides match participants;
- self-match is rejected;
- SKIP/PASS never creates a match;
- one-sided LIKE never creates a match;
- expired reciprocal LIKE never creates a match;
- blocked pair never creates a match;
- active duplicate match is not created;
- expired match does not block rematch;
- active means `status=active` and `expiresAt > now`;
- no cron/job is required in Step 13;
- response does not expose raw Prisma `Match`, `User`, `Profile` or `ProfilePhoto` rows;
- response does not expose email, birthDate, password/session fields, `storageKey`, local file paths, original filenames or private settings.

Out of scope for Step 13:

- full chat and sending messages;
- notifications;
- full discovery ranking/filtering.

### Chat Flow - Planned

Expected module: `ChatModule`.

Expected DB models already present:

- `Conversation`;
- `ConversationParticipant`;
- `Message`.

Expected security:

- reads/writes only through conversation membership;
- sender must be a participant;
- cursor pagination for messages;
- no unbounded message lists;
- no reading conversation by id alone.

Expected serializers:

- conversation list shape;
- message list shape;
- no internal deleted/moderation fields unless explicitly needed.

### Moderation / Reports / Blocks Flow - Step 14 MVP

Implemented module: `ModerationModule`.

Frontend files:

- `apps/frontend/app/(app)/matches/page.tsx`
- `apps/frontend/lib/blocks-api.ts`
- `apps/frontend/lib/reports-api.ts`

Backend files:

- `apps/backend/src/modules/moderation/moderation.controller.ts`
- `apps/backend/src/modules/moderation/moderation.service.ts`
- `apps/backend/src/modules/moderation/dto/create-report.dto.ts`

DB models:

- `Block`;
- `Report`;

Block:

```text
matches page block action
  -> blocksApi.blockUser(authenticatedRequest, targetUserId)
  -> POST /blocks/:targetUserId
  -> JwtAccessGuard
  -> CurrentUser
  -> ModerationService.blockUser
  -> reject self-block
  -> assert active actor and active target
  -> create Block or return existing block idempotently
  -> update active Match between users to status=blocked and endedAt=now
  -> safe block response
  -> frontend removes match card only after successful response
```

Unblock:

```text
DELETE /blocks/:targetUserId
  -> JwtAccessGuard
  -> CurrentUser
  -> deleteMany where blockerUserId=CurrentUser.id and blockedUserId=targetUserId
  -> idempotent success
```

Report:

```text
matches page report action
  -> reportsApi.reportUser(authenticatedRequest, payload)
  -> POST /reports
  -> JwtAccessGuard
  -> CurrentUser
  -> CreateReportDto validates targetUserId, reason and details
  -> reject self-report
  -> create Report with internal status default
  -> safe public report response with status="received"
```

Security:

- no self-block;
- no self-report;
- reports/blocks must be tied to authenticated `CurrentUser`;
- block effects are applied to public profile reads, likes and matches;
- discovery uses the same block boundary;
- admin review endpoints must be separate from public/self endpoints.

Serializers / response shapes:

- block response includes only `blockedUserId`, `createdAt`, public status `"blocked"`;
- report response includes only `id`, `targetUserId`, `reason`, `createdAt`, public status `"received"`;
- future admin moderation serializers documented separately.

### Discovery Flow - Step 15 MVP

Implemented module: `DiscoveryModule`.

Frontend files:

- `apps/frontend/app/(app)/discover/page.tsx`
- `apps/frontend/lib/discovery-api.ts`
- `apps/frontend/lib/likes-api.ts`
- `apps/frontend/lib/auth-context.tsx`

Backend files:

- `apps/backend/src/modules/discovery/discovery.controller.ts`
- `apps/backend/src/modules/discovery/discovery.service.ts`
- `apps/backend/src/modules/discovery/dto/discovery-cards-query.dto.ts`
- `apps/backend/src/modules/discovery/discovery.module.ts`

DB models already present:

- `Profile`;
- `ProfilePhoto`;
- `User`;
- `PrivacySettings`;
- `Block`;
- `Like`;
- `Match`.

Discovery list:

```text
/discover page
  -> discoveryApi.getCards(authenticatedRequest, { limit, cursor })
  -> GET /discovery/cards
  -> JwtAccessGuard
  -> CurrentUser
  -> DiscoveryService.getCards
  -> assert active current user
  -> Prisma profile findMany with eligibility filters
  -> stable order createdAt desc + userId desc
  -> explicit safe DiscoveryCard response
  -> frontend maps cards to existing card UI
```

LIKE/SKIP from discovery:

```text
discover card action
  -> likesApi.likeProfile or likesApi.skipProfile
  -> backend likes flow
  -> remove card only after successful response
  -> if LIKE response contains match, show existing match overlay
  -> if cards run low and nextCursor exists, load next page
```

Security:

- exclude current user;
- exclude inactive/deleted users;
- require completed and discoverable profiles;
- require explicit open/discoverable privacy settings;
- return only approved/published public photos;
- require at least one public photo;
- respect blocks in both directions;
- exclude active LIKE/SKIP cooldowns where `expiresAt > now`;
- exclude active matches where `status=active` and `expiresAt > now`;
- expired LIKE/SKIP and expired matches do not block rediscovery;
- use cursor pagination with max limit `20`;
- apply anti-scraping limits;
- do not expose raw `birthDate`, email, password/session fields, storage internals, private settings, moderation internals or raw Prisma rows.

Response shape:

- `{ cards, nextCursor }`;
- card fields: `userId`, `handle`, `displayName`, public profile fields, computed `age`, `primaryPhotoUrl`, `photos[].publicUrl`;
- `nextCursor` is `Profile.userId`, because Profile primary key is `profiles.user_id`.

Out of scope for Step 15:

- complex recommendation algorithm;
- random ranking;
- geolocation/radius;
- premium filters;
- chat/messages;
- notifications;
- admin/moderation panel.
