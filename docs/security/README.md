# Security

Это стартовые правила безопасности для Yuni.

- Нельзя хранить реальные секреты в репозитории.
- Нельзя коммитить production credentials, API keys, токены, private certificates или пароли.
- Сырые пароли никогда не сохраняются: в базе должен быть только `password_hash`.
- Сырые refresh tokens никогда не сохраняются: в базе должен быть только `token_hash`.
- Password hashing реализуется через argon2.
- Refresh token хранится у клиента в HttpOnly cookie, а в базе хранится только argon2 hash.
- Cookie содержит `refreshTokenId.rawToken`: id нужен только для поиска строки сессии, raw token проверяется через argon2 и не сохраняется в базе.
- Refresh token rotation должна быть atomic и single-use: один refresh token может успешно использоваться только один раз.
- Параллельные refresh-запросы с одной cookie не должны создавать несколько валидных refresh sessions.
- Frontend хранит access token только в memory state. Access token нельзя сохранять в `localStorage`, `sessionStorage`, cookies или logs.
- Refresh token хранится только в HttpOnly cookie, выставленной backend. JavaScript не должен читать, копировать или сохранять refresh token.
- Frontend должен отправлять auth requests с `credentials: include`, чтобы browser сам отправлял HttpOnly cookie на `/auth/*`.
- При `401` frontend может один раз выполнить refresh retry через shared refresh promise, чтобы параллельные requests не создавали refresh storm.
- Access token передается как Bearer token и не должен логироваться.
- Нельзя логировать access tokens, refresh tokens, cookies, token hashes, пароли, session values и лишние персональные данные.
- Локальные значения окружения должны храниться в `.env`, а в `.env.example` должны быть только безопасные примеры.
- Доступ к чатам должен проверяться через membership в `conversation_participants`.
- Доступ к профилям, фото, лайкам, матчам, блокировкам и жалобам должен строиться вокруг authenticated `user_id` и owner checks.
- Private mode не должен отдавать user-uploaded photos; вместо них используется системный anonymous avatar.
- Auth endpoints имеют базовый throttling foundation. Production rate limits можно уточнить позже.

## Frontend is not a security boundary

Frontend validation используется только для UX. Browser-side checks можно обойти через DevTools, curl, Postman или прямые HTTP-запросы.

Все критичные правила должны enforced на backend:

- authentication and session rules;
- minimum age 18+;
- owner checks;
- conversation membership checks;
- media/photo ownership and visibility;
- likes/matches/block/report restrictions;
- public/private profile serialization.

Backend не должен доверять `birthDate`, `userId`, `profileId`, `conversationId`, `photoId`, `role`, `status`, `isAdult`, `isAgeConfirmed`, `isOwner`, `isMember` или `isAdmin`, пришедшим с frontend.

Возраст 18+ enforced на backend: backend сам вычисляет возраст по `birthDate` и не принимает `isAdult` или `isAgeConfirmed` как доказательство возраста. `birthDate` считается sensitive data и не должна логироваться.

Database constraints должны защищать критичные invariants там, где это возможно.

Mock/demo flow не является production auth source. Product UI может временно использовать mock-data для discover/matches/messages, но доступ к protected routes и состояние авторизации должны зависеть от backend session/API response, а не от frontend flag в storage.

## Database security/integrity baseline

- Greenfield schema применяется через Prisma migrations, а не через `prisma db push`.
- Migrations не должны содержать реальные email, пароли, refresh tokens, дампы БД или другие PII.
- DB-level constraints защищают критичные invariants даже при ошибке в application code.
- Case-insensitive unique indexes запрещают дубли email/handle, отличающиеся только регистром.
- Check constraints запрещают self-like, self-match, self-block и self-report.
- Unordered unique match pair index запрещает duplicate matches для пар `A-B` и `B-A`.
- Photo constraints запрещают published photo без approved moderation state и несколько primary photos для одного пользователя.
- Messages должны быть связаны с `conversation_participants`, чтобы sender был участником conversation.
- Raw passwords и raw refresh tokens не должны появляться ни в migrations, ни в seeds, ни в logs.

Полные security rules будут расширяться по мере реализации auth, chat, media, moderation и хранения данных.
