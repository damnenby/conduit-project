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

## Frontend redesign pass (branch `redesign`)

A focused visual redesign of the Vue frontend. No backend, route, API contract,
or architecture changes — only the frontend (`apps/frontend/vue`), plus one small
client-side auth-UX improvement. Functionality is unchanged.

### UI problems found

- Plain, prototype look: default system fonts, weak type hierarchy, lots of
  unused whitespace, generic blue buttons.
- Navbar was a flat row of links with a default-looking "Logout" button and no
  real active state or user emphasis.
- Article/feed items were flat bordered boxes; weak title/meta/description
  hierarchy; favourite button looked like every other button.
- Tags sidebar looked unfinished; raw "No articles yet." / "No feed articles
  yet." empty states.
- Forms (login/register/settings/editor) were unstyled stacked inputs with no
  card, subtitle, or consistent grouping.
- **Harsh auth banner:** a stale/expired token left a red
  "Authorization token is invalid" banner stuck on the Feed page.

### Design direction

Calm editorial / reading-platform (Conduit / Medium-like). Warm off-white paper
background, near-black ink text, a single restrained deep-green accent, and a
serif display face (**Newsreader**, with Georgia/Iowan fallbacks) for headings
and article bodies paired with the system sans for UI. No gradients,
glassmorphism, neon, big shadows, emojis, or fake landing sections. A small,
token-based foundation (colours, type, spacing, radius) drives reusable button,
card, tag, form, and alert styles rather than one-off styling.

### Files changed

- `index.html` — `lang="en"`, meta description, Newsreader webfont link.
- `src/style.css` — rewritten as a token-based design foundation; restyles the
  existing class names (`button`, `.ghost`, `.danger`, `.article-list`,
  `.tag-list`, `.error-message`, nav, etc.) so all views improve, plus new
  component styles (cards, favourite pill, sidebar, empty state, alerts).
- `src/App.vue` — intentional sticky header with active state, single nav CTA,
  quieter "Sign out"; global "session expired" notice strip.
- `src/composables/useAuth.ts` — added `sessionExpired` state + `clearSession()`
  / `dismissSessionExpired()` (clears a stale token quietly).
- `src/composables/useApi.ts` (new) — `describeError(status, data)` for one
  consistent, friendly message (403 → "You do not have permission…").
- `src/components/ArticlePreview.vue` (new) — shared article card (byline,
  favourite pill, serif title, excerpt, tags, read-more); used by Home + Feed.
- `src/components/EmptyState.vue` (new) — reusable empty-state block with an
  optional CTA slot.
- All views (`HomeView`, `FeedView`, `ArticleView`, `ProfileView`, `LoginView`,
  `RegisterView`, `SettingsView`, `NewArticleView`, `EditArticleView`) — updated
  templates (page headers, cards, form cards, empty states) and 401 handling on
  authed requests; all fetch logic and endpoints preserved.

### Invalid-auth handling

- Authed requests that return **401** now call `clearSession()`: the invalid
  token is removed, the nav returns to the signed-out state, and a single calm
  "Your session has expired — Sign in again" notice is shown instead of the raw
  banner. Verified live: a forged token on `/feed` now shows a "Please sign in"
  empty state, not the red error.
- **403** is mapped to "You do not have permission to do that."
- Validation/business errors still surface their backend message via
  `describeError`.

### Accessibility / responsive

- Semantic landmarks (`header`/`nav`/`main`/`article`/`time`), real buttons and
  links (no clickable divs), `aria-pressed` on favourite toggles, `aria-label`
  on icon-light controls, `role="tab"`/`aria-selected` on profile tabs, form
  `autocomplete` hints, and a visible focus ring on every interactive element.
- Responsive: two-column home/feed collapses to one column at ≤860px (sidebar
  drops below), header wraps cleanly on mobile, forms/cards go full-width.
  Verified at 1280px, 768px, and 375px.

### Verification

| Check | Result |
| --- | --- |
| `pnpm --filter vue build` (vue-tsc + vite) | PASS |
| `oxlint src/` | PASS (0 warnings, 0 errors) |
| `eslint src/` | PASS |
| App runs against NestJS API (seeded sample data) | PASS |
| Home / article / login render; feed, tags, pagination work | PASS (screenshots) |
| Invalid-token UX (forged token → calm sign-in state) | PASS (verified live) |
| Responsive desktop / tablet / mobile | PASS (verified live) |

### Remaining limitations

- The Newsreader heading font loads from Google Fonts; offline it falls back to
  Georgia/Iowan Old Style (still editorial, intentional).

