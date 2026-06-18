FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN corepack pnpm install --frozen-lockfile

COPY apps/backend apps/backend

EXPOSE 4000

CMD ["sh", "-c", "corepack pnpm --dir apps/backend prisma:generate && corepack pnpm --dir apps/backend dev"]
