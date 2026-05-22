FROM node:24-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/backend/express/package.json apps/backend/express/package.json
COPY apps/backend/nest/package.json apps/backend/nest/package.json
COPY apps/frontend/vue/package.json apps/frontend/vue/package.json

RUN pnpm install --frozen-lockfile

COPY apps ./apps
COPY libs ./libs

RUN pnpm --filter express build

EXPOSE 3000

CMD ["pnpm", "--filter", "express", "start"]
