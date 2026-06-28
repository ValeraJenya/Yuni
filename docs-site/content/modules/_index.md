---
title: "Backend-модули"
weight: 40
---


Все модули реализованы в `apps/backend/src/modules/`. Каждый модуль содержит controller, service и module файлы; при необходимости — dto/, types/, constants/.

## Список модулей

| Модуль | Статус | Основные endpoints |
|---|---|---|
| [auth]({{< relref "/modules/auth" >}}) | done | register, login, refresh, logout, me |
| [profiles]({{< relref "/modules/profiles" >}}) | done | GET/PATCH me, GET :handle |
| [media]({{< relref "/modules/media" >}}) | partial | profile photos CRUD |
| [discovery]({{< relref "/modules/discovery" >}}) | done | GET /discovery/cards |
| [likes]({{< relref "/modules/likes" >}}) | done | like, skip |
| [matches]({{< relref "/modules/matches" >}}) | done | GET /matches/me |
| [chat]({{< relref "/modules/chat" >}}) | done | conversations, messages, send |
| [moderation]({{< relref "/modules/moderation" >}}) | done | blocks, reports |
| [notifications]({{< relref "/modules/notifications" >}}) | done | list, unread-count, mark-read |

Также существует модуль `health` (`GET /health`) и `users` (scaffold only).
