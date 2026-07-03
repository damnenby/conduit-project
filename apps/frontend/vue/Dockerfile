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

RUN pnpm --filter vue build

EXPOSE 5173

CMD ["pnpm", "--filter", "vue", "dev", "--host", "0.0.0.0"]
