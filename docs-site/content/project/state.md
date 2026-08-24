---
title: "Текущее состояние"
weight: 10
---


Последняя проверка: 2026-08-20. Commit: `42db25f`. Последний merged PR: PR #80 — User data export (Task 067a).

> Эта страница — ручная копия `docs/PROJECT_STATE.md`. Скрипта синхронизации
> нет; при расхождении источником истины считается файл в `docs/`.

## Baseline `main`

- Verified commit: `42db25f`
- Last merged task / PR: PR #80 — User data export (Task 067a)
- Открытых P0 нет

Закрыто с прошлой проверки этой страницы (она стояла на PR #31, отставание — 49 PR):

- Task 021 — profile completion считается бэкендом из семи обязательных полей и qualifying photo
- Task 024 — блокировка атомарно завершает `Match` и закрывает `Conversation` (PR #38, read-path gap — PR #53)
- Task 022 — все экраны резолвят относительные media URL (PR #41 и PR #64)
- Task 043 — гонка при ответе на игру (PR #39)
- Task 053 и 058 — CI поднимает Postgres 16 сервисом и прогоняет backend e2e (PR #47, PR #49→#53)
- Task 059 — backend lint стал отдельным ESLint, а не `tsc --noEmit` (PR #47)
- Task 065 — публикация образов backend/frontend в GHCR (PR #48); деплоя в окружение по-прежнему нет
- Task 057 — `SettingsModule` с GET/PATCH `/settings/privacy` и `/settings/notifications` (PR #55 → #57, фикс импорта в PR #58)
- Task 063 — юридические страницы `/terms`, `/privacy`, `/help` (PR #60)
- Task 064 и 066 — невидимый текст в модалке фильтров и design tokens лендинга (PR #42)
- Task 042 — advisory-лок по паре пользователей сериализует блокировку и создание match (PR #61)
- Task 047 — файл фотографии удаляется до записи в БД (PR #62)
- Task 044 — остаток лимита голосовых пересчитывается под `SELECT ... FOR UPDATE` (приехало в PR #49, отмечено задним числом)
- Task 049 — `/health` проверяет Postgres и отдаёт 503 при недоступной базе (PR #65)
- Task 038 — мёртвый demo-mode удалён (PR #66)
- Task 052 — один `LangProvider`, выбор языка в `localStorage`, синхронизация между вкладками (PR #68)
- Task 071 — заглушки аватара по полу вместо фотографии живого человека (PR #73)
- Task 030 — экраны `/settings/privacy` и `/settings/notifications`, премиум-элементы удалены (PR #74)
- Task 069 — профиль: режим просмотра и явное сохранение (PR #75)
- Task 070 — онбординг-анкета сразу после регистрации (PR #76)
- Task 072 и Task 045 — демо-сид с 9 анкетами, матчем, диалогами и наполненной `conversation_starters` (PR #77)
- Task 060 — `ParseUUIDPipe` на `photoId`: 400 вместо 500 (PR #79)
- Task 067a — `GET /users/me/export` (PR #80)

Частично закрыто:

- Task 046 — регистрация (PR #63) и like → match (PR #69) атомарны; остаются match → notifications и message → notification
- Task 050 — кнопки в шапке диалога и премиум удалены (PR #72, PR #74); остаётся «Добавить» в секции «Интересы»
- Task 027 — базовый staged-chat backend есть; 043, 044 и 045 закрыты, открыты 048 и 068

## Реализованные backend-домены

- auth
- profiles
- discovery
- likes
- matches
- chat
- moderation
- notifications
- media
- settings
- health
- users (только `GET /users/me/export`)

## Profile photo architecture

После PR #23:

- `MediaService` использует `ProfilePhotoStorage`
- Local adapter отвечает за физическую запись и удаление файлов
- Публичный URL: `/uploads/profile-photos/...`
- Local storage — development/MVP решение

## Инвентарь тестов

- 20 unit-spec-файлов
- 6 e2e-файлов: `game-race`, `match-block-chat`, `media-path-params`, `profile-completion`, `settings`, `user-data-export`

Число unit-тестов взято из прогона на `42db25f`: `pnpm --filter backend test` → 20 сьютов, 211 тестов, все зелёные. E2E не запускались — им нужен реальный Postgres, по ним зафиксирован только инвентарь файлов.

Frontend-тестов нет: в `apps/frontend` ни одного `*.test.*` или `*.spec.*`.

## Подтверждённые ограничения

- Image sanitization и EXIF stripping не реализованы
- Object storage/CDN не реализованы; используется local adapter
- Pending/private media lifecycle не реализован: фотографии получают `approved` сразу при загрузке (Task 032)
- Загрузки аудио нет вообще; `voiceDurationSec` присылает клиент, проверка реальной длительности и обрезка не реализованы (Task 068)
- Самостоятельное удаление аккаунта отсутствует (Task 067b). Экспорт данных реализован, но доступен только прямым запросом — кнопки в интерфейсе нет, и фотографии выгружаются метаданными без файлов
- Фича «Интересы» не реализована: `Interest`/`ProfileInterest` есть в схеме, но эндпоинтов нет (Task 050)
- Realtime/WebSocket нет ни в чате, ни в уведомлениях
- Восстановление пароля и подтверждение email не реализованы (Task 031, 033)
- Production deployment не реализован: образы публикуются, окружения нет (Task 025)

## Активные задачи

- Task 027 — `in_progress`: остаются contract alignment (048) и аудио (068)
- Task 046 — `in_progress`: остаются два пути уведомлений
- Task 050 — `in_progress`: остаётся секция «Интересы»
- Task 054 — `in_progress`: синхронизация документации, четвёртый заход подряд

Полный backlog описан в [Roadmap]({{< relref "/project/roadmap" >}}).
