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

## Edge-case data sweep + one bug fixed (branch `redesign`)

Loaded a large, varied dataset to stress the UI (now ~45 articles across 8
authors, 32 tags, follows/favorites/comments) including deliberate edge cases:
mixed-script + emoji titles (Cyrillic/CJK/Arabic), a ~170-char title, a long-form
body, zero-tag and 12-tag articles, a 100+ char unbreakable token and long URLs,
code/markdown bodies, duplicate titles, minimal content, and **HTML/XSS injection
attempts** in titles, descriptions and comments. Then ran a focused Playwright
bug hunt.

What held up (no bug):

- **XSS / escaping** — no `v-html`/`innerHTML` anywhere; every value renders via
  Vue's auto-escaped `{{ }}`. Injected `<script>` / `<img onerror>` payloads show
  as literal text, no dialog fires, no injected elements enter the DOM (titles,
  bodies and comments all safe).
- **Slug uniqueness** — duplicate titles get a numeric suffix
  (`edge-case-duplicate-title`, `…-2`); both resolve to distinct articles.
- **Validation** — whitespace-only comments are rejected (422).
- Unicode/emoji render correctly; pagination walks all 5 pages (Next disabled on
  the last); large favorite counts and many/zero tags render fine.

Bug found and fixed:

- **Mobile horizontal overflow on long unbreakable words / URLs.** A 100+ char
  token or long URL in a title, lead, card title/excerpt, or comment pushed the
  layout past the viewport (`scrollWidth` ≫ `innerWidth` at 375 px → horizontal
  scroll). Fix: added `overflow-wrap: anywhere` to `.article-page > h1`,
  `.article-lead`, `.article-title`, `.article-excerpt`, and `.comment-body` in
  `style.css` (the article *body* already had it). `anywhere` (not `break-word`)
  is required because the comment list is a CSS grid — `break-word` fixes the line
  box but not grid min-content sizing. Re-verified: no overflow on any edge
  article at 375 / 768 / 1280 px. `pnpm --filter vue build` still PASS.

Note (minor, not fixed): a title made of *only* non-Latin characters slugifies to
an empty base (the slugger strips non-ASCII), relying on the numeric-suffix
fallback for uniqueness. Harmless here; worth a transliteration step if full
i18n slugs are ever required.

## Accessibility + usability audit (branch `redesign`)

Ran **axe-core** (WCAG 2.0/2.1 A & AA + best-practice) over every page in both
logged-out and logged-in states (home, login, register, article detail, profile,
feed, editor, settings), plus manual keyboard/focus/screen-reader checks.

Real issues found and fixed:

- **Links in running text relied on colour only** (WCAG 1.4.1, serious) — the
  inline links in `.auth-footer`, `.comment-login-hint` and the session-expired
  notice were accent-coloured with no underline. Now underlined at rest.
- **Heading order skipped a level** on profiles (h1 → h3, moderate) — the profile
  article-card titles are now `<h2>` (matches the Home/Feed cards).
- **Dynamic messages weren't announced** — every `.error-message` now has
  `role="alert"` and the Settings success message has `role="status"`, so screen
  readers announce validation/auth feedback when it appears.
- **No skip link** — added a "Skip to content" link (hidden until keyboard-focused)
  targeting `<main id="main-content">`.
- Added a `prefers-reduced-motion` reset to honour that OS setting.

Already correct (verified, no change needed):

- Every form input has a label (implicit wrapping `<label>`), confirmed by driving
  the forms via Playwright `get_by_label`.
- Landmarks present on every page (`header` / `nav[aria-label]` / `main`); exactly
  one `<h1>` per page; `document.title` updates per route.
- All interactive controls are real `<button>`/`<a>` (no clickable divs); favorite
  toggles expose `aria-pressed`, profile tabs use `role="tab"` + `aria-selected`.
- Visible keyboard focus ring on every focusable element (box-shadow), checked by
  tabbing through the nav and forms.
- Colour contrast passes AA (axe `color-contrast` clean).

Result: **axe reports 0 violations on all pages** (app-scoped; the only axe hits in
the raw run came from the preview tool's own injected overlay, `.panel-entry-btn`,
not the app). `pnpm --filter vue build` PASS; full create/comment/favorite/delete
flow re-smoked green after the changes.

Known minor limitation (not fixed, would be over-engineering for this project):
SPA route changes don't programmatically move focus to the new page's heading.
Landmarks + the skip link mitigate it; a `router.afterEach` focus handler could be
added if strict SR navigation parity is required.

## Toast notifications for action feedback (branch `redesign`)

Action feedback no longer renders as inline banners inside the page. Validation
errors ("Comment body is required.", "Password must be at least 8 characters."),
sign-in prompts, failed actions and the "Settings saved." confirmation now appear
as small dismissable **toasts in the bottom-right corner** that stack and
auto-hide after ~4.5 s. Inline `.error-message` banners remain only for page-load
failures (could not load article / articles / profile / feed), where a vanishing
toast would leave a blank page.

Kept deliberately simple (student-style, no toast "system"):

- `src/composables/useToast.ts` — ~25 lines: a module-level `toasts` ref plus
  `notifyError` / `notifySuccess` / `dismissToast` functions. No plugin, no
  provide/inject, no extra component — the markup is a small `v-for` block in
  `App.vue`, styled by one CSS section (`.toast-host` / `.toast`).
- Views just import `notifyError` and call it where they previously assigned
  `errorMessage.value`.

