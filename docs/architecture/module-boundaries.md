# Module Boundaries

Yuni is currently a modular monolith. The goal is to keep product development simple for a small team while preventing auth, profiles, media, likes, matches, chat and moderation from bleeding into each other.

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

### ProfilesModule

Owns profile questionnaire and profile visibility:

- own profile read/update;
- public profile by handle;
- profile privacy behavior;
- public/self profile serializers.

ProfilesModule should not upload files, create matches or send messages.

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

Planned.

Owns like/dislike/pass/superlike actions and related anti-abuse limits.

### MatchesModule

Planned.

Owns match state, match participant checks and match lifecycle.

### ChatModule

Planned.

Owns conversations, participants, messages and conversation membership checks.

### ModerationModule

Planned.

Owns reports, blocks, abuse handling and future admin review workflows.

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

## Future Module Additions

When implementing likes, matches, chat, moderation or discovery:

1. Add the endpoint to the owning module.
2. Define DTOs before accepting input.
3. Identify owner/participant/membership rules first.
4. Define public/self/internal serializer shapes before returning data.
5. Add pagination for list endpoints.
6. Update `program-flow-map.md`, `docs/api/README.md` and `docs/security/README.md`.
