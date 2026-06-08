# Frontend Structure

Этот документ фиксирует текущую frontend-структуру Yuni и рекомендуемый стиль для будущих modules.

## Current Structure

Frontend находится в `apps/frontend`.

```text
apps/frontend/
  app/
  features/
  lib/
  components/
  hooks/
  mock-data/
  types/
  public/
```

## Directory Roles

### `app/`

`app/` содержит Next.js routing, layouts and pages.

Current route groups:

- `app/(auth)` - auth pages such as `/signin`, `/join`, `/forgot-password`;
- `app/(app)` - protected application routes such as `/discover`, `/matches`, `/messages`, `/profile`;
- `app/page.tsx` - landing page.

Pages should compose UI and call feature/API abstractions. They should not duplicate backend auth/session rules.

### `features/`

`features/` contains feature-specific UI and local feature behavior.

Current examples:

- `features/auth` - sign-in/sign-up UI and birthdate field;
- `features/app-shell` - protected app shell and navigation;
- `features/discover` - discover card UI and reveal interactions.

`app/(app)/discover/page.tsx` uses `lib/discovery-api.ts` as the primary source for cards. Mock/demo data may remain for prototype-only areas, but it is not a production source of truth.

### `lib/`

`lib/` contains frontend infrastructure and API clients.

Current files:

- `auth-api.ts` - base `fetch` wrapper and auth endpoints;
- `auth-context.tsx` - frontend auth state, refresh bootstrap, shared refresh promise and `authenticatedRequest`;
- `profile-api.ts` - profile and media/profile-photo API client;
- `discovery-api.ts` - discovery card API client and UI mapping;
- `likes-api.ts` - LIKE/SKIP API client;
- `matches-api.ts` - active matches API client;
- `blocks-api.ts` and `reports-api.ts` - moderation action clients;
- `lang-context.tsx` - language state;
- `demo-session.tsx` - demo-only session helper.

Protected requests should go through `authenticatedRequest`.

### `components/`

`components/ui` contains reusable UI primitives.

`components/landing` contains landing-page sections.

Reusable UI should stay generic. Feature-specific behavior should live under `features/<feature>` or the relevant route page.

### `mock-data/`

`mock-data` supports prototype flows. It must not become a production auth, access-control or backend-data substitute.

## Auth Rules

Frontend is not a security boundary.

- Access token is memory-only.
- Refresh token is not readable by JavaScript and must not be stored in frontend state.
- No access token or refresh token in `localStorage` or `sessionStorage`.
- Backend session/API response is the source of truth for auth.
- `AuthProvider` bootstraps session by calling `POST /auth/refresh`.
- `authenticatedRequest` attaches Bearer access token and retries once after `401` through the shared refresh promise.

Frontend validation is UX only. Backend still validates age, ownership, membership, media rules and other critical constraints.

## API Client Rules

Pages and feature components should call API clients, not raw backend URLs directly.

Current pattern:

```text
page/component
  -> profileApi/authApi
  -> authenticatedRequest or apiRequest
  -> backend endpoint
```

`auth-api.ts` owns:

- `NEXT_PUBLIC_API_URL`;
- `credentials: "include"`;
- JSON request/response handling;
- FormData support;
- `ApiError`.

`profile-api.ts` owns:

- `GET /profiles/me`;
- `PATCH /profiles/me`;
- `GET /profiles/:handle`;
- profile photos upload/set-primary/delete calls;
- conversion of backend relative `publicUrl` into frontend image URL.

## Future Recommended API Layout

As more product modules land, prefer moving toward:

```text
apps/frontend/lib/api/
  auth.ts
  profiles.ts
  media.ts
  likes.ts
  matches.ts
  chat.ts
  moderation.ts
```

Do not do this refactor only for aesthetics. Move when the current `lib/*-api.ts` files become too large or when a feature needs its own contract types.

## Protected Route Rules

Protected app routes are wrapped by `features/app-shell/components/app-content.tsx`.

- While auth is loading, show loading UI.
- If user is not authenticated, redirect to `/signin`.
- If user is authenticated, render app shell and navigation.

Auth pages are wrapped by `app/(auth)/layout.tsx`.

- If already authenticated, redirect to `/discover`.
- If loading, show loading UI.

These frontend checks are UX and navigation behavior. Backend authorization remains required for protected data.

## Adding New Frontend Work

For each new feature:

1. Add or update a focused API client.
2. Use `authenticatedRequest` for protected backend calls.
3. Keep tokens out of browser storage.
4. Keep route/page components thin.
5. Put reusable UI in `components/ui` only when it is truly generic.
6. Keep mock/demo flow isolated from production auth/data flow.
7. Update `docs/api` and `program-flow-map.md` when a new backend contract is used.
