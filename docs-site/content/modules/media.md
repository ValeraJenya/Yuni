---
title: "media"
weight: 30
---


Файлы: `apps/backend/src/modules/media/`

## Что делает

Управляет фотографиями профиля пользователя: загрузка, просмотр, назначение главного фото, удаление. Использует `ProfilePhotoStorage` boundary — текущая реализация через local adapter, для production S3/CDN будет отдельный шаг.

## Endpoints

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/media/profile-photos/me` | Список своих фотографий |
| `POST` | `/media/profile-photos` | Загрузка нового фото |
| `PATCH` | `/media/profile-photos/:photoId/primary` | Назначить фото главным |
| `DELETE` | `/media/profile-photos/:photoId` | Удалить фото |

Допустимые MIME-типы: `image/jpeg`, `image/png`, `image/webp`. Максимальный размер: 5 MB.

## Взаимодействие с другими модулями

- `ProfilesModule` — photos включаются в profile response
- `DiscoveryModule` — только `approved` + `published` фото отдаются в discovery cards
- `ModerationModule` — reports могут ссылаться на `profile_photo_id`
- `ProfilePhotoStorage` — абстракция хранилища; текущий local adapter сохраняет файлы в `apps/backend/uploads/profile-photos`

## Prisma-модели

- `profile_photos` — `id`, `user_id`, `storage_key`, `public_url`, `is_primary`, `position`, `moderation_status`, `published_at`, `blurhash`

Публичный URL: `/uploads/profile-photos/<generated-uuid>`. `storage_key` никогда не отдаётся клиенту.

## Известные ограничения

- Image sanitization и EXIF stripping не реализованы
- Object storage/CDN (S3) не реализованы
- Pending/private media lifecycle (очередь модерации) не реализован — загруженные фото помечаются `approved` сразу
- Production media pipeline запланирован в Task 023
