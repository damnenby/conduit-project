# Architecture

This document describes the architecture of the Conduit project. The diagrams
follow the views taught in the course (arc42 style): scope & context, building
block, runtime, and infrastructure. They describe the system as it is actually
implemented in this repository, not an idealized version.

## Overview

Conduit is a small article/blogging application (a "RealWorld"-style app). It
consists of:

- a **Vue 3** single-page frontend (`apps/frontend/vue`),
- a **NestJS + TypeScript** REST backend (`apps/backend/nest`),
- a **SQLite** database accessed through **Prisma** (`libs/database/sqlite`),
- shared **TypeScript models** (`libs/model`).

The whole system is a pnpm monorepo and can be started with `docker compose up`.
The REST contract is defined in [`openapi.yaml`](./openapi.yaml).

---

## 1. Scope & Context View (Kontextabgrenzungssicht)

The system as a black box, with the people and systems around it.

```mermaid
flowchart LR
    reader(["Reader<br/>(anonymous visitor)"])
    author(["Author<br/>(registered user)"])

    subgraph system[Conduit]
        app["Conduit Web Application"]
    end

    reader -->|"browse & read articles, profiles, tags"| app
    author -->|"register, log in, write/edit articles,<br/>comment, favorite, follow"| app
    app -->|"HTML/JS + JSON over HTTP"| reader
    app -->|"HTML/JS + JSON over HTTP"| author
```

- **Actors**: anonymous readers and registered authors. There is no separate
  admin role.
- **Required external systems**: none. The app is self-contained and stores
  everything in its own SQLite database. The optional demo seed uses DiceBear
  image URLs for mock avatars; if those images are unavailable, the Vue
  component falls back to local initials, so core functionality remains
  reproducible.
- **Interface**: a browser talking HTTP to the frontend, and the frontend
  talking JSON to the backend REST API under `/api`.

---

## 2. Building Block View (Bausteinsicht)

This opens the black box and shows the internal components and how they depend
on each other. It mirrors the real folder structure.

```mermaid
flowchart TB
    subgraph fe["apps/frontend/vue (Vue 3 SPA)"]
        views["Views<br/>Home, Article, Editor,<br/>Profile, Feed, Login, ..."]
        router["Vue Router<br/>route guards for requiresAuth"]
        useAuth["useAuth composable<br/>token in localStorage"]
        views --> useAuth
        router --> useAuth
    end

    subgraph be["apps/backend/nest (NestJS API)"]
        main["main.ts<br/>bootstrap, /api prefix,<br/>global exception filter"]

        subgraph features["Feature modules (controller -> service)"]
            usersC["Users + CurrentUser<br/>controllers"]
            usersS["UsersService"]
            artC["ArticlesController"]
            artS["ArticlesService"]
            profC["ProfilesController"]
            profS["ProfilesService"]
            tagC["TagsController"]
            tagS["TagsService"]
            usersC --> usersS
            artC --> artS
            profC --> profS
            tagC --> tagS
        end

        subgraph globals["Global modules"]
            auth["AuthModule<br/>AuthGuard / OptionalAuthGuard<br/>TokenService (JWT)"]
            prismaS["PrismaModule<br/>PrismaService"]
        end

        main --> features
        usersC --> auth
        artC --> auth
        profC --> auth
        usersS --> prismaS
        artS --> prismaS
        profS --> prismaS
        tagS --> prismaS
    end

    subgraph libs["libs (shared code)"]
        model["libs/model<br/>TypeScript types (@common/model)"]
        database["libs/database<br/>Prisma client + schema (@common/database)"]
    end

    db[("SQLite file<br/>dev.db")]

    views -->|"fetch /api/... with Token header"| main
    artS --> model
    prismaS --> database
    database --> db
```

### Component responsibilities

| Component | Responsibility |
| --- | --- |
| `main.ts` | Bootstraps the Nest app, sets the global `/api` prefix, and registers the global exception filter. |
| Feature modules (`users`, `profiles`, `articles`, `tags`) | Each module has a **controller** (HTTP layer: routing, status codes, guards) and a **service** (business logic + validation). |
| `common/auth` | `AuthGuard` rejects requests without a valid token (401); `OptionalAuthGuard` attaches the user if a token is present but still allows anonymous access; `TokenService` signs/verifies JWTs; `password.ts` hashes/verifies passwords with bcrypt; `@CurrentUser()` exposes the user id to controllers. |
| `common/all-exceptions.filter.ts` | Normalizes every error to the `{ errors: { body } }` shape and logs unexpected errors (the 500 fallback). |
| `PrismaService` / `PrismaModule` | A single Prisma client (extends `PrismaClient`) configured with the better-sqlite3 adapter and `DATABASE_URL`; connects on `onModuleInit`. Provided globally. |
| `libs/model` | Shared response types (`Article`, `Comment`, `Profile`, `User`), imported by the backend via the `@common/model` path alias. |
| `libs/database` | Prisma schema, migrations, and the generated client, imported via `@common/database`. |

