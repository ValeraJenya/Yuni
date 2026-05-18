# 0001 PostgreSQL Domain Foundation

Статус: принято

Yuni использует PostgreSQL как основу базы данных для MVP.

Схема разделена на доменные блоки: auth, users, profiles, media/photos, likes, matches, chat, moderation, privacy и notifications. Это упрощает owner checks и будущие границы NestJS-модулей.

Sensitive data и private flows моделируются явно, а не складываются в одну большую таблицу users. Пароли и refresh tokens хранятся только как хэши. Profile privacy, blocks, reports и chat membership вынесены в отдельные записи, чтобы backend authorization строился на понятных join и constraints.

Public identity принадлежит профилю через `profiles.handle`, а не учетной записи. Handle - это URL-friendly технический идентификатор: латинские буквы, цифры, underscore, dot и практичные ограничения длины. Пользовательский текст профиля остается обычным текстом и может поддерживать кириллицу.

Yuni хранит один underlying profile на пользователя и использует явные privacy settings, чтобы backend serializer отдавал open или private представление. Private mode не отдает user-uploaded photos; вместо них используется системный anonymous rabbit avatar через `privacy_settings.anonymous_avatar_key`.

Dating flows представлены напрямую, но без лишней сложности: directional likes поддерживают `like`, `superlike`, `pass`; matches имеют `matched_at`, стандартный 7-дневный `expires_at` и понятные lifecycle statuses; photos поддерживают upload, moderation, primary selection и publishing без хранения бинарников в PostgreSQL. Match expiration для MVP реализуется request-time логикой, без обязательной scheduled cleanup инфраструктуры.

Discovery eligibility - backend rule, который поддерживается схемой: активный account/profile state, включенная discoverability, разрешение privacy discovery, минимальное заполнение профиля, block filters и минимум одно approved published primary photo.

MVP report reason codes зафиксированы: `spam`, `fake_profile`, `harassment`, `sexual_content`, `hate_speech`, `scam_or_money`, `underage_suspected`, `violence_or_threats`, `other`.

Изначальная схема остается SQL-first и не привязана полностью к ORM. Prisma используется в backend foundation как DB access layer, но PostgreSQL-specific constraints вроде expression/partial indexes должны сохраняться в SQL migrations.
