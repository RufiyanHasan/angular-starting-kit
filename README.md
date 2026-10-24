# Angular Starter Kit

A production-ready starter for new client projects. Clone it and you have a working app on day one: auth, an HTTP layer, theming, i18n, a sample feature, tests, CI and Docker.

> **Status:** Phase 2 of 8 complete (architecture). The [Progress log](#progress-log) below is updated after every phase.

---

## Tech baseline (checked 2026-10-24)

| Tool          | Version                              | Notes                                                                          |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| Angular / CLI | 22.2.x                               | Standalone, signals, `@if`/`@for`, `inject()`, zoneless (default since v21)    |
| Node.js       | **26** (`.nvmrc`), 24.15+ also works | Angular 22 requires `^22.22.3 \|\| ^24.15.0 \|\| >=26`. Enforced via `engines` |
| TypeScript    | 6.0                                  | `strict: true` plus the Angular strict template flags                          |
| Unit tests    | Vitest (Angular CLI default runner)  | via `@angular/build:unit-test`                                                 |
| E2E           | Playwright 1.64                      |                                                                                |

---

## Plan

### Folder structure

```
.
├── .github/workflows/ci.yml        # install → lint → test → build → e2e
├── .husky/                         # pre-commit (lint-staged), commit-msg (commitlint)
├── docs/ADR/                       # Architecture Decision Records
├── e2e/                            # Playwright specs + fixtures
├── docker/nginx.conf               # SPA fallback + gzip
├── Dockerfile                      # multi-stage: node build → nginx runtime
├── public/
│   ├── assets/config.json          # runtime config (one build, many environments)
│   ├── assets/i18n/{en,es}.json    # translations
│   └── mockServiceWorker.js        # MSW worker (generated)
└── src/
    ├── environments/               # build-time flags only (@env/*)
    ├── mocks/                      # MSW handlers + in-memory DB (never in prod bundle)
    ├── styles/                     # tokens.scss, themes, reset, utilities
    └── app/
        ├── app.config.ts           # providers: router, http, config, i18n, auth
        ├── app.routes.ts
        ├── core/                   # @core/*  singletons, provided at root
        │   ├── auth/               # AuthProvider interface, MockJwtAuthProvider, AuthService, guards
        │   ├── config/             # AppConfig type, ConfigService, provideAppInitializer loader
        │   ├── http/               # interceptors, ApiService<T>, loading tracker
        │   ├── error/              # global ErrorHandler → toast + logger
        │   ├── logging/            # LoggerService (console now, pluggable sink)
        │   ├── i18n/               # Transloco setup + loader
        │   └── theme/              # ThemeService (light/dark, persisted)
        ├── shared/                 # @shared/*  UI with no business logic
        │   ├── ui/                 # button, input, data-table, dialog, confirm-dialog,
        │   │                       # toast, empty-state, skeleton
        │   ├── directives/         # autofocus, trap-focus, etc.
        │   ├── pipes/
        │   └── utils/
        ├── layout/                 # shell, header, sidebar, footer, skip link, route loading bar
        └── features/               # @features/*  lazy-loaded
            ├── auth/               # login page
            ├── dashboard/
            ├── settings/
            ├── users/              # list → detail → edit, NgRx SignalStore example
            └── not-found/
```

**Dependency rule:** `features → shared, core`, `layout → shared, core`, `shared → nothing app-specific`, `core → nothing in features`. ESLint enforces it with `no-restricted-imports`.

### Dependencies (each one justified)

| Package                                              | Why                                                                                                                                                                                                                                            | Built-in alternative considered                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `angular-eslint`, `eslint`, `typescript-eslint`      | Linting is required; this is the official Angular ESLint integration                                                                                                                                                                           | None (Angular CLI has no linter)                                                             |
| `prettier`, `eslint-config-prettier`                 | Consistent formatting, so reviews skip whitespace debates                                                                                                                                                                                      | None                                                                                         |
| `husky`, `lint-staged`                               | Run lint and format on staged files before each commit                                                                                                                                                                                         | None                                                                                         |
| `@commitlint/cli`, `@commitlint/config-conventional` | Enforce conventional commits for changelogs and semver                                                                                                                                                                                         | None                                                                                         |
| `@jsverse/transloco`                                 | Runtime language switching. Angular's `@angular/localize` is build-time only (one build per locale)                                                                                                                                            | `@angular/localize` rejected: no runtime switching                                           |
| `@ngrx/signals`                                      | SignalStore example only (Users feature). Plain signal services remain the default                                                                                                                                                             | Plain signal services (used everywhere else)                                                 |
| `msw`                                                | A mock backend at the network layer: real `HttpClient` requests, real interceptors, and the same handlers reused in tests and e2e. Behind `config.json → mockApi: true` and loaded with a dynamic import, so it stays out of real environments | Interceptor-based mock: lighter, but it skips the real network path and interceptor ordering |
| `@playwright/test`                                   | E2E (required)                                                                                                                                                                                                                                 | None                                                                                         |
| `@axe-core/playwright`                               | Automated a11y check: zero serious or critical violations                                                                                                                                                                                      | None                                                                                         |
| Vitest + `@vitest/coverage-v8`                       | CLI default unit runner, with coverage for the 80% target on `core/`                                                                                                                                                                           | n/a (default)                                                                                |

**Not adding:** a UI component library (Material, PrimeNG), Tailwind, a date library, or lodash. Shared components are hand-built on CSS custom properties, so each client can be re-themed without fighting a vendor design system. _(If you'd prefer Angular CDK for focus trap and overlay, it's first-party and I'd add it. My default is to hand-roll the small subset we need.)_

### Key design decisions

- **Runtime config:** `provideAppInitializer` fetches `/assets/config.json` before bootstrap. `ConfigService` exposes it as a typed readonly signal. Docker can overwrite the file per environment at container start.
- **Auth:** an `AUTH_PROVIDER` injection token implements the `AuthProvider` interface (`login`, `logout`, `refresh`, `user$`/`user` signal, `getAccessToken`). `AuthService` is the only thing features touch. Swapping to OIDC means replacing one provider in `app.config.ts`.
- **HTTP interceptors (in order):** timeout → loading counter → auth token → refresh-on-401 (a single in-flight refresh; concurrent requests wait on it) → error → toast. Requests can opt out per call via `HttpContext` tokens (`SKIP_AUTH`, `SKIP_LOADING`, `SKIP_ERROR_TOAST`).
- **State:** signal-based services (`signal` + `computed` + methods) by default. The Users feature uses NgRx SignalStore to show the alternative. An ADR documents when to choose which.
- **Theming:** design tokens as CSS custom properties, with `[data-theme]` on `<html>`. Defaults to `prefers-color-scheme`, and the user's choice is persisted in `localStorage`.
- **SSR:** off by default. The README documents `ng add @angular/ssr`.

### Phases

| #   | Phase                                                                                                                   | Commit                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | Workspace & tooling: CLI app, ESLint, Prettier, husky, lint-staged, commitlint, path aliases, `.editorconfig`, `.nvmrc` | `chore: scaffold workspace and tooling`                         |
| 2   | Architecture: folders, runtime config, layout shell, lazy routes, 404, route loading bar                                | `feat(core): add architecture, runtime config and layout shell` |
| 3   | Auth: AuthProvider + mock JWT, guards, login page                                                                       | `feat(auth): add pluggable auth with mock JWT provider`         |
| 4   | HTTP: interceptors, ApiService, MSW mock backend                                                                        | `feat(http): add interceptors, api service and mock backend`    |
| 5   | UI: theming, shared components, a11y, Transloco (en + es)                                                               | `feat(ui): add theming, shared components, a11y and i18n`       |
| 6   | State & Users feature (SignalStore)                                                                                     | `feat(users): add users feature with signal store`              |
| 7   | Testing: unit (≥80% on `core/`), Playwright e2e + axe                                                                   | `test: add unit coverage and playwright e2e`                    |
| 8   | DevOps & docs: GitHub Actions, Dockerfile, nginx, full README, ADRs                                                     | `ci: add pipeline, docker and docs`                             |

Each phase ends with `lint` + `test` + `build` all green, a short summary, and a commit. The next phase doesn't start while anything is red.

### Prerequisite

Node **26** (see `.nvmrc`). Node 24.15+ also works. On macOS, use the official installer from nodejs.org, or `nvm install` / `fnm use` in the repo root.

---

## Getting started

```bash
npm ci          # installs deps and sets up git hooks (husky)
npm start       # http://localhost:4200
```

### Scripts

| Script                 | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `npm start`            | Dev server with live reload                    |
| `npm run build`        | Production build to `dist/`                    |
| `npm test`             | Unit tests (Vitest), single run                |
| `npm run test:watch`   | Unit tests in watch mode                       |
| `npm run lint`         | ESLint (TypeScript and templates, typed rules) |
| `npm run lint:fix`     | ESLint with auto-fix                           |
| `npm run format`       | Prettier, writes changes                       |
| `npm run format:check` | Prettier, check only (CI)                      |

### Tooling conventions (Phase 1)

- **Path aliases:** `@core/*`, `@shared/*`, `@features/*`, `@env/*`. Use them instead of deep relative imports.
- **Layer boundaries** (enforced by ESLint `no-restricted-imports`):
  - `core` may not import `features` or `layout`
  - `shared` may not import `core`, `features` or `layout`
  - `layout` may not import `features`
- **Lint rules worth knowing:**
  - `inject()` only, no constructor injection (`prefer-inject`)
  - Signal inputs, outputs and queries (`prefer-signals`)
  - `@if`/`@for` only (`prefer-control-flow`)
  - No `any` (`no-explicit-any`)
  - `import type` for type-only imports
  - Template accessibility rules are on
- **Change detection:** zoneless, no `zone.js`. OnPush is the Angular 22 default, so don't set `changeDetection` explicitly.
- **TypeScript:** `strict` + `noUncheckedIndexedAccess` + `strictTemplates` + `typeCheckHostBindings`.
- **Environments:** `src/environments/*` holds build-time flags only. Per-deployment settings go in the runtime `config.json` (Phase 2).
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org), enforced by commitlint on `commit-msg`. `pre-commit` runs lint-staged (ESLint `--fix` + Prettier on staged files).
- **SSR:** off by default. To enable it, run `ng add @angular/ssr` (full notes in Phase 8).

### Architecture (Phase 2)

**Boot sequence:** `main.ts` → `provideCore()` → `provideAppInitializer` fetches `assets/config.json` → validates it with `parseAppConfig()` → bootstraps. If the config is missing or invalid, `main.ts` shows a friendly "failed to start" page instead of a blank screen.

**Runtime config (`public/assets/config.json`):**

| Key                                   | Type                                            | Purpose                             |
| ------------------------------------- | ----------------------------------------------- | ----------------------------------- |
| `appName`                             | string                                          | Header, footer and `<title>` suffix |
| `apiBaseUrl`                          | string                                          | Prefix for API calls (Phase 4)      |
| `mockApi`                             | boolean                                         | Use the in-browser mock backend     |
| `logLevel`                            | `debug` \| `info` \| `warn` \| `error` \| `off` | `LoggerService` threshold           |
| `httpTimeoutMs`                       | number                                          | Request timeout (Phase 4)           |
| `auth.provider`                       | `mock` \| `oidc`                                | Auth implementation (Phase 3)       |
| `i18n.defaultLang` / `availableLangs` | string / string[]                               | Languages (Phase 5)                 |

Read it with `inject(ConfigService).config()` (a signal) or `.get('key')`. Missing keys fall back to `DEFAULT_APP_CONFIG`, and invalid values fail fast. To deploy to a new environment, replace this one file. No rebuild is needed.

**Core services:**

| Service / provider            | Location                 | Role                                                                     |
| ----------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `provideCore()`               | `core/provide-core.ts`   | Registers every app-wide singleton                                       |
| `ConfigService`               | `core/config/`           | Runtime config as a signal                                               |
| `LoggerService` + `LOG_SINKS` | `core/logging/`          | Level-filtered logging. Add a remote sink by providing another `LogSink` |
| `GlobalErrorHandler`          | `core/error/`            | Uncaught errors → logger (toast added in Phase 4)                        |
| `AppTitleStrategy`            | `core/routing/`          | Route `title` → "Page · App name"                                        |
| `provideConfigForTesting()`   | `core/config/testing.ts` | Seeds config synchronously in unit tests                                 |

**Layout (`layout/`):**

- `Shell` holds the skip link, `RouteLoadingBar`, `Header`, `Sidebar`, `<main id="main-content">` and `Footer`.
- Below 768px the sidebar becomes an off-canvas drawer. It closes on navigation, on Escape and when you click the backdrop.
- `RouteLoadingBar` shows during navigations, including lazy chunk loads. A 150ms delay stops it flashing on fast navigations.

**Routing:** every feature is lazy-loaded through `loadChildren` from its own `features/<name>/<name>.routes.ts`. Unknown URLs render the 404 page inside the shell.

**Adding a feature (short version, full guide in Phase 8):**

1. Create `src/app/features/reports/reports.ts` (the component) and `reports.routes.ts`. The `routes` file default-exports a `Routes` array with a `title`.
2. Add `{ path: 'reports', loadChildren: () => import('@features/reports/reports.routes') }` to the shell's children in `app.routes.ts`.
3. Add `{ label: 'Reports', path: '/reports' }` to `layout/nav-items.ts`.

---

## Progress log

| Phase                 | Status     | Summary                                                                                                                                                                                                                                                                |
| --------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Plan                | ✅ Done    | Plan approved. Defaults: hand-rolled a11y primitives (no CDK), Spanish as 2nd language                                                                                                                                                                                 |
| 1 Workspace & tooling | ✅ Done    | Angular 22.2 zoneless app (SCSS, routing, Vitest, no SSR); angular-eslint with typed rules + layer boundaries; Prettier; husky + lint-staged + commitlint; path aliases; `.nvmrc`, `.editorconfig`, `.gitignore`. lint/test/build green                                |
| 2 Architecture        | ✅ Done    | Runtime `config.json` (validated, loaded before bootstrap), logger with pluggable sinks, global error handler, title strategy; responsive shell (header, off-canvas sidebar, footer, skip link, route loading bar); lazy dashboard/settings + 404. 22 unit tests green |
| 3 Auth                | ⏳ Pending |                                                                                                                                                                                                                                                                        |
| 4 HTTP layer          | ⏳ Pending |                                                                                                                                                                                                                                                                        |
| 5 UI foundation       | ⏳ Pending |                                                                                                                                                                                                                                                                        |
| 6 State & Users       | ⏳ Pending |                                                                                                                                                                                                                                                                        |
| 7 Testing             | ⏳ Pending |                                                                                                                                                                                                                                                                        |
| 8 DevOps & docs       | ⏳ Pending |                                                                                                                                                                                                                                                                        |

_Phase 8 replaces this README with the full guide: quick start, folder structure, how to add a feature, how to swap the auth provider, how to add a language, a scripts table and conventions. The progress log stays at the bottom._
