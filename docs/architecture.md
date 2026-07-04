# Architecture

This document explains how we structured Conduit. It contains the context, building block, runtime, and infrastructure views for our application.

## System overview

We split Conduit into the following parts:

- a **Vue 3** single-page frontend in `apps/frontend/vue`
- a **NestJS and TypeScript** REST backend in `apps/backend/nest`
- a **SQLite** database accessed through **Prisma** in `libs/database/sqlite`
- shared **TypeScript models** in `libs/model`

We keep the code in a pnpm monorepo and start the application with `docker compose up`. [`openapi.yaml`](./openapi.yaml) defines the REST contract.

## 1. Scope and context view (Kontextabgrenzungssicht)

This view shows the actors and external interfaces.

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

- **Actors**: We distinguish between anonymous readers and registered authors. We do not have an administrator role.
- **External systems**: The application stores its data in its own SQLite database. The sample data uses DiceBear image URLs for avatars, but the frontend displays initials when an image is unavailable.
- **Interface**: The browser loads the Vue frontend over HTTP. The frontend exchanges JSON with the REST API under `/api`.

## 2. Building block view (Bausteinsicht)

This view shows the main application modules and their dependencies.

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

The root `tsconfig.json` defines the `@common/model` and `@common/database` path
aliases.

## 3. Runtime view (Laufzeitsicht)

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

We separate token authentication from article ownership checks in this flow.

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

`AuthGuard` handles authentication and returns `401` for a missing or invalid token. `ArticlesService` checks ownership and returns `403` when the authenticated user does not own the article.

## 4. Infrastructure view (Infrastruktursicht)

This view shows the Docker Compose services and persistent volume.

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

- **Containers**: We run the `frontend` and `backend` services on the default Compose network.
- **Service-name networking**: The frontend proxies `/api` to `http://backend:3000`. Containers use the Compose service name `backend` instead of `localhost`.
- **Ports**: We map frontend port `5173` and backend port `3000` to the host.
- **Volume**: We mount `conduit-data` at `/data` for the SQLite file. This keeps the data between container restarts.
- **Startup order**: The backend health check calls `/api/health`. The frontend uses `depends_on: condition: service_healthy` and starts after the backend responds. The backend applies Prisma migrations before NestJS starts.
- **Secret**: `docker-compose.yml` contains a `JWT_SECRET` for local use. We can replace it through the environment when running the application elsewhere.

## Design decisions

- **NestJS**: We use NestJS because the backend remains in TypeScript and its modules make the HTTP and business logic easy to locate. Each resource has a controller and a service.
- **Authorization with guards**: We attach `AuthGuard` and `OptionalAuthGuard` to the relevant routes with `@UseGuards`. This keeps route authentication visible in the controller.
- **Controllers and services**: Our controllers handle routing, status codes, guards, and request data. Services validate input, access the database, and check ownership. This division keeps HTTP concerns separate from database-dependent rules.
- **SQLite through Prisma**: We use SQLite because it runs as part of the local setup without another database service. Prisma gives us migrations and a typed client. The global `PrismaService` connects during `onModuleInit`.
- **Runtime through SWC**: We run TypeScript through `@swc-node/register` because the Prisma 7 client uses ESM and NestJS requires decorator metadata. We use `tsc` to type-check the backend.
