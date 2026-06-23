FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/backend/nest/package.json apps/backend/nest/package.json
COPY apps/frontend/vue/package.json apps/frontend/vue/package.json

RUN pnpm install --frozen-lockfile

COPY apps ./apps
COPY libs ./libs

# Type-check the backend at build time (the app itself runs from source via SWC).
RUN pnpm --filter nest build

EXPOSE 3000

CMD ["pnpm", "--filter", "nest", "start"]