Accessibility: error toasts have `role="alert"`, the success toast
`role="status"`, the close button an `aria-label`; the fade-in respects the
`prefers-reduced-motion` reset. Text contrast passes AA (7.2:1).

Verification after the change (all in-browser against the Docker stack):

| Check | Result |
| --- | --- |
| Toast behaviour (12 checks: appear/role/position/auto-hide/close/mobile) | PASS |
| Full flow sweep (register→login→CRUD→comments→favorites→follow/feed→tags→pagination→settings→invalid token→XSS→console/network) | PASS (31/31; two initial tag-filter "fails" were test-script races, re-verified green) |
| axe-core, 10 pages + toast-visible state, scoped to `#app` | 0 violations (one transient hit was axe sampling mid fade-in; clean once settled) |
| Responsive overflow, 7 pages × 375/768/1280 (incl. edge articles) | PASS, home collapses to one column |
| `pnpm --filter vue build`, `pnpm --filter nest build`, eslint/oxlint | PASS |

A follow-up code-review pass over the whole frontend source (every view,
composable, component, `style.css` end to end, plus a class-usage census in both
directions) found no logic issues and no leftover debug code; it removed three
pieces of dead CSS orphaned by the toast change: the unused
`.page-head--bordered` modifier, the `.success-message` rules (success feedback
is toast-only now; the shared block was folded into a single `.error-message`
rule with identical rendering, verified in-browser), and a stray `.tag` selector
(tags are styled via `.tag-list li`).

## Final submission audit (2026-07-03)

This audit was run against the matching repository at
`/Users/user/Documents/conduit-project`. The requested working directory
`/Users/user/Documents/conduit-app` is an empty, separate Git repository with no
commits; it was left untouched.

### Real issues found and fixed

- **OpenAPI validity:** removed an invalid `components.security` entry.
  Top-level `security` remains the global default, while public and optional-auth
  operations keep their explicit overrides.
- **OpenAPI email contract:** registration, login, and current-user updates now
  reject malformed email addresses with `422` and the standard
  `{ errors: { body } }` response.
- **Destructive actions:** article and comment deletion now require a native,
  keyboard-accessible confirmation. Cancel and confirm paths were both
  browser-tested.
- **Profile filter semantics:** replaced incomplete ARIA tab semantics with
  ordinary buttons using `aria-pressed`. The controls do not implement tab
  keyboard behavior, so presenting them as an ARIA tablist was misleading.
- **Dependency/security hygiene:** updated Vite to a patched release; pinned
  patched transitive versions of Multer, Hono, `fast-uri`, `qs`,
  `shell-quote`, and `brace-expansion`; removed unused Vue JSX and Vue DevTools
  plugins. The Docker-served frontend no longer exposes the development
  inspector.

### Fresh verification evidence

| Check | Result |
| --- | --- |
| `corepack pnpm install --frozen-lockfile` | PASS |
| NestJS type-check/build | PASS |
| Vue type-check/production build | PASS |
| oxlint + ESLint (read-only runs) | PASS, 0 findings |
| Redocly OpenAPI validation | PASS; valid document, 32 non-blocking documentation-style warnings |
| OpenAPI vs served NestJS routes | MATCH, 20 operations vs 20 routes |
| Isolated clean-volume Docker build/start | PASS; backend healthy, frontend started |
| API contract/security smoke | PASS, 41 checks |
| Chromium UI flow sweep | PASS, 9 end-to-end groups |
| Responsive overflow checks | PASS at 375, 768, and 1280 px |
| axe-core WCAG sweep | PASS, 0 violations across 11 public/authenticated desktop/mobile pages |
| Dependency audit | 0 moderate/high/critical; 1 low esbuild advisory remains |

The API sweep covered health, registration/login/current-user update, invalid
email validation, missing/invalid/wrong-scheme tokens, optional authentication,
profiles, follow/self-follow/unfollow, article CRUD, ownership failures,
feed, favorites, comments, tags, 201/200/204/401/403/404/422 statuses, and the
shared error shape. The browser sweep covered registration, persisted login
state, create/detail/edit/delete, comments, favorites, settings feedback,
followed-author feed, confirmation cancel/accept paths, invalid-token recovery,
semantic labels/focus, and responsive layout.

Test data lived in an isolated Compose project/volume, which was deleted after
the sweep. The normal Compose project was then rebuilt and restarted with its
original volume preserved.

### Remaining submission risks

- `README.md` now contains both team-member names and Matrikelnummern. The team
  should verify those user-provided values once more before submission.
- **Blocking repository setup:** the only configured remote is currently
  `https://github.com/damnenby/conduit-project.git`, while the assignment
  requires a GitLab repository link. Create/confirm the GitLab project and push
  this repository there manually before submitting.
- The supplied working-directory path points to the empty `conduit-app`
  repository, while the real project is `conduit-project`. Confirm the GitLab
  submission link targets the latter.
- The repository still has no permanent automated test suite. The comprehensive
  API/browser checks above were throwaway audit harnesses.
- Redocly's 32 warnings request optional metadata such as operation IDs, tag
  descriptions, a license, and generic 4xx responses. They do not make the
  document invalid and were not expanded this close to submission.
- `pnpm audit` reports one low-severity esbuild development-server advisory that
  applies to Windows. The submitted Compose runtime runs the Vite server inside
  a Linux container; there is no patched esbuild version inside Vite's current
  supported range yet.
- The documented project-scope limitations remain: TypeScript/SWC backend
  runtime, Vite dev server in Docker, SQLite single-writer behavior, and a
  Google Font with local serif fallbacks.
