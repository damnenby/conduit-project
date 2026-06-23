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
- [!] Constraint found: the generated Prisma client (`libs/database/.../prisma/client.ts`)
      uses `import.meta.url`, so it is **ESM-only**. The NestJS app therefore must
      run as ESM. NestJS DI also needs decorator metadata, which esbuild/tsx do not
      emit. Runtime choice: run from source via **SWC** (`@swc-node/register`), which
      supports ESM + `import.meta` + `emitDecoratorMetadata` + lenient resolution.
      PrismaClient (a runtime value) is imported by relative path; `@common/*` are
      used as type-only imports (erased), so no path-alias loader is needed.
- [x] Checkpoint 1: runtime spike PASSED. NestJS boots as ESM via SWC; full DI chain
      (controller → service → PrismaService) works; Prisma queried the real DB
      (`/api/_dbcheck` → users=5). `@swc/core` postinstall is skipped by pnpm's
      allowBuilds policy but SWC works via its prebuilt platform binary.
- [x] Checkpoint 2: ported auth/common + all feature modules (users, profiles,
      articles, comments, favorites, tags, health). `tsc --noEmit` passes. Full
      end-to-end smoke test against NestJS PASSED with identical behavior to
      Express: 201/200/204 codes, **401** (missing/invalid token), **403**
      (cross-user delete), 422 validation, 404, exact `{errors:{body}}` shape,
      comment-author following. All 20 routes mapped under `/api`.
      Note: `apiError` returns the exception and is thrown at call sites
      (`throw apiError(...)`) so TS narrows nulls like the old `return res.status()`.
- [x] Checkpoint 3: infrastructure switched to NestJS. Root scripts now `start:nest`/
      `build:nest`; new `apps/backend/nest/Dockerfile`; `docker-compose.yml` builds the
      nest Dockerfile and runs `pnpm --filter nest start` after `prisma migrate deploy`;
      frontend Dockerfile copies the nest package.json; `@swc/core` added to allowBuilds.
      Express app removed (recoverable from the checkpoint commit / git history).
      Lockfile refreshed; `pnpm install --frozen-lockfile` verified OK (Docker-safe).
- [x] Checkpoint 4: README + `docs/architecture.md` + `docs/openapi.yaml` description
      updated from Express to NestJS (building block diagram, runtime view, component
      table, design decisions). Final verification all green (see below).

## Final verification (NestJS migration complete)

| Check | Result |
| --- | --- |
| `pnpm --filter nest build` (tsc --noEmit) | PASS |
| `pnpm --filter vue build` (vue-tsc + vite) | PASS |
| `pnpm install --frozen-lockfile` (Docker-safe) | PASS |
| NestJS boots, all 20 routes mapped under `/api` | PASS |
| Route diff: OpenAPI spec vs NestJS served routes | MATCH (20 = 20, 0 diff) |
| End-to-end smoke: 201/200/204/401/403/404/422, error shape, comment following | PASS |
| Docker files/paths consistent | Verified by inspection (Docker not installed locally) |

The migration is complete. The active backend is **NestJS** (`apps/backend/nest`);
the Express app has been removed. The API still matches `docs/openapi.yaml`, the
database layer (`libs/database`) is unchanged, and auth/authorization behavior is
identical (401 vs 403). `docker compose up` could not be executed here because
Docker is not installed on this machine.
