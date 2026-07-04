# Conduit

A small article/blogging app (a "RealWorld"-style project) built for
**Web Engineering II** at Hochschule Stralsund. Users can register, log in, write
and edit articles, comment, favorite articles, follow other authors, and read a
personal feed of the authors they follow.

## Team

| Name | Matrikelnummer |
| --- | --- |
| Valentyn Zhernovoi | 20474 |
| Moafk Al Masre | 21755 |

## Tech stack

- **Frontend:** Vue 3 + Vue Router, built with Vite
- **Backend:** NestJS 11 + TypeScript
- **Database:** SQLite via Prisma 7 (better-sqlite3 driver adapter)
- **Auth:** JWT (`@nestjs/jwt`), sent as `Authorization: Token <jwt>`; passwords hashed with bcrypt
- **Tooling:** pnpm workspaces (monorepo), Docker Compose

## Documentation

- **API contract:** [`docs/openapi.yaml`](docs/openapi.yaml) contains the OpenAPI
  3.0 specification. Open it in an OpenAPI viewer such as
  [editor.swagger.io](https://editor.swagger.io/)).
- **Architecture:** [`docs/architecture.md`](docs/architecture.md) contains the
  context, building block, runtime, and infrastructure views.

## Run with Docker (recommended)

The whole stack starts with a single command:

```bash
docker compose up
```

Use `docker compose up --build` after changing dependencies or Dockerfiles.

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3000](http://localhost:3000)

On startup the backend applies the database migrations automatically and the
frontend waits until the backend is healthy. The SQLite file is stored in the
`conduit-data` volume, so data survives restarts.

### Optional demo data

While the Docker stack is running, populate it with mock users, articles,
comments, follows, and favorites:

```bash
node scripts/seed-demo.mjs
```

The mock credentials are documented in [`DEMO_USERS.md`](DEMO_USERS.md). They
are local demonstration accounts, not real people or production credentials.

## Run locally (without Docker)

Install dependencies:

```bash
corepack pnpm install
```

Create the local SQLite database:

```bash
cd libs/database/sqlite
DATABASE_URL=file:./dev.db corepack pnpm exec prisma migrate deploy --config prisma.config.ts
cd ../../..
```

Start the backend (terminal 1):

```bash
corepack pnpm start:nest
```

Start the frontend (terminal 2):

```bash
corepack pnpm start:vue
```

The frontend calls the API through relative `/api/...` paths. In development the
Vite dev server proxies `/api` to the backend (see `apps/frontend/vue/vite.config.ts`),
so there are no hardcoded `localhost` URLs in the frontend code.

## Verify builds

```bash
corepack pnpm --filter nest build
corepack pnpm --filter vue build
docker compose config
docker compose build
```

## Environment variables

| Variable | Used by | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | backend, Prisma | `file:../../../libs/database/sqlite/dev.db` | SQLite database location |
| `JWT_SECRET` | backend | `dev-secret` | Secret used to sign/verify JWTs |
| `VITE_API_PROXY_TARGET` | frontend (dev/proxy) | `http://localhost:3000` | Where the Vite proxy forwards `/api` (set to `http://backend:3000` in Docker) |

The defaults are local demo values only. A real deployment would provide a strong
`JWT_SECRET` from a secret store. An example file is in
`apps/backend/nest/.env.example`.

## Project structure

```
apps/
  backend/nest/      NestJS + TypeScript REST API
  frontend/vue/      Vue 3 single-page app
libs/
  database/          Prisma schema, migrations, generated client (@common/database)
  model/             Shared TypeScript types (@common/model)
docs/
  openapi.yaml       API contract
  architecture.md    Architecture views
docker-compose.yml   Backend + frontend services
```

## Implemented use cases

Auth & profile: register, log in, get/update current user, view profile, follow
and unfollow authors. Articles: create, edit (author only), delete (author only),
list with pagination, view one, filter by tag/author/favorited, personal feed.
Engagement: comment on articles, delete own comments, favorite/unfavorite.
Tags: list tags in use.

## Design decisions (for the defense)

- **NestJS.** The backend uses NestJS to stay in the NestJS/TypeScript universe.
  It is organized into feature modules (`users`, `profiles`, `articles`, `tags`)
  where controllers handle the HTTP layer and services hold the business logic.
  Nest's dependency injection connects the modules. A global `PrismaModule`
  provides database access, and a global exception filter keeps errors in the
  `{ errors: { body } }` shape.
- **Authorization via guards.** `AuthGuard` / `OptionalAuthGuard`
  (`apps/backend/nest/src/common/auth/`) read the `Authorization: Token <jwt>`
  header. Guards attach to the routes that require authentication. Authentication
  failures return `401`; services perform ownership checks and return `403`.
- **Runtime (SWC, ESM).** The app runs from TypeScript source via
  `@swc-node/register`. SWC is used because the Prisma 7 client is ESM (it uses
  `import.meta`) and NestJS DI needs decorator metadata. SWC supports both, while
  plain esbuild/`tsx` does not. `pnpm build` type-checks with `tsc`.
- **SQLite + Prisma.** SQLite keeps the Docker setup self-contained. Prisma
  provides a typed client and migrations.
  The connection lives in a `PrismaService` that connects on `onModuleInit`.

## Known limitations / future work

- The backend runs from TypeScript source via SWC rather than serving a compiled
  bundle. A production setup would compile and run the output.
- The frontend container runs the Vite development server. A production setup
  would serve the built static files.
- The repository has no permanent automated test suite.
- SQLite permits one writer at a time. A larger deployment would use a database
  server such as PostgreSQL.
- Authentication data is stored in `localStorage`. A production application
  would normally use a secure HttpOnly cookie.
- Slugs use ASCII characters. Titles containing only non-Latin characters use
  the fallback slug `article` with a numeric suffix when needed.
- Single-page application route changes do not move keyboard focus to the new
  page heading.
- Demo avatars and the Newsreader font use external URLs. Avatars fall back to
  initials and headings fall back to local serif fonts when offline.
