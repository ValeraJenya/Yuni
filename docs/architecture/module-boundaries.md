# Module Boundaries

Yuni is currently a modular monolith. The goal is to keep product development simple for a small team while preventing auth, profiles, media, discovery, likes, matches, chat and moderation from bleeding into each other.

## Core Rule

Each module owns one domain boundary. Cross-module access is allowed only when the dependency is explicit and easier to maintain than duplicating the business rule.

## Module Ownership

### AuthModule

Owns auth/session/token lifecycle only:

- register;
- login;
- refresh;
- logout;
- `me`;
- password hashing;
- refresh token hashing and rotation;
- refresh cookie behavior.

AuthModule should not own profile questionnaire behavior, media storage, likes, matches or chat business rules.

Auth endpoints may declare rate-limit policies for register/login/refresh/logout, but limiter state and `429` shaping live in `common/rate-limit`.

### ProfilesModule

Owns profile questionnaire and profile visibility:

- own profile read/update;
- public profile by handle;
- profile privacy behavior;
- public/self profile serializers.

ProfilesModule should not upload files, create matches or send messages.

ProfilesModule may declare a public-profile lookup rate limit. Profile visibility and block-aware access remain service/security-helper responsibilities, not limiter responsibilities.

### MediaModule

Owns profile photos and file/storage rules:

- local MVP upload;
- file type and size validation;
- generated storage key;
- own photo list;
- set primary;
- delete photo;
- photo owner checks.

MediaModule should not decide profile questionnaire fields, likes/matches state or chat permissions.

### LikesModule

Implemented Step 12 MVP for expiring LIKE/SKIP interactions.

Owns:

- `POST /likes/:targetProfileUserId`;
- `POST /likes/:targetProfileUserId/skip`;
- mapping API `like` to `LikeKind.like`;
- mapping API `skip`/`pass` to `LikeKind.pass`;
- LIKE cooldown of 3 days;
- SKIP/PASS cooldown of 1 day;
- active duplicate interaction checks;
- safe conflict response for application and DB overlap conflicts;
- explicit safe interaction response shape.

`targetProfileUserId` means `profiles.user_id`; no separate profile id exists.

LikesModule should not own matches, chats, blocks or reports. It may call `ModerationService.assertNoBlockBetween(...)` to enforce the shared block boundary and may delegate after successful LIKE to `MatchesService.tryCreateMatchFromLike(...)`, but match lifecycle remains in MatchesModule. Superlike is not implemented.

LIKE and SKIP share one rate-limit bucket by authenticated user. The limiter only gates request volume; duplicate interaction, cooldown, block and profile access checks remain in `LikesService`.

### MatchesModule

Implemented Step 13 MVP for mutual active LIKE matches.

Owns:

- `GET /matches/me`;
- mutual active LIKE detection;
- canonical pair normalization;
- active duplicate match prevention;
- 7-day match expiry window;
- active match filtering by `status=active` and `expiresAt > now`;
- safe match response shape.

MatchesModule should not send messages, create full chat flows, own reports, notifications or discovery ranking. It may call `ModerationService` to prevent and hide blocked matches.

### DiscoveryModule

Implemented Step 15 MVP for backend-owned discovery cards.

Owns:

- `GET /discovery/cards`;
- cursor pagination with max limit `20`;
- eligibility query across existing User/Profile/ProfilePhoto/PrivacySettings/Like/Match/Block models;
- safe public discovery card response shape;
- stable non-random ordering.

DiscoveryModule should not create likes, matches, blocks, reports, chats, notifications or ranking algorithms. It reads existing state to decide which public cards may be shown.

DiscoveryModule may declare a cards rate limit for anti-scraping. Eligibility filtering, block checks and safe serialization remain in `DiscoveryService`.

### ChatModule

Implemented Step 16 MVP.

Owns:

- `GET /chat/conversations`;
- `GET /chat/conversations/:conversationId/messages`;
- `POST /chat/conversations/:conversationId/messages`;
- `POST /matches/:matchId/conversation`;
- conversation creation from existing matches;
- conversation participant membership checks;
- plain-text message validation;
- safe conversation/message response shapes.

ChatModule may read `Match` state to create/open conversations and may call `ModerationService.assertNoBlockBetween(...)` to enforce block-aware chat restrictions. It should not own match creation, likes, reports, notifications or realtime delivery.

ChatModule may declare send-message rate limits. Conversation membership, participant status and block-aware send checks remain in `ChatService`.

### ModerationModule

Implemented Step 14 MVP.

Owns blocks, reports and block-aware helper operations used by profiles, likes and matches. Future admin review workflows remain outside this MVP.

ModerationModule may declare a report-creation rate limit. Self-report rejection, target validation and safe report response shape remain in `ModerationService`.

### RateLimitModule

Implemented Step 17 anti-spam MVP in `apps/backend/src/common/rate-limit`.

Owns:

- endpoint policy metadata and decorators;
- in-memory fixed-window counters;
- safe `429 Too many requests` exception shape;
- internal key construction using IP, authenticated user id or IP plus normalized email hash.

RateLimitModule should not own product authorization or access rules. It must not replace `JwtAccessGuard`, `CurrentUser`, owner checks, block checks, profile visibility checks, conversation membership checks, cooldown rules or database constraints. The in-memory store is single-instance only; production/multi-instance deployments need Redis/Valkey or another shared store.

## Rules

