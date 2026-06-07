# Data Exposure Rules

This document defines what Yuni API responses may expose.

Raw Prisma objects must not be returned directly to clients. Every response must use a serializer or an explicit response shape.

## Public API Must Not Expose

Public and other-user responses must not expose:

- `passwordHash`;
- raw password;
- access token, except auth endpoints explicitly returning a new access token to the current user;
- refresh token;
- `tokenHash`;
- cookies;
- email, except self/auth response;
- `birthDate`, except self profile;
- `deletedAt`;
- internal moderation fields;
- `storageKey`;
- local file path;
- original uploaded filename;
- private settings;
- reports or internal abuse data;
- raw session records;
- raw Prisma relation objects that include internal fields.

## Self API May Expose

Self endpoints may expose only data that belongs to the authenticated user and is needed by the frontend.

Allowed examples:

- safe auth user fields;
- own profile fields;
- own `birthDate`;
- own profile photo `moderationStatus`;
- own private settings, if a future endpoint is explicitly self/private;
- current access token only in auth/session responses.

Self responses still must not expose:

- `passwordHash`;
- refresh token;
- refresh token hash;
- cookies;
- local file path;
- `storageKey`, unless a future admin/internal endpoint explicitly requires it;
- internal abuse review data.

## Auth Response Shape

Auth responses may return:

- safe `user`;
- `accessToken`;
- HttpOnly refresh cookie set by backend.

Auth responses must not return:

- raw refresh token in JSON;
- password hash;
- token hash;
- internal refresh token row.

## Profile Response Shapes

### Self Profile

Self profile may include:

- `userId`;
- `handle`;
- `displayName`;
- `birthDate`;
- `bio`, `gender`, `lookingFor`, `city`, `country`;
- `isDiscoverable`;
- `completedAt`;
- own photos with `moderationStatus`.

Self profile must not include:

- email;
- password/session fields;
- refresh tokens;
- `storageKey`;
- local filesystem path;
- internal moderation notes.

### Public Profile

Public profile may include:

- `userId`;
- `handle`;
- public `displayName` depending on privacy mode;
- public `bio`, location and profile fields depending on privacy mode;
- approved and published public photos.

Public profile must not include:

- email;
- `birthDate`;
- private settings;
- internal moderation fields;
- `storageKey`;
- local file path;
- unpublished or unapproved photos.

## Media Response Shapes

Public photo response may include:

- `id`;
- `publicUrl`;
- `blurhash`;
- `isPrimary`;
- `position`.

Self photo response may additionally include:

- `moderationStatus`;
- `publishedAt`.

No media response should expose local storage internals such as `storageKey`, filesystem path or original filename.

## Likes Response Shapes

Likes MVP responses may include only the explicit interaction confirmation shape:

- `interaction.targetProfileUserId`, which is `profiles.user_id`;
- `interaction.action`, currently `like` or `skip`;
- `interaction.expiresAt`.

Likes responses must not expose:

- raw Prisma `Like` rows;
- `id`;
- `likerUserId`;
- raw `likedUserId` outside the documented `targetProfileUserId` response field;
- `kind`;
- `createdAt`;
- `updatedAt`;
- user email;
- `birthDate`;
- private profile settings;
- password/session/token fields.

## Matches Response Shapes

Matches MVP responses may include only explicit active match fields:

- `match.id`;
- `match.matchedProfile.userId`;
- `match.matchedProfile.handle`;
- `match.matchedProfile.displayName`;
- `match.matchedProfile.primaryPhotoUrl`;
- `match.matchedAt`;
- `match.expiresAt`;
- `match.status`;
- `match.conversationStarted`.

Matches responses must not expose:

- raw Prisma `Match`, `User`, `Profile` or `ProfilePhoto` rows;
- `userAId`;
- `userBId`;
- raw `userA` or `userB` relation objects;
- email;
- `birthDate`;
- password or `passwordHash`;
- refresh/session/token fields;
- `storageKey`;
- local file path;
- original uploaded filename;
- private profile settings;
- deleted user/profile fields;
- internal moderation fields.

## Blocks Response Shapes

Block responses may include only:

- `block.blockedUserId`;
- `block.createdAt`;
- `block.status`, currently public value `"blocked"`;
- `nextCursor` for `GET /blocks/me`.

Block responses must not expose:

- raw Prisma `Block` rows;
- internal block id;
- `blockerUserId`;
- user email;
- `birthDate`;
- private profile fields;
- report data;
- password/session/token fields.

`GET /blocks/me` may return only outgoing blocks owned by the authenticated user.

## Reports Response Shapes

Report responses may include only:

- `report.id`;
- `report.targetUserId`;
- `report.reason`;
- `report.createdAt`;
- public `report.status`, currently `"received"`.

Report responses must not expose:

- raw Prisma `Report` rows;
- `reporterUserId`;
- internal `reportedUserId` outside documented `targetUserId`;
- internal `ReportStatus`;
- `comment` / submitted details;
- `updatedAt`, `resolvedAt`, `resolutionNote`;
- moderator identity, notes or workflow state;
- target user email, `birthDate`, private profile fields or session/token data.

## Admin API Future Rule

Admin API must be documented separately before implementation.

Admin/internal serializers must not be mixed with public/self serializers. If an admin endpoint needs sensitive fields, the endpoint must:

- live under an explicit admin/moderation boundary;
- require admin authorization;
- use a separate response shape;
- be documented in `docs/security` and `docs/api`.

## Implementation Rules

- Public/self/admin serializers should be separate.
- `toSafeAuthUser`, `toSelfProfile`, `toPublicProfile`, `toSelfProfilePhoto` and `toPublicProfilePhotos` are current examples.
- New modules must define their response shape before shipping endpoints.
- If a service uses Prisma `include`, verify included relations do not leak into response.
- Error responses must not reveal security-sensitive details.
- Logs must not contain access tokens, refresh tokens, cookies, passwords, birthDate, private profile fields or messages.
