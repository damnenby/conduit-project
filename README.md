# Conduit

A small article/blogging app (a "RealWorld"-style project) built for
**Web Engineering II** at Hochschule Stralsund. Users can register, log in, write
and edit articles, comment, favorite articles, follow other authors, and read a
personal feed of the authors they follow.

## Team

> Replace the placeholders below before submitting. Do not leave them as-is.

| Name | Matrikelnummer |
| --- | --- |
| _TODO: team member 1_ | _TODO_ |
| _TODO: team member 2_ | _TODO_ |

## Tech stack

- **Frontend:** Vue 3 + Vue Router, built with Vite
- **Backend:** Express 5 + TypeScript (run with `tsx`)
- **Database:** SQLite via Prisma 7 (better-sqlite3 driver adapter)
- **Auth:** JWT, sent as `Authorization: Token <jwt>`; passwords hashed with bcrypt
- **Tooling:** pnpm workspaces (monorepo), Docker Compose

## Documentation

- **API contract:** [`docs/openapi.yaml`](docs/openapi.yaml) — the OpenAPI 3.0
  spec that the backend implements. Open it in any OpenAPI viewer (e.g.
  [editor.swagger.io](https://editor.swagger.io/)).
- **Architecture:** [`docs/architecture.md`](docs/architecture.md) — context,
  building block, runtime, and infrastructure views (Mermaid diagrams).

## Run with Docker (recommended)

The whole stack starts with a single command:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

On startup the backend applies the database migrations automatically and the
frontend waits until the backend is healthy. The SQLite file is stored in the
`conduit-data` volume, so data survives restarts.

## Run locally (without Docker)

Install dependencies:

```bash
pnpm install
```

Create the local SQLite database:

```bash
cd libs/database/sqlite
DATABASE_URL=file:./dev.db pnpm exec prisma migrate deploy --config prisma.config.ts
cd ../../..
```

Start the backend (terminal 1):

```bash
pnpm start:express
```

Start the frontend (terminal 2):

```bash
pnpm start:vue
```

The frontend calls the API through relative `/api/...` paths. In development the
Vite dev server proxies `/api` to the backend (see `apps/frontend/vue/vite.config.ts`),
so there are no hardcoded `localhost` URLs in the frontend code.

## Environment variables

| Variable | Used by | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | backend, Prisma | `file:../../../libs/database/sqlite/dev.db` | SQLite database location |
| `JWT_SECRET` | backend | `dev-secret` | Secret used to sign/verify JWTs |
| `VITE_API_PROXY_TARGET` | frontend (dev/proxy) | `http://localhost:3000` | Where the Vite proxy forwards `/api` (set to `http://backend:3000` in Docker) |

The defaults are local demo values only. A real deployment would provide a strong
`JWT_SECRET` from a secret store. An example file is in
`apps/backend/express/.env.example`.

## Project structure

```
apps/
  backend/express/   Express + TypeScript REST API
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

- **Express instead of NestJS.** The teacher allows any choice inside the
  TypeScript universe as long as the OpenAPI spec is followed. Express was chosen
  for a small, explicit surface: each router maps directly to spec endpoints with
  no framework magic, which makes the code easy to read and explain. The
  consequence is that there is no built-in dependency injection or module system,
  and each module keeps its controller and business logic together. If the
  project grew, that logic would be the natural thing to extract into a service
  layer. **If the course strictly requires NestJS, this is the main point to
  clarify with the teacher before submission.**
- **Authorization via Express middleware.** `requireAuth` / `optionalAuth`
  (in `apps/backend/express/src/middleware/auth.ts`) are the Express equivalent of
  NestJS guards: they attach only to the routes that need them. Authentication
  failures return **401**; ownership failures (e.g. editing someone else's
  article) are checked in the handler and return **403**.
- **SQLite + Prisma.** A single-file database keeps the project reproducible and
  trivial to run in Docker, while Prisma provides a typed client and migrations.

## Known limitations / future work

- The backend runs through `tsx` (TypeScript at runtime) rather than serving a
  compiled bundle; this is fine for the project scope but a production build would
  serve the compiled output.
- The frontend runs the Vite dev server in Docker for simplicity; a production
  setup would build static files and serve them behind a small web server.
- There is no automated test suite; the API was verified manually.
- SQLite is single-writer; it is a good fit for this demo but a larger
  deployment would use a server database such as PostgreSQL.
