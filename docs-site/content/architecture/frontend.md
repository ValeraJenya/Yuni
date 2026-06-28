---
title: "Frontend"
weight: 20
---


Исходник: `docs/architecture/frontend-structure.md`. Frontend находится в `apps/frontend`.

## Структура

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

## Роли директорий

### `app/`

Next.js routing, layouts, pages.

| Route group | Назначение |
|---|---|
| `app/(auth)` | `/signin`, `/join`, `/forgot-password` |
| `app/(app)` | `/discover`, `/matches`, `/messages`, `/notifications`, `/profile` |
| `app/page.tsx` | Landing page |

### `features/`

Feature-specific UI и локальное поведение:

- `features/auth` — sign-in/sign-up UI, birthdate field
- `features/app-shell` — protected app shell и navigation
- `features/discover` — discover card UI и reveal interactions

### `lib/`

Frontend infrastructure и API clients:

| Файл | Назначение |
|---|---|
| `auth-api.ts` | Base fetch wrapper, auth endpoints |
| `auth-context.tsx` | Auth state, refresh bootstrap, shared refresh promise, `authenticatedRequest` |
| `profile-api.ts` | Profile и media/profile-photo API client |
| `discovery-api.ts` | Discovery card API client |
| `likes-api.ts` | LIKE/SKIP API client |
| `matches-api.ts` | Active matches API client |
| `chat-api.ts` | Conversations/messages API client |
| `notifications-api.ts` | Notifications API client |
| `blocks-api.ts` | Block/unblock API client |
| `reports-api.ts` | Report API client |
| `lang-context.tsx` | Language state |
| `demo-session.tsx` | Demo-only session helper |

### `components/`

- `components/ui` — reusable UI primitives
- `components/landing` — landing page sections

## Auth rules

Frontend — не security boundary.

- Access token — memory-only
- Refresh token — HttpOnly cookie, не читается JavaScript
- Access token нельзя хранить в `localStorage` или `sessionStorage`
- `AuthProvider` запускает сессию через `POST /auth/refresh`
- `authenticatedRequest` прикрепляет Bearer token и делает один retry при `401`

## API client rules

```text
page/component
  -> profileApi/authApi
  -> authenticatedRequest или apiRequest
  -> backend endpoint
```

## Local Docker runtime

- `NEXT_PUBLIC_API_URL` — browser-facing URL, например `http://localhost:4000`
- Нельзя ставить `NEXT_PUBLIC_API_URL=http://backend:4000` — браузер не в Docker network
- Frontend контейнер: порт `3000`

## Protected route rules

- Пока auth загружается — loading UI
- Не аутентифицирован → redirect на `/signin`
- Аутентифицирован → app shell и navigation

Auth pages (`app/(auth)/layout.tsx`):
- Уже аутентифицирован → redirect на `/discover`