The `@common/model` and `@common/database` path aliases are configured in the
root `tsconfig.json`. This is the same "shared code in `/libs`" idea shown in the
course reference repository.

---

## 3. Runtime View (Laufzeitsicht)

### 3.1 Login

```mermaid
sequenceDiagram
    actor U as User (browser)
    participant FE as Vue (LoginView)
    participant BE as NestJS (/api/users/login)
    participant DB as SQLite (Prisma)

    U->>FE: enter email + password
    FE->>BE: POST /api/users/login {user:{email,password}}
    BE->>DB: findUnique user by email
    DB-->>BE: user row (with passwordHash)
    BE->>BE: bcrypt.compare(password, passwordHash)
    alt valid
        BE->>BE: createToken(userId) (JWT, 7d)
        BE-->>FE: 200 {user:{..., token}}
        FE->>FE: store user+token in localStorage
    else invalid
        BE-->>FE: 401 {errors:{body:["Email or password is wrong"]}}
        FE->>U: show error message
    end
```

### 3.2 Authenticated + authorized request (delete own article)

This is the flow that shows how authorization protects ownership-sensitive
actions.

```mermaid
sequenceDiagram
    actor U as User (browser)
    participant FE as Vue
    participant G as AuthGuard
    participant C as ArticlesController
    participant S as ArticlesService
    participant DB as SQLite (Prisma)

    U->>FE: click "Delete article"
    FE->>G: DELETE /api/articles/:slug (Authorization: Token <jwt>)
    G->>G: verify JWT
    alt no/invalid token
        G-->>FE: 401 Unauthorized
    else valid token
        G->>C: allow, attach userId
        C->>S: remove(slug, userId)
        S->>DB: find article by slug
        alt not found
            S-->>FE: 404 Not Found
        else found but article.authorId != userId
            S-->>FE: 403 Forbidden
        else found and owned
            S->>DB: delete article
            S-->>FE: 204 No Content
        end
    end
```

The key point for the defense: authentication (is the token valid?) is handled by
the `AuthGuard` and returns **401**, while authorization (does this user own the
resource?) is checked inside the service and returns **403**.

---

## 4. Infrastructure View (Infrastruktursicht)

How the system is deployed with Docker Compose.

```mermaid
flowchart TB
    subgraph host["Host machine"]
        subgraph compose["Docker Compose network"]
            fe["frontend container<br/>Vite dev server<br/>port 5173"]
            be["backend container<br/>NestJS on port 3000<br/>runs prisma migrate deploy on start"]
            vol[("conduit-data volume<br/>mounted at /data<br/>holds dev.db")]
        end
    end

    browser(["Browser"]) -->|"localhost:5173"| fe
    browser -->|"localhost:3000 (optional)"| be
    fe -->|"proxy /api to http://backend:3000"| be
    be --- vol
```

- **Two containers**: `frontend` and `backend`, on the default Compose network.
- **Service-name networking**: the frontend proxies `/api` to
  `http://backend:3000` (service name `backend`, **not** `localhost`), which is
  required for container-to-container communication.
- **Ports**: `5173` (frontend) and `3000` (backend) are mapped to the host.
- **Volume**: `conduit-data` is mounted at `/data` and stores the SQLite file, so
  data survives container restarts.
- **Startup order**: the backend has a healthcheck on `/api/health`; the frontend
  uses `depends_on: condition: service_healthy`, so it only starts once the
  backend is ready. The backend runs `prisma migrate deploy` before starting, so
  the schema always exists.
- **Secrets**: `JWT_SECRET` is a documented local demo default in
  `docker-compose.yml`. For a real deployment it would come from a secret/env
  store, not from version control.

---

## Notable design decisions

- **NestJS.** The backend uses NestJS to stay in the NestJS/TypeScript universe.
  Each resource is a module with a controller (HTTP layer) and a service (business
  logic); the DI container wires them together. This is more structure than a bare
  router framework, but it makes responsibilities explicit and is easy to explain.
- **Authorization with guards.** `AuthGuard` / `OptionalAuthGuard` are used
  instead of middleware because guards integrate with Nest's execution context and
  attach declaratively (`@UseGuards`) to exactly the routes that need them, keeping
  the controller/service separation clean.
- **Controller + service per module.** Controllers stay thin and only deal with
  HTTP concerns (routing, status codes, guards, reading the body); the services
  hold the validation and database logic. Validation is explicit in the services
  (rather than DTO decorators) so the responses match the OpenAPI error contract
  exactly.
- **SQLite via Prisma.** A single-file database keeps the project reproducible
  and easy to start in Docker; Prisma gives a typed client and migrations. The
  connection lives in a global `PrismaService` that connects on `onModuleInit`.
- **Runtime via SWC.** The app runs from TypeScript source through
  `@swc-node/register`, because the Prisma 7 client is ESM (uses `import.meta`) and
  NestJS DI needs decorator metadata — SWC supports both. `pnpm build` type-checks
  with `tsc`.
