# Security

Это стартовые правила безопасности для Yuni.

- Нельзя хранить реальные секреты в репозитории.
- Нельзя коммитить production credentials, API keys, токены, private certificates или пароли.
- Сырые пароли никогда не сохраняются: в базе должен быть только `password_hash`.
- Сырые refresh tokens никогда не сохраняются: в базе должен быть только `token_hash`.
- Нельзя логировать токены, пароли, session values и лишние персональные данные.
- Локальные значения окружения должны храниться в `.env`, а в `.env.example` должны быть только безопасные примеры.
- Доступ к чатам должен проверяться через membership в `conversation_participants`.
- Доступ к профилям, фото, лайкам, матчам, блокировкам и жалобам должен строиться вокруг authenticated `user_id` и owner checks.
- Private mode не должен отдавать user-uploaded photos; вместо них используется системный anonymous avatar.

Полные security rules будут расширяться по мере реализации auth, chat, media, moderation и хранения данных.
