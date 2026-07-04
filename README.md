# Conduit

We built Conduit for **Web Engineering II** at Hochschule Stralsund. Users can create an account, publish articles, write comments, favorite articles, follow authors, and read a personal feed.

## Team

| Name | Matrikelnummer |
| --- | --- |
| Valentyn Zhernovoi | 20474 |
| Moafk Al Masre | 21755 |

## Technology

- **Frontend**: Vue 3, Vue Router, and Vite
- **Backend**: NestJS 11 and TypeScript
- **Database**: SQLite with Prisma 7 and the better-sqlite3 adapter
- **Authentication**: JSON Web Tokens (JWT) and bcrypt password hashing
- **Tooling**: pnpm workspaces and Docker Compose

## Documentation

- **API contract**: [`docs/openapi.yaml`](docs/openapi.yaml) contains the OpenAPI 3.0 specification
- **Architecture**: [`docs/architecture.md`](docs/architecture.md) contains the context, building block, runtime, and infrastructure views

## Run with Docker

Before starting, make sure Docker Desktop or Docker Engine is running and ports `3000` and `5173` are free. Docker Compose is included with Docker Desktop. You do not need a local Node.js or pnpm installation to start the application.

Run this command from the repository root:

```bash
docker compose up
```

On the first run, Docker builds both images and installs the dependencies. The backend then applies the Prisma migrations and starts NestJS. The frontend starts after the backend health check succeeds.

Open the application after both services have started:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3000](http://localhost:3000)
- Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

Press `Ctrl+C` to stop the attached containers. Then remove the stopped containers and network:

```bash
docker compose down
```

The SQLite database stays in the `conduit-data` volume. The next start uses the same users and articles.

After changing source files, dependencies, or a Dockerfile, rebuild the images:

```bash
docker compose up --build
```

To run the containers in the background, add `-d`:

```bash
docker compose up -d
docker compose ps
```

Use `docker compose logs -f` to follow the logs. Use `docker compose down` when you are finished.

### Add sample data

A new Docker volume contains an empty database. To add the sample users, articles, comments, follows, and favorites, keep Docker running and execute:

```bash
node scripts/seed-demo.mjs
```

This optional script requires Node.js 18 or newer on the host. The account credentials are listed in [`DEMO_USERS.md`](DEMO_USERS.md).

### Reset the Docker database

To remove all local users, articles, and comments, stop the stack and delete its volume:

```bash
docker compose down -v
docker compose up
```

The `-v` option deletes the SQLite volume. Do not use it when you want to keep the current data.

### Docker problems

- If Docker reports that it cannot connect to the daemon, start Docker Desktop or the Docker service.
- If port `3000` or `5173` is already in use, stop the other process before starting Compose.
- If a container exits, inspect its output with `docker compose logs backend` or `docker compose logs frontend`.

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

The frontend uses relative `/api` paths. The Vite development server proxies these requests to the backend according to `apps/frontend/vue/vite.config.ts`.

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

We use these values for local development. The backend example is in `apps/backend/nest/.env.example`.

## Project structure

```text
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

- Register, log in, and update the current user
- View profiles and follow or unfollow authors
- Create, edit, delete, list, and filter articles
- Read a feed from followed authors
- Create and delete comments
- Favorite and unfavorite articles
- List the tags used by articles

## Why we structured it this way

- **NestJS modules**: We group the backend by `users`, `profiles`, `articles`, and `tags`. Controllers handle HTTP requests. Services validate data and perform the database operations.
- **Guards**: `AuthGuard` protects routes that require a login. `OptionalAuthGuard` reads a token when one is present but still allows public access. We check ownership in the services because that is where we load articles and comments.
- **Error format**: One exception filter keeps backend errors in the `{ errors: { body } }` format from the OpenAPI specification.
- **Prisma**: `PrismaService` gives the backend one shared database connection. Prisma also manages the schema and migrations.
- **SWC runtime**: The backend runs TypeScript through `@swc-node/register`. We need SWC because Prisma 7 uses ECMAScript modules and NestJS needs decorator metadata. The build command still uses `tsc` for type checking.

## Current limitations

- We run the backend from TypeScript source through SWC. We do not create and run a compiled backend bundle in Docker.
- The frontend container runs the Vite development server instead of serving the built static files.
- We do not have a permanent automated test suite yet.
- SQLite permits one writer at a time.
- The frontend stores authentication data in `localStorage` instead of a secure HttpOnly cookie.
- Slugs use ASCII characters. Titles containing only non-Latin characters use `article`, followed by a numeric suffix when required.
- Route changes do not move keyboard focus to the new page heading.
- Sample avatars and the Newsreader font use external URLs. The interface uses initials and local serif fonts when those resources are unavailable.