## Full Dockerized browser test sweep (branch `redesign`)

End-to-end testing of the redesigned app running under **Docker Compose**
(`docker compose up -d --build`: backend healthy on `:3000`, frontend dev server
on `:5173`, `/api` proxied to the backend). Driven with real headless-Chromium
**Playwright** scripts. This closes the "not click-tested" limitation above.

### How it was tested

- A multi-agent pass was attempted first but was cut off by an account session
  limit. Its draft scripts assumed the wrong URL scheme (`/article/`,`/profile/`
  singular) — the app uses **plural** `/articles/`, `/profiles/` — which produced
  a batch of false "bugs" (e.g. "Read more doesn't navigate", "no h1 on article",
  "Follow button missing"). All were traced to that bad assumption plus a few
  selector mistakes (checking `aria-disabled` instead of the native `disabled`
  attribute; not recognising wrapping `<label>` implicit labels; asserting on a
  client-side route before the SPA's `onMounted` fetch resolved).
- Findings were then re-verified by hand with correct routes/selectors and proper
  waits. **No real bug survived verification** — all were test-script artifacts.

### Flows verified (all PASS)

| Flow | Result |
| --- | --- |
| Register → logged-in nav state, `localStorage` token | PASS |
| Login, **wrong password** → readable error, stays signed out | PASS |
| Logout → nav returns to Sign in / Sign up | PASS |
| Create article → redirect to `/articles/<slug>`, h1/body/tags render | PASS |
| New article appears in Home list | PASS |
| Edit article → change persists (confirmed after reload = server truth) | PASS |
| Delete article → redirect home, gone from list | PASS |
| Comments: post (appears top), own-only Delete, delete removes it | PASS |
| Favorite / unfavorite: count ±1, `aria-pressed` toggles, persists on reload | PASS |
| Follow / unfollow → button toggles, feed shows followed author, empties on unfollow | PASS |
| Tags sidebar: pills render, filter + "Filtering by" note, "All" resets | PASS |
| Settings: save bio → success message; password < 8 chars → validation error | PASS |
| Pagination: "Previous" disabled (native `disabled`) on page 1 | PASS |

### Invalid / expired-token UX (the headline requirement)

- Forged token → visit `/feed`: **no** harsh "Authorization token…" banner. The
  bad session is cleared from `localStorage`, nav reverts to signed-out, a calm
  "Your session has expired — Sign in again — Dismiss" strip shows, and the feed
  body shows a "Please sign in" empty state. PASS (screenshot).
- Forged token on **public** pages (Home, Profile, Article): the backend's
  optional-auth returns **200 (anonymous)** for a bad token, so those pages render
  cleanly with no error banner at all. PASS.
- 401 on an authed action (favorite/follow/comment/settings/feed) → `clearSession()`
  everywhere; 403 → "You do not have permission to do that." PASS.

### Accessibility & responsive (re-confirmed in-browser)

- Labels: every form input uses a wrapping `<label>` (valid implicit association,
  exercised via Playwright `get_by_label`). Landmarks `header`/`nav`/`main`
  present on every page; favorite is a real `<button>` with `aria-pressed`;
  profile tabs use `role="tab"`/`aria-selected`.
- Responsive: **zero horizontal overflow** across Home / Profile / Login at
  1280×900, 768×1024, and 375×812. Home `.home-layout` collapses to a single
  column on mobile (computed `grid-template-columns: 339px` at 375px), tags
  sidebar stacks below.
- Console/network sweep: no unexpected errors. The only 401s observed were the
  **intentional** ones from the wrong-password and forged-token tests.

### Build & state

| Check | Result |
| --- | --- |
| `docker compose up -d --build` (rebuilt with redesign) | PASS (both services up, backend healthy) |
| `pnpm --filter vue build` (vue-tsc + vite) | PASS (46 modules, 117 kB JS / 12 kB CSS) |
| `pnpm --filter nest build` (tsc --noEmit) | PASS |

- **Bugs found / fixed:** none — no code changes were needed. The redesign is
  functionally correct; every reported issue was a flaw in the throwaway test
  scripts, not the app.
- Test data created during the sweep was cleaned up; the DB is back to the four
  curated `mara_dev` seed articles for a tidy demo.

### Manual checks worth doing before submission

- A quick visual pass on the article **detail** and **settings** pages on a real
  phone width (verified clean in headless Chromium, but eyes-on is reassuring).
- Confirm the Google-Fonts (Newsreader) load on the grader's network; the
  Georgia/Iowan fallback is intentional if it's blocked.
