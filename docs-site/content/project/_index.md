---
title: "О проекте"
weight: 10
---


Yuni — dating app в виде монорепозитория. Включает React-frontend, NestJS-backend, PostgreSQL/Prisma, документацию и Docker Compose для локальной разработки.

## Стек

| Компонент | Технология |
|---|---|
| Frontend | Next.js (React), TypeScript |
| Backend | NestJS, TypeScript |
| База данных | PostgreSQL + Prisma ORM |
| Локальный запуск | Docker Compose |
| Тесты | Jest (backend unit) |
| CI | GitHub Actions |

## Реализованные домены

auth · profiles · media · discovery · likes · matches · chat · moderation · notifications

## Текущие ограничения

- Image sanitization и EXIF stripping не реализованы
- Object storage/CDN (S3) не реализован — используется local adapter
- Realtime/WebSocket не реализован
- Production deployment не реализован
- Admin/moderation panel не реализован

## Разделы

- [Текущее состояние]({{< relref "/project/state" >}})
- [Roadmap]({{< relref "/project/roadmap" >}})
- [Матрица фич]({{< relref "/project/features" >}})
