# Onboarding

Yuni организован как небольшой монорепозиторий. Начните с корневого `README.md`, затем переходите в нужную зону проекта.

- `apps/frontend` - текущий Next.js frontend.
- `apps/backend` - NestJS backend foundation.
- `database/schema`, `database/migrations`, `database/seeds` - зона базы данных.
- `docs` - документация по архитектуре, security, onboarding и decisions.
- `infra` - будущие docker и operational scripts.

Backend сейчас находится на стадии foundation: есть структура, конфигурация, Prisma schema и health endpoint, но полной бизнес-логики auth, profiles, likes, matches, chat, media и moderation пока нет.
