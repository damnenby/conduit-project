# Conduit

This is my web engineering project. Conduit is a small article app where users
can register, write articles, comment, like articles and follow authors.

## Run locally

Install packages:

```bash
pnpm install
```

Start backend:

```bash
pnpm start:express
```

Start frontend in another terminal:

```bash
pnpm start:vue
```

## Docker

```bash
docker compose up --build
```

Frontend: http://localhost:5173  
Backend: http://localhost:3000

## Status

Implemented: auth, articles, comments, likes, profiles, following, feed, tags
and Docker setup.
