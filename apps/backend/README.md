# Backend Yuni

Это базовая основа backend-приложения Yuni на NestJS.

Здесь есть модули и конфигурация, подключение Prisma, базовые security-настройки, `GET /health`, auth/session flow, Profiles MVP, Profile Photos / Media MVP, Discovery MVP, Likes MVP, Matches MVP, Chat MVP, Notifications MVP и Blocks/Reports (moderation) MVP. Текущие ограничения: нет image sanitization и EXIF stripping, нет object storage/CDN, нет realtime/WebSocket, production deployment не реализован.

## Структура

- `src/main.ts` - запуск NestJS, CORS, Helmet, ValidationPipe и общий фильтр ошибок.
- `src/app.module.ts` - корневой модуль приложения.
- `src/config` - загрузка и проверка переменных окружения.
- `src/common` - общие инфраструктурные части, включая Prisma, error filter, security helpers, serializers и pagination helpers.
- `src/modules/health` - рабочий health endpoint.
- `src/modules/auth` - `register`, `login`, `refresh`, `logout`, `me`.
- `src/modules/profiles` - MVP endpoints `GET /profiles/me`, `PATCH /profiles/me`, `GET /profiles/:handle`.
- `src/modules/media` - MVP endpoints для own profile photos: list, upload, set primary и delete.
- `src/modules/discovery` - Discovery MVP: `GET /discovery/cards`.
- `src/modules/likes` - Likes MVP: like/skip.
- `src/modules/matches` - Matches MVP и старт conversation из match.
- `src/modules/chat` - Chat MVP: conversations и текстовые сообщения.
- `src/modules/notifications` - Notifications MVP (in-app).
- `src/modules/moderation` - Blocks/Reports MVP.
- `src/modules/users` - граница доменного модуля users.
- `prisma/schema.prisma` - ORM-модель для Prisma Client.
- `prisma/migrations` - основной способ применения greenfield PostgreSQL schema.
- `prisma/seed.ts`, `prisma/seed/` - демо-данные для ручной проверки сценариев (Task 072/045), см. раздел «Демо-данные» ниже.
- `uploads/profile-photos` - local adapter storage для загруженных profile photos через `ProfilePhotoStorage`. Папка ignored by git.

## Локальный запуск

Из корня репозитория:

```bash
corepack pnpm install --frozen-lockfile
copy .env.example .env
corepack pnpm prisma:migrate:dev
corepack pnpm prisma:generate
corepack pnpm dev:backend
```

Перед `prisma:migrate:dev` в PostgreSQL должна существовать новая пустая база из `DATABASE_URL`, например `yuni`.

Для применения migrations на сервере или в CI используйте:

```bash
corepack pnpm prisma:migrate:deploy
```

Для локального сброса greenfield базы используйте только осознанно:

```bash
corepack pnpm prisma:migrate:reset
```

Проверка:

```bash
curl http://localhost:4000/health
```

Минимальная auth-проверка:

```bash
curl -i -c cookies.txt -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"handle\":\"test_user\",\"displayName\":\"Тест\",\"birthDate\":\"2000-01-01\"}"
```

После register/login скопируйте `accessToken` из ответа:

```bash
curl -i http://localhost:4000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

Проверка refresh/logout с cookie jar:

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:4000/auth/refresh
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:4000/auth/logout
```

Минимальная profile-проверка:

```bash
curl -i http://localhost:4000/profiles/me \
  -H "Authorization: Bearer <accessToken>"

curl -i -X PATCH http://localhost:4000/profiles/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d "{\"displayName\":\"Alex\",\"bio\":\"Short bio\",\"city\":\"Almaty\",\"country\":\"KZ\",\"isDiscoverable\":true}"

curl -i http://localhost:4000/profiles/test_user \
  -H "Authorization: Bearer <accessToken>"
```

Минимальная media/profile-photos проверка:

```bash
curl -i http://localhost:4000/media/profile-photos/me \
  -H "Authorization: Bearer <accessToken>"

curl -i -X POST http://localhost:4000/media/profile-photos \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@./local-photo.png"

curl -i -X PATCH http://localhost:4000/media/profile-photos/<photoId>/primary \
  -H "Authorization: Bearer <accessToken>"

curl -i -X DELETE http://localhost:4000/media/profile-photos/<photoId> \
  -H "Authorization: Bearer <accessToken>"
```

