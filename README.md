# Conduit

Conduit is our project for **Web Engineering II** at Hochschule Stralsund. It is an article platform where users can register, publish and edit articles, comment, favorite articles, follow authors, and read a personal feed.

## Team

| Name | Matrikelnummer |
| --- | --- |
| Valentyn Zhernovoi | 20474 |
| Moafk Al Masre | 21755 |

## Tech stack

- **Frontend**: Vue 3, Vue Router, and Vite
- **Backend**: NestJS 11 and TypeScript
- **Database**: SQLite with Prisma 7 and the better-sqlite3 adapter
- **Authentication**: JSON Web Tokens (JWT) through `@nestjs/jwt`; passwords are hashed with bcrypt
- **Tooling**: pnpm workspaces and Docker Compose

## Documentation

- **API contract**: [`docs/openapi.yaml`](docs/openapi.yaml) contains the OpenAPI 3.0 specification
- **Architecture**: [`docs/architecture.md`](docs/architecture.md) contains the context, building block, runtime, and infrastructure views

## Run with Docker (recommended)

Start the frontend, backend, and database with:

```bash
docker compose up
```

Use `docker compose up --build` after changing dependencies or Dockerfiles.

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3000](http://localhost:3000)

The backend applies database migrations before it starts. The frontend waits for the backend health check. Docker stores the SQLite file in the `conduit-data` volume, so the data remains available after a restart.

### Optional demo data

While the Docker stack is running, add the sample users, articles, comments, follows, and favorites:

```bash
node scripts/seed-demo.mjs
```

The account credentials are listed in [`DEMO_USERS.md`](DEMO_USERS.md). All email addresses use the reserved `.test` domain.

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

The frontend uses relative `/api/...` paths. The Vite development server proxies these requests to the backend according to `apps/frontend/vue/vite.config.ts`.

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

We use these defaults for local development. Set a separate `JWT_SECRET` before running the application on another system. The backend example is in `apps/backend/nest/.env.example`.

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

## Architecture decisions

- **NestJS**: We divide the backend into the `users`, `profiles`, `articles`, and `tags` modules. Controllers handle HTTP requests, while services contain validation and database operations. NestJS dependency injection connects these modules.
- **Authentication and authorization**: Our guards read the `Authorization: Token <jwt>` header. `AuthGuard` protects authenticated routes, and `OptionalAuthGuard` adds user data when a valid token is available. Services check article and comment ownership because they already have access to the required database records.
- **Error responses**: We register one exception filter to keep errors in the `{ errors: { body } }` format defined by the API contract.
- **TypeScript runtime**: We run the backend source through `@swc-node/register`. The Prisma 7 client uses ECMAScript modules (ESM), and NestJS dependency injection requires decorator metadata. SWC supports both requirements. The build command uses `tsc` for type checking.
- **SQLite and Prisma**: We use SQLite to keep the database inside the Docker setup. Prisma supplies the generated client and migrations. `PrismaService` creates the shared database connection.

## Known limitations / future work

- We run the backend from TypeScript source through SWC. We do not create and run a compiled backend bundle in Docker.
- The frontend container runs the Vite development server instead of serving the built static files.
- We do not have a permanent automated test suite yet.
- SQLite permits one writer at a time.
- The frontend stores authentication data in `localStorage` instead of a secure HttpOnly cookie.
- Slugs use ASCII characters. Titles containing only non-Latin characters use `article`, followed by a numeric suffix when required.
- Route changes do not move keyboard focus to the new page heading.
- Sample avatars and the Newsreader font use external URLs. The interface uses initials and local serif fonts when those resources are unavailable.
