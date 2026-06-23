# Review & Migration Notes

Running log of the review and the Express → NestJS backend migration. Newest
checkpoint at the bottom of each section.

## Baseline (verified working Express backend)

Before the migration the project was a working Conduit app:

- Backend: **Express 5 + TypeScript** at `apps/backend/express`, run via `tsx`.
- Frontend: Vue 3 (`apps/frontend/vue`), talks to `/api` via a Vite proxy.
- DB: SQLite via Prisma 7 (`libs/database/sqlite`), shared types in `libs/model`.
- Contract: `docs/openapi.yaml` (20 operations, 13 path items).

Verified before migration (all passed):

- `corepack pnpm --filter express build` (tsc) — OK
- Full end-to-end API smoke test — OK, including:
  - register / login, JWT issued
  - `401` for missing/invalid token
  - `403` for cross-user article delete (ownership)
  - articles CRUD, list/feed, comments, favorites, follows, tags
- `corepack pnpm --filter vue build` — OK
- OpenAPI YAML valid, routes match implementation exactly.

This is the rollback point. The Express backend is the known-good fallback.

## Migration goal

Replace the active backend with **NestJS + TypeScript** while preserving:

- the exact API surface in `docs/openapi.yaml`,
- the `Authorization: Token <jwt>` auth scheme and JWT/bcrypt behavior,
- authorization (401 vs 403) behavior,
- the error shape `{ "errors": { "body": [...] } }` and status codes,
- the Prisma/SQLite database layer (`libs/database`) unchanged,
- a working frontend and `docker compose up`.

## Chosen technical approach

- New NestJS app at `apps/backend/nest` (CommonJS, standard NestJS layout).
- Run via `ts-node --transpile-only` + `tsconfig-paths` so the existing
  `@common/database` / `@common/model` path aliases keep working at runtime and
  the database layer stays untouched (mirrors how Express ran from source via
  `tsx`, but with proper decorator-metadata support that NestJS DI needs).
- `@nestjs/jwt` for tokens (same payload `{ userId }`, 7d expiry, `JWT_SECRET`).
- Custom `AuthGuard` / `OptionalAuthGuard` parsing the `Token ` scheme (NestJS
  equivalent of the Express auth middleware).
- A global exception filter to keep the `{ errors: { body } }` shape and the
  500 fallback.
- Validation kept explicit in services to match the exact error messages /
  422 behavior of the contract (no DTO/class-validator rewrite).

## Progress log

- [x] Checkpoint 0: created branch `migrate-nestjs`, documented baseline, committed
      current stable state.