Media MVP принимает только JPEG/PNG/WebP до `5 MB`, генерирует storage filename на backend и не использует original filename как имя файла. `MediaService` работает через `ProfilePhotoStorage`, а текущий local adapter сохраняет файлы в `apps/backend/uploads/profile-photos` и возвращает `/uploads/profile-photos/...`. Production S3/CDN/media pipeline будет отдельной задачей позже.

Для запуска напрямую из backend:

```bash
pnpm --dir apps/backend dev
```

## Демо-данные

Проверить продукт вручную на пустой базе почти невозможно: нужен матч, история переписки и продвинутый по стадиям диалог, а получить их вручную — значит зарегистрировать несколько пользователей, заполнить анкеты, загрузить фото и пролайкать крест-накрест. `prisma/seed.ts` создаёт это состояние одной командой.

```bash
pnpm --dir apps/backend prisma:seed
```

Скрипт идемпотентен: повторный запуск не создаёт дублей (upsert по фиксированным id/handle/storageKey, проверка перед вставкой сообщений и лайков). Он отказывается запускаться, если `NODE_ENV=production`, если `DATABASE_URL` не указывает явно на `localhost`/`127.0.0.1`, или если целевая база называется `yuni_test` (её данные считает e2e-сьют).

Что создаётся:

- 9 анкет с паролем **`YuniDemo123!`** у всех, логин по email `<handle>@seed.yuni.local` (например `demo@seed.yuni.local`). Все анкеты полностью заполнены по `PROFILE_COMPLETION_FIELDS` и видны в Discovery. У каждой — одна approved/published фотография-заглушка (сгенерированный силуэт, `prisma/seed/assets/photos/`, копируется в `uploads/profile-photos` при запуске).
- `demo` — основной аккаунт для ручной проверки:
  - активный матч и диалог с `anna_l` (Аня) на этапе 1, с историей из ~10 сообщений;
  - активный матч и диалог с `igor_k` (Игорь) на этапе 2: пройдены обе игры этапа 1, показана текущая игра этапа 2, использован голосовой лимit (можно проверить остаток и отправку своих голосовых);
  - `sonya_m` (Соня) и ещё 4 анкеты видны в Discovery и не лайкнуты — можно лайкнуть вживую и получить матч.
- `conversation_starters` заполнена 4 активными фразами (Task 045) — `GET /chat/starters` больше не возвращает `[]` на чистой базе.

Прогон на отдельной scratch-базе (не трогает `yuni`/`yuni_test`):

```bash
docker compose exec postgres psql -U postgres -c "CREATE DATABASE yuni_demo;"
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yuni_demo?schema=public pnpm --dir apps/backend prisma:migrate:deploy
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yuni_demo?schema=public pnpm --dir apps/backend prisma:seed
```

## Важно

- Сырые пароли не хранятся: будущая реализация должна сохранять только `password_hash`.
- Сырые refresh tokens не хранятся: сохраняется только `token_hash`.
- Refresh token передается через HttpOnly cookie `yuni_refresh`; access token возвращается в JSON и используется как Bearer token.
- Prisma migrations являются основным workflow применения схемы. `prisma db push` не используется как основной путь.
- Проект стартует с новой пустой PostgreSQL БД; legacy data migration, перенос старых пользователей и cleanup старых данных не нужны.
- Доступ к приватным данным, чатам и профилям должен строиться вокруг `user_id`, membership checks и owner checks.
- Profile update endpoints должны брать owner identity только из `CurrentUser`, а не из body/query/path.
- Profile photo endpoints должны брать owner identity только из `CurrentUser`; `photoId` из path не является proof of access.
- Public profile serializers должны отдавать только approved+published photos и не раскрывать `storageKey`, filesystem path или original filename.
- Local adapter uploads не должны попадать в git, dumps или backups.
- Для будущих endpoints используйте `src/common/security`:
  - `assertOwner` / `assertSameUser` для owner-only действий;
  - `assertConversationMember` для chat reads/writes;
  - `assertMatchParticipant` для match-scoped действий;
  - `assertCanAccessProfile` / `assertCanAccessPhoto` для public/private visibility.
- Response shapes должны проходить через serializers из `src/common/serializers`: public profile не должен отдавать `email`, `passwordHash`, `birthDate`, refresh/session fields, deleted/internal moderation fields или private settings.
- List endpoints должны использовать cursor pagination из `src/common/pagination` с default limit `20` и max limit `50`. Unbounded lists запрещены.
- `database/schema/schema.sql` остается SQL-first reference/documentation. Реальный source of truth для применения схемы - `prisma/schema.prisma` вместе с `prisma/migrations`.
- PostgreSQL-specific expression/partial indexes и check constraints сохраняются в `migration.sql`.