- Controller does not contain business logic.
- Controller calls service and returns service response.
- DTO validates request input.
- Service owns authorization checks and business rules.
- Service may call Prisma directly for its domain.
- Service must not return raw Prisma objects unless the selected fields already are an explicit response shape.
- Public API response should go through a serializer or an explicitly defined response type.
- Owner checks and membership checks happen on backend.
- Frontend flags such as `isOwner`, `isAdmin`, `isMember`, `isAdult` or `isAgeConfirmed` are untrusted.
- `userId` from request body is not proof of ownership.
- `photoId`, `profileId`, `conversationId` or `matchId` from path/body is only an identifier, not permission.
- `common` must not become a pile of product business logic.

## Cross-Module Interactions

Allowed patterns:

- Simple read via Prisma inside a service when the rule is local and clear.
- Common security helper for shared access checks.
- Common serializer when the response shape is shared across modules.
- Common rate-limit decorator for endpoint-specific anti-spam policies.
- Exported service only when it represents a real business operation that another module must invoke.
- Future event/worker path for heavy async operations such as media processing, notification delivery or moderation jobs.

Avoid:

- Importing another module's service only to bypass a missing local query.
- Putting business-specific code into `common`.
- Having controllers call Prisma directly.
- Returning raw Prisma rows to frontend.
- Letting frontend decide whether a user can access a resource.

## Current Implemented Examples

### ProfilesModule

`ProfilesController` receives authenticated requests and delegates to `ProfilesService`.

`ProfilesService`:

- reads `CurrentUser`;
- checks active user;
- updates only allowlisted profile fields;
- uses `assertCanAccessProfile` for public profile access;
- returns `toSelfProfile` or `toPublicProfile`.

### MediaModule

`MediaController` receives authenticated media requests and delegates to `MediaService`.

`MediaService`:

- checks active user;
- validates file type and size;
- generates storage key and public URL;
- performs owner checks via `assertOwner`;
- returns `toSelfProfile` and `toSelfProfilePhoto`.

### LikesModule

`LikesController` receives authenticated LIKE/SKIP requests and delegates to `LikesService`.

`LikesService`:

- reads actor from `CurrentUser`;
- rejects self-like/self-skip;
- checks active actor;
- loads target profile by `Profile.userId`;
- verifies target user is active/not deleted;
- uses `assertCanAccessProfile` for discoverable/open access;
- asks `ModerationService` to reject blocked pairs in either direction;
- blocks active duplicate interactions until `expiresAt`;
- delegates to `MatchesService` only after successful `LikeKind.like`;
- maps DB overlap conflicts to safe `409`;
- returns explicit interaction shape instead of raw Prisma `Like`.

### MatchesModule

`MatchesController` receives authenticated match list requests and delegates to `MatchesService`.

`MatchesService`:

- reads actor from `CurrentUser` for list requests;
- verifies current user is active;
- creates a match only when reciprocal active LIKE exists;
- never creates a match for SKIP/PASS;
- normalizes `userAId/userBId` before writes;
- treats active match as `status=active` and `expiresAt > now`;
- refuses to create matches for blocked pairs;
- filters blocked pairs from `/matches/me`;
- does not create duplicate active matches;
- allows future rematch after expiration;
- returns compact public matched profile shape, nullable `conversationId` and `conversationStarted`;
- does not expose raw Prisma rows or private media/profile fields.

### DiscoveryModule

`DiscoveryController` receives authenticated discovery list requests and delegates to `DiscoveryService`.

`DiscoveryService`:

- reads actor from `CurrentUser`;
- verifies current user is active;
- excludes self, inactive/deleted users and incomplete profiles;
- requires discoverable profile plus explicit open/discoverable privacy settings;
- requires approved/published `publicUrl` photos;
- excludes blocked pairs in either direction;
- excludes active LIKE/SKIP cooldowns and active matches;
- allows expired LIKE/SKIP and expired matches to rediscover;
- returns computed age and public photo URLs only;
- does not expose raw Prisma rows or private profile/media/moderation fields.

### ModerationModule

`ModerationController` receives authenticated block/report requests and delegates to `ModerationService`.

`ModerationService`:

- reads blocker/reporter from `CurrentUser`;
- rejects self-block and self-report;
- stores one directional active block row per blocker/blocked pair;
- returns idempotent duplicate block and unblock success;
- ends active matches on block with `status=blocked` and `endedAt`;
- creates reports with existing `ReportReasonCode`;
- returns safe public block/report shapes and never returns raw Prisma moderation rows.

### ChatModule

`ChatController` and `MatchConversationsController` receive authenticated chat requests and delegate to `ChatService`.

`ChatService`:

- reads actor/sender from `CurrentUser`;
- lists only conversations where the current user is an active participant;
- hides blocked conversations from the list;
- reads messages only through active membership and not-found style blocked reads;
- sends only in active conversations with a second active participant;
- rejects sends on active block with safe `403`;
- starts conversations only for match participants;
- creates `Conversation` and both `ConversationParticipant` rows in a transaction;
- returns existing conversation idempotently, including after match expiration;
- maps unique `matchId` race to reading the existing conversation;
- trims plain text and rejects empty message body;
- returns explicit safe conversation/message shapes, not raw Prisma rows.

## Future Module Additions

When implementing future moderation expansion, chat realtime or discovery ranking:

1. Add the endpoint to the owning module.
2. Define DTOs before accepting input.
3. Identify owner/participant/membership rules first.
4. Define public/self/internal serializer shapes before returning data.
5. Add pagination for list endpoints.
6. Update `program-flow-map.md`, `docs/api/README.md` and `docs/security/README.md`.
