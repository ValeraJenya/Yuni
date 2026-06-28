---
title: "auth"
weight: 10
---


Файлы: `apps/backend/src/modules/auth/`

## Что делает

Управляет жизненным циклом аутентификации и сессий: регистрация, вход, ротация refresh-токенов, logout, получение текущего пользователя. Хранит только argon2-хэши паролей и токенов — raw secrets никогда не сохраняются.

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/auth/register` | Регистрация нового пользователя |
| `POST` | `/auth/login` | Вход по email + password |
| `POST` | `/auth/refresh` | Single-use rotation refresh-токена |
| `POST` | `/auth/logout` | Отзыв refresh-сессии, очистка cookie |
| `GET` | `/auth/me` | Текущий аутентифицированный пользователь |

## Rate limits

| Endpoint | Лимит |
|---|---|
| `POST /auth/register` | 3 / час / IP |
| `POST /auth/login` | 20 / 10 мин / IP + 5 / 10 мин / IP+email |
| `POST /auth/refresh` | 30 / 10 мин / IP |
| `POST /auth/logout` | 30 / 10 мин / IP |

## Взаимодействие с другими модулями

- Создаёт `profiles` row при регистрации (или делегирует `UsersModule`)
- `JwtAccessGuard` используется всеми защищёнными модулями
- `CurrentUser` декоратор извлекает аутентифицированного пользователя

## Prisma-модели

- `users` — account identity, `password_hash`, `status`
- `refresh_tokens` — hashed refresh tokens, `revoked_at`, `expires_at`

## Известные ограничения

- Email verification не реализована
- Password reset: UI stub существует (`/forgot-password`), backend endpoint отсутствует
- Superlike и расширенная auth функциональность вне scope MVP
