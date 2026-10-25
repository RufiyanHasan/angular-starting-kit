# Angular Starter Kit

[![CI](https://github.com/RufiyanHasan/angular-starting-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/RufiyanHasan/angular-starting-kit/actions/workflows/ci.yml)

A production-ready starter for new client projects. Clone it and you have a working app on day one: authentication, an HTTP layer, theming with dark mode, i18n, an accessible UI kit, a complete sample feature, unit and e2e tests, CI and a Docker image. It runs with **no backend**: an in-browser mock API answers every request until you point it at a real one.

> **Status:** all 8 phases complete. See the [Progress log](#progress-log).

**Contents:** [Quick start](#quick-start) · [What's inside](#whats-inside) · [Scripts](#scripts) · [Project structure](#project-structure) · [Conventions](#conventions) · [Configuration](#configuration) · [Adding a feature](#adding-a-feature) · [Authentication](#authentication) · [HTTP layer](#http-layer) · [State management](#state-management) · [UI kit and theming](#ui-kit-and-theming) · [Internationalization](#internationalization) · [Accessibility](#accessibility) · [Testing](#testing) · [CI](#ci) · [Docker and deployment](#docker-and-deployment) · [Dependencies](#dependencies) · [Decision records](#decision-records) · [Troubleshooting](#troubleshooting)

---

## Quick start

**Prerequisite:** Node **26** (see `.nvmrc`; 24.15+ also works). Use the installer from nodejs.org, or `nvm install` / `fnm use` in the repo root.

```bash
npm ci       # install dependencies and set up git hooks
npm start    # http://localhost:4200
```

Sign in with a demo account (the mock provider lists them on the login page):

| Account             | Password   | Roles       |
| ------------------- | ---------- | ----------- |
| `admin@example.com` | `admin123` | admin, user |
| `user@example.com`  | `user123`  | user        |

The full quality gate, exactly as CI runs it:

```bash
npm ci && npm run lint && npm test && npm run build && npm run e2e
```

`npm run e2e` downloads Playwright's Chromium on first use.

## What's inside

| Area               | You get                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stack**          | Angular 22 (standalone, signals, zoneless, `@if`/`@for`), TypeScript 6 strict, SCSS                                                           |
| **Config**         | Runtime `assets/config.json`, validated before boot. One build for every environment                                                          |
| **Auth**           | Pluggable `AuthProvider` (mock JWT included, OIDC swap documented), guards, role checks, silent token refresh, safe `returnUrl`               |
| **HTTP**           | Loading, error-toast, auth (refresh-on-401 with request queueing) and timeout interceptors; typed `ApiService` and `CrudResource<T>`          |
| **Mock backend**   | MSW in the browser behind a config flag; the same handlers power unit tests                                                                   |
| **UI**             | CSS-variable design tokens, light/dark/system theme, button, form field, data table, paginator, dialog, confirm, toast, empty state, skeleton |
| **i18n**           | Transloco with English and Spanish, runtime switching, translated route titles and errors                                                     |
| **Accessibility**  | Skip link, landmarks, focus management, AA contrast in both themes; axe runs in e2e with zero violations                                      |
| **State**          | Signals by default; NgRx SignalStore in the Users feature                                                                                     |
| **Sample feature** | Users: list (search, filters, sort, paging in the URL) → detail → create/edit/delete, admin-only writes                                       |
| **Quality**        | ESLint (typed rules, a11y rules, layer boundaries), Prettier, commitlint, husky; Vitest with ≥ 80% coverage gate on `core/`; Playwright e2e   |
| **Delivery**       | GitHub Actions; multi-stage Dockerfile; nginx with SPA routing, caching rules, CSP and security headers                                       |

## Scripts

| Script                  | What it does                                                              |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm start`             | Dev server on :4200 with live reload                                      |
| `npm run build`         | Production build to `dist/angular-starter-kit/browser`                    |
| `npm run watch`         | Development build in watch mode                                           |
| `npm test`              | Unit tests (Vitest, jsdom), single run                                    |
| `npm run test:watch`    | Unit tests in watch mode                                                  |
| `npm run test:coverage` | Unit tests with coverage; fails below 80% on `core/`; HTML in `coverage/` |
| `npm run e2e`           | Playwright e2e (starts a production server on :4300)                      |
| `npm run e2e:ui`        | Playwright UI mode, for writing and debugging e2e tests                   |
| `npm run e2e:report`    | Open the last HTML report                                                 |
| `npm run lint`          | ESLint for TypeScript, templates and e2e                                  |
| `npm run lint:fix`      | ESLint with auto-fix                                                      |
| `npm run format`        | Prettier, write                                                           |
| `npm run format:check`  | Prettier, check only (CI)                                                 |

## Project structure

```
.
├── .github/workflows/ci.yml        # lint → unit (coverage) → build → e2e → docker build + smoke test
├── .husky/                         # pre-commit: lint-staged · commit-msg: commitlint
├── docker/                         # nginx config template, security headers, entrypoint script
├── docs/ADR/                       # architecture decision records
├── e2e/                            # Playwright specs and fixtures
├── public/
│   ├── assets/config.json          # runtime config (replaced per environment)
│   ├── assets/i18n/{en,es}.json    # translations (en is the source of truth)
│   └── mockServiceWorker.js        # generated by MSW
├── Dockerfile · playwright.config.ts · angular.json · eslint.config.js
└── src/
    ├── index.html                  # includes the pre-boot theme script
    ├── main.ts                     # bootstrap + "failed to start" fallback
    ├── styles/                     # _tokens (themes), _base, _forms, _utilities
    ├── test-setup.ts               # jsdom polyfills (dialog)
    ├── test-providers.ts           # providers for every TestBed (translations)
    ├── mocks/                      # MSW handlers, seed data, in-memory db, test helpers
    └── app/
        ├── app.ts · app.config.ts · app.routes.ts
        ├── core/                   # @core/*   app-wide singletons, no UI
        │   ├── auth/               #   AuthProvider, AuthService, guards, mock JWT provider
        │   ├── config/             #   AppConfig, parseAppConfig, ConfigService
        │   ├── error/              #   GlobalErrorHandler
        │   ├── http/               #   ApiService, CrudResource, interceptors, HttpContext tokens
        │   ├── i18n/               #   Transloco setup, loader, LanguageService
        │   ├── logging/            #   LoggerService with pluggable sinks
        │   ├── routing/            #   AppTitleStrategy, unsavedChangesGuard
        │   ├── storage/            #   StorageService (safe localStorage)
        │   ├── theme/              #   ThemeService
        │   └── provide-core.ts     #   registers all of the above + boot sequence
        ├── shared/                 # @shared/* reusable UI, no app knowledge
        │   ├── pipes/              #   localDate
        │   └── ui/                 #   button, form-field, data-table, paginator, dialog,
        │                           #   confirm-dialog, toast, empty-state, skeleton, icon
        ├── layout/                 # @layout/* shell, header, sidebar, footer, theme toggle,
        │                           #           language select, route loading bar, nav-items
        └── features/               # @features/* lazy-loaded pages
            ├── auth/login/
            ├── dashboard/          #   runtime config + HTTP playground
            ├── settings/           #   theme and language preferences
            ├── users/              #   the reference feature (see below)
            ├── forbidden/          #   403
            └── not-found/          #   404
```

## Conventions

**Layers and the dependency rule** (enforced by ESLint `no-restricted-imports`, so violations fail CI):

```
features ──► shared, core (and layout widgets)
layout   ──► shared, core
core     ──► shared                    (never features or layout)
shared   ──► third-party only          (never core, features or layout)
```

- **Imports:** use the aliases `@core/*`, `@shared/*`, `@layout/*`, `@features/*`, `@env/*` instead of deep relative paths.
- **Components:** standalone (the default), signal `input()`/`output()`/`model()`, `inject()` instead of constructor injection, `@if`/`@for`/`@let` control flow. OnPush is the Angular 22 default and the app is zoneless, so never set `changeDetection` or add `zone.js`.
- **State:** private writable `signal`, public `asReadonly()`, methods for writes. See [State management](#state-management).
- **Files:** `name.ts` + `name.html` + `name.scss` for components with real templates; inline templates for small ones. Specs sit next to the code as `name.spec.ts`. Test helpers live in `testing.ts` files, which are excluded from the app build.
- **TypeScript:** `strict`, `noUncheckedIndexedAccess`, `strictTemplates`, `typeCheckHostBindings`; no `any`; `import { type X }` for type-only imports.
- **Styles:** components use design tokens (`var(--color-…)`, `var(--space-…)`) only, never raw colours. Page-level helpers (`.page-header`, `.card`, `.badge`, `.alert`) are in `styles/_utilities.scss`.
- **Text:** every user-facing string is a translation key.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org) (`feat(users): add export`), checked by commitlint. `pre-commit` runs ESLint `--fix` and Prettier on staged files.

## Configuration

**Runtime config** (`public/assets/config.json`) is fetched before the app boots, validated by `parseAppConfig()`, and exposed by `ConfigService` as a signal (`config()`) or by key (`get('apiBaseUrl')`). Missing keys use defaults; invalid values stop startup with a clear error and a fallback page. Change it per environment without rebuilding ([ADR 0001](docs/ADR/0001-runtime-configuration.md)).

| Key                   | Type                                            | Default               | Purpose                                                   |
| --------------------- | ----------------------------------------------- | --------------------- | --------------------------------------------------------- |
| `appName`             | string                                          | `Angular Starter Kit` | Header, footer, `<title>` suffix                          |
| `apiBaseUrl`          | string                                          | `/api`                | Prefix for `ApiService`; the auth token is only sent here |
| `mockApi`             | boolean                                         | `false`               | Serve `apiBaseUrl/*` from the in-browser mock API         |
| `logLevel`            | `debug` \| `info` \| `warn` \| `error` \| `off` | `warn`                | `LoggerService` threshold                                 |
| `httpTimeoutMs`       | number                                          | `15000`               | Per-attempt request timeout                               |
| `auth.provider`       | `mock` \| `oidc`                                | `mock`                | Which `AuthProvider` to use                               |
| `i18n.defaultLang`    | string                                          | `en`                  | Language when neither the user nor the browser picks one  |
| `i18n.availableLangs` | string[]                                        | `["en"]`              | Languages offered (each needs `assets/i18n/<lang>.json`)  |

The committed `config.json` enables the mock API and mock auth so the app runs anywhere. **Real environments must set `mockApi: false` and a real `auth.provider`.** The container prints a warning at start if `mockApi` is still on.

**Build-time flags** (`src/environments/`) are for things that differ between dev and prod builds only. Never put URLs or secrets there (or anywhere in a browser app).

**Boot sequence** (`core/provide-core.ts`, one initializer because Angular runs separate initializers in parallel): apply saved theme → load config → start the mock API (if enabled) and load translations in parallel → restore the auth session → first navigation.

## Adding a feature

The Users feature (`src/app/features/users/`) is the reference; copy its shape. Example: a "Projects" feature.

**1. Model and API** — `features/projects/project.model.ts` and `projects.api.ts`:

```ts
export interface Project {
  readonly id: string;
  readonly name: string;
  readonly status: 'active' | 'archived';
}
export type ProjectInput = Pick<Project, 'name' | 'status'>;
```

```ts
@Injectable({ providedIn: 'root' })
export class ProjectsApi extends CrudResource<Project, ProjectInput> {
  protected readonly path = 'projects'; // list/getById/create/update/remove are inherited
}
```

**2. Pages** — generate components (standalone, SCSS, OnPush by default):

```bash
npx ng g component features/projects/project-list
```

Load data with `rxResource` for a single view, or a SignalStore (see `users.store.ts`) when several pages share a collection and its mutations. Use the shared UI kit (`DataTable`, `Paginator`, `FormField`, `Button`, `ConfirmService`, `ToastService`).

**3. Routes** — `features/projects/projects.routes.ts` with a default export. Titles are translation keys:

```ts
export default [
  {
    path: '',
    title: 'titles.projects',
    loadComponent: () => import('./project-list/project-list').then((m) => m.ProjectList),
  },
  {
    path: ':id/edit',
    title: 'titles.projectEdit',
    canActivate: [roleGuard('admin')],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./project-edit/project-edit').then((m) => m.ProjectEdit),
  },
] satisfies Routes;
```

**4. Wire it up:**

- `app.routes.ts`: add `{ path: 'projects', loadChildren: () => import('@features/projects/projects.routes') }` to the shell's `children`.
- `layout/nav-items.ts`: add `{ label: 'nav.projects', path: '/projects' }`.

**5. Translations** — add every new key to `public/assets/i18n/en.json` **and** `es.json` (`titles.projects`, `nav.projects`, `projects.*`). The translation parity test fails if one is missing.

**6. Mock API (until the backend exists)** — create `src/mocks/handlers/projects.handlers.ts` (copy `users.handlers.ts`, which shows paging, validation errors and 403s), add seed data, and spread it into `createHandlers()` in `src/mocks/handlers.ts`.

**7. Tests** — feature specs can run against the real mock handlers: call `useMockApi()` from `src/mocks/testing.ts` in the spec and drive the routed pages (see `features/users/testing.ts`). Add an e2e journey in `e2e/` if the feature is business-critical.

## Authentication

```
features / layout ──► AuthService (signals: user, isAuthenticated) ──► AuthProvider (abstract)
                                                                          ├─ MockJwtAuthProvider  (auth.provider: "mock")
                                                                          └─ your OIDC provider   (auth.provider: "oidc")
```

- **`AuthService`** (`core/auth/auth.service.ts`) is the only auth API that features use: `user()`, `isAuthenticated()`, `hasAnyRole(['admin'])`, `login()`, `logout()`. `refresh()` is single-flight, so concurrent 401s share one refresh.
- **`AuthProvider`** (`core/auth/auth-provider.ts`) is the contract: `loginMode`, `restore()`, `login()`, `refresh()`, `logout()`. `provide-auth.ts` picks the implementation from `config.json → auth.provider`.
- **Mock JWT provider:** unsigned tokens in `localStorage`; access token 5 min, refresh token 7 days, so the refresh path really runs in development. **Not for production.**
- **Session expiry:** when a refresh fails, the user goes to `/login?reason=expired&returnUrl=…` and comes back after signing in. `returnUrl` only accepts same-origin paths (no open redirects).

| Guard                | Use                                        | On failure               |
| -------------------- | ------------------------------------------ | ------------------------ |
| `authGuard`          | Shell (`canActivate` + `canActivateChild`) | `/login?returnUrl=<url>` |
| `guestGuard`         | `/login`                                   | `/`                      |
| `roleGuard('admin')` | any route                                  | `/forbidden` (403 page)  |

Hide buttons with `auth.hasAnyRole([...])` for a clean UI, but rely on the API to enforce permissions.

### Swapping the auth provider

Example with [`angular-auth-oidc-client`](https://github.com/damienbod/angular-auth-oidc-client). Feature code doesn't change ([ADR 0002](docs/ADR/0002-pluggable-auth-provider.md)).

1. `npm i angular-auth-oidc-client`, add its `provideAuth({ config: {...} })` to `provideCore()`, and add your OIDC settings (authority, clientId, scopes) to `AppConfig`, `parseAppConfig()` and `config.json`.
2. Create `core/auth/oidc/oidc-auth.provider.ts`:

   ```ts
   @Injectable()
   export class OidcAuthProvider extends AuthProvider {
     readonly loginMode = 'redirect' as const;
     private readonly oidc = inject(OidcSecurityService);

     async restore() {
       const { isAuthenticated, userData, accessToken } = await firstValueFrom(
         this.oidc.checkAuth(),
       );
       return isAuthenticated ? toSession(userData, accessToken) : null;
     }
     async login() {
       this.oidc.authorize(); // full-page redirect to the identity provider
       return new Promise<never>(() => {});
     }
     async refresh() {
       const result = await firstValueFrom(this.oidc.forceRefreshSession());
       if (!result?.isAuthenticated) throw new AuthError('session_expired');
       return toSession(result.userData, result.accessToken);
     }
     async logout() {
       await firstValueFrom(this.oidc.logoff());
     }
   }
   ```

   `toSession()` maps your identity provider's claims to `User` (`id`, `name`, `email`, `roles`).

3. In `provide-auth.ts`, register it: `oidc: OidcAuthProvider` in `AUTH_PROVIDERS`, and add `OidcAuthProvider` to the returned providers.
4. Set `"auth": { "provider": "oidc" }` in that environment's `config.json`. The login page switches to a single "Sign in" button automatically (`loginMode: 'redirect'`).

## HTTP layer

**Interceptors** (`core/http/interceptors/`, registered in `provideCore()`, outermost first):

| #   | Interceptor          | What it does                                                                                                                    |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `loadingInterceptor` | Counts in-flight requests; the top loading bar shows while any request or navigation is pending                                 |
| 2   | `errorInterceptor`   | Logs every failure and shows one translated toast (deduplicated), then rethrows. Skips 401s                                     |
| 3   | `authInterceptor`    | Adds `Authorization: Bearer …` to `apiBaseUrl` requests only. On 401: refresh once, retry; queued requests wait for the refresh |
| 4   | `timeoutInterceptor` | Fails with a 408 after `httpTimeoutMs` per attempt                                                                              |

**Per-request options** with `httpContext({ skipAuth, skipLoading, skipErrorToast, timeoutMs })`:

```ts
this.api.get('reports/export', {
  context: httpContext({ timeoutMs: 60_000, skipErrorToast: true }),
});
```

**Typed access:** `ApiService` (`get/post/put/patch/delete<T>(path, options)`, prefixes `apiBaseUrl`, drops empty params) and `CrudResource<T, TCreate, TUpdate>` (extend once per entity).

**API conventions** (`core/http/api.models.ts`), followed by the mock API and expected from real ones:

- Lists: `GET /things?page=1&pageSize=10&sort=name&order=asc&q=text&<filter>=value` → `{ items, total, page, pageSize }`.
- Errors: 4xx body `{ message, fieldErrors? }`. `fieldErrors` (`{ email: 'already in use' }`) are shown on the matching form fields; `message` is shown in the toast.

**Mock API** (`src/mocks/`, [MSW](https://mswjs.io)): with `mockApi: true`, a service worker answers `apiBaseUrl/*` in the browser (visible in DevTools → Network). The MSW code is a lazy chunk, only downloaded when the flag is on. Endpoints: `/users` CRUD (paging, search, filters, sort, 422 validation, 403 for non-admin writes, 401 for bad tokens) and `/demo/status/:code`, `/demo/slow?ms=` for the dashboard's HTTP playground. Data is 42 deterministic users, reset on every page load. After upgrading MSW, run `npx msw init public`.

## State management

| Pattern                       | Example                                       | Use it for                                                           |
| ----------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| Component `signal`/`computed` | `saving`, `menuOpen`                          | UI state that dies with the component                                |
| `rxResource` / `resource`     | `UserDetail`, `UserEdit`                      | Read-only data for one view, derived from route params or inputs     |
| Signal service                | `AuthService`, `ThemeService`, `ToastService` | **Default** for shared, app-wide state                               |
| NgRx SignalStore              | `features/users/users.store.ts`               | A feature collection with list state and mutations used across pages |

Feature stores are provided on the feature route (created on entry, destroyed on exit). List filters, sort and paging live in the URL. Details and trade-offs: [ADR 0003](docs/ADR/0003-state-management.md).

**The Users feature** shows the whole pattern: `users-query.ts` maps URL ⇄ query ⇄ API params with validation; `UsersStore` (`withEntities` + `rxMethod`) loads whatever the URL says and cancels stale requests; detail and edit pages read one user with `rxResource`; mutations go through the store so the list stays in sync; the edit form shows client and server (422) errors and asks before discarding unsaved changes.

## UI kit and theming

**Theming** (`styles/_tokens.scss`, `core/theme/theme.service.ts`): every colour, space, radius and shadow is a CSS custom property, defined for light and dark. `ThemeService` sets `data-theme` on `<html>` from the user's choice (light, dark, or system, which follows the OS live) and saves it. An inline script in `index.html` applies the saved theme before Angular boots, so there's no flash. All text colour pairs are ≥ 5.2:1 (AA needs 4.5:1). **Re-branding a client = editing the two mixins in `_tokens.scss`.**

**Components** (`shared/ui/`):

| Component                          | Usage                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`                           | `<button appButton variant="primary\|secondary\|ghost\|danger" size="sm\|md\|icon" [loading]="saving()">` — also on `<a>`                                                |
| `FormField` + `InputDirective`     | `<app-form-field label="Email" [error]="msg"><input appInput formControlName="email" /></app-form-field>` — wires label, hint, error, `aria-invalid`, `aria-describedby` |
| `DataTable` + `CellDef`            | `<app-data-table caption="Users" [rows] [columns] [trackBy] [sort] [loading] (sortChange)>` + `<ng-template appCell="name" [appCellOf]="rows" let-row>`                  |
| `Paginator`                        | `<app-paginator [page] [pageSize] [total] [pageSizeOptions] (pageChange)>`                                                                                               |
| `Dialog`                           | `<app-dialog heading="…" [(open)]="open">…<button appButton dialogActions>` — native `<dialog>` modal                                                                    |
| `ConfirmService` / `ConfirmDialog` | `if (await confirm.confirm({ title, message, danger: true })) …`                                                                                                         |
| `ToastService` / `ToastContainer`  | `toast.success('Saved')`, `error`, `warning`, `info`                                                                                                                     |
| `EmptyState`, `Skeleton`, `Icon`   | `<app-empty-state heading="No results">`, `<app-skeleton width="8ch" />`, `<app-icon name="trash" />`                                                                    |
| `LocalDatePipe`                    | `{{ date \| localDate: 'long' }}` in the active language                                                                                                                 |

`ToastContainer` and `ConfirmDialog` are placed once in `app.ts`. Icons are inline SVG paths in `icon.ts`; add one by adding its path data.

## Internationalization

[Transloco](https://jsverse.gitbook.io/transloco) with runtime-loaded JSON ([ADR 0004](docs/ADR/0004-i18n-transloco.md)).

- **In templates:** `{{ 'users.title' | transloco }}`, with params `{{ 'ui.paginator.range' | transloco: { from, to, total } }}`. **In code:** `inject(TranslocoService).translate('key', params)`.
- **Language choice:** saved choice → browser language → `config.json` default. The switcher is in the header and on Settings. `<html lang>`, route titles and toasts follow the active language.
- **`en.json` is the source of truth** and the fallback for missing keys. `core/i18n/translations.spec.ts` fails if another file has different keys or `{{ params }}`.

**Adding a language** (e.g. French):

1. Copy `public/assets/i18n/en.json` to `fr.json` and translate the values.
2. Add `"fr"` to `i18n.availableLangs` in `config.json` (per environment).
3. Add `['fr', fr]` to the `it.each` lists in `translations.spec.ts`, and to `provideI18nForTesting()` in `core/i18n/testing.ts` if tests should use it.

## Accessibility

- Skip link, landmarks, one `<h1>` per page, visible focus ring, `prefers-reduced-motion` respected, theme colours AA in both modes.
- Forms: labels linked to inputs, errors linked via `aria-describedby`, `aria-invalid` on invalid fields, focus moves to the first invalid field on submit.
- Toasts in live regions (errors assertive, others polite) with a hidden kind prefix ("Error: …"), so colour isn't the only cue.
- Modals use native `<dialog>` + `showModal()`: real focus trap, inert background, Escape closes, focus returns to the opener. Confirm dialogs focus Cancel first.
- Tables: real `<table>` with caption and `aria-sort`; wide tables scroll in a keyboard-focusable region.
- ESLint's template accessibility rules run on every template; **axe-core** runs in e2e (`e2e/a11y.spec.ts`) on every page type, in light and dark, desktop and mobile, and must report zero WCAG 2.1 A/AA or best-practice violations.

## Testing

**Unit and integration** (Vitest via `@angular/build:unit-test`, jsdom):

- `npm test`; `npm run test:coverage` enforces **≥ 80%** statements/branches/functions/lines on `src/app/core/` (currently ~96/92/95/97%).
- `src/test-providers.ts` gives every TestBed real translations, so specs assert on visible English text. `src/test-setup.ts` adds the `<dialog>` methods jsdom lacks.
- Helpers: `provideConfigForTesting(overrides)`, `provideAuthForTesting(user, { accessToken })`, `useMockApi()` + `testToken(roles)` (MSW under Node with the real handlers), `setupUsersFeature(url, roles)` (routed feature setup).
- Prefer testing through the DOM and public APIs; for features, run the routed pages against `useMockApi()` instead of stubbing HTTP.

**End-to-end** (Playwright, `e2e/`):

- `npm run e2e` builds and serves the production configuration on :4300 with the mock API, so no backend is needed. Mock data resets per page load, so tests are independent and run in parallel.
- Projects: `chromium` (all tests) and `mobile` (Pixel 7, tests tagged `@mobile`).
- Specs: `auth` (protected-route redirect with `returnUrl`, validation, bad credentials, session persistence, sign-out, silent refresh of an expired token, 403), `users` (list/search/filter/sort/paging via URL, full CRUD with server validation and confirm dialog, unsaved-changes guard, read-only role), `a11y` (axe everywhere, skip link), `preferences` (theme persistence before boot, runtime language switch).
- Run against any deployment: `E2E_BASE_URL=https://staging.example.com npm run e2e`.
- Debug: `npm run e2e:ui`; traces are recorded on the first retry in CI.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request (older runs on the same branch are cancelled):

1. **verify:** `npm ci` → format check → lint → unit tests with the coverage gate (report uploaded) → production build → Playwright e2e (HTML report uploaded on failure).
2. **docker:** builds the image (with layer cache) and smoke-tests the running container: health check, app shell, SPA deep link, runtime config, real 404 for missing assets, CSP header present.

## Docker and deployment

```bash
docker build -t angular-starter-kit .
docker run --rm -p 8080:8080 angular-starter-kit          # http://localhost:8080
```

- **Image:** multi-stage. `node:26-alpine` builds; `nginxinc/nginx-unprivileged` serves the static files as a non-root user on port 8080. Health endpoint: `/healthz`.
- **Per-environment config without rebuilding** (either option):

  ```bash
  docker run -e APP_CONFIG_JSON="$(cat config.prod.json)" -e CSP_CONNECT_SRC="'self' https://api.example.com" …
  docker run -v "$PWD/config.prod.json:/usr/share/nginx/html/assets/config.json:ro" …
  ```

  `CSP_CONNECT_SRC` must include your API origin if it differs from the site's.

- **nginx** (`docker/templates/default.conf.template`): SPA fallback to `index.html`; content-hashed JS/CSS cached for a year (`immutable`); `index.html`, `assets/` (config, translations) and the service worker revalidated on every load, so deploys and config changes apply immediately; missing assets are real 404s; gzip on.
- **Security headers** (`docker/security-headers.conf`): CSP, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP. Scripts are additionally locked down by the CSP `<meta>` that Angular's `autoCsp` writes into `index.html` (hashes + `strict-dynamic`). Enable HSTS where TLS terminates.
- **Other hosts** (S3/CloudFront, Azure Static Web Apps, Netlify, Vercel): deploy `dist/angular-starter-kit/browser`, rewrite unknown paths to `/index.html`, and copy the caching rules above.
- **SSR** is off by default. `ng add @angular/ssr` enables it; then load `config.json` from the file system on the server, and guard `localStorage`/`window` usage (already isolated in `StorageService` and `ThemeService`).

## Dependencies

Each runtime and tooling dependency, and why it's here instead of a built-in:

| Package                                               | Why                                                                                                               | Built-in alternative considered                                                                               |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `@jsverse/transloco`                                  | Runtime language switching from JSON files                                                                        | `@angular/localize`: one build per locale, no runtime switching ([ADR 0004](docs/ADR/0004-i18n-transloco.md)) |
| `@ngrx/signals`                                       | SignalStore for the Users feature; ~6 KB in that lazy chunk only                                                  | Plain signal services, used everywhere else ([ADR 0003](docs/ADR/0003-state-management.md))                   |
| `msw` (dev)                                           | Mock API at the network layer: real `HttpClient` + interceptors, same handlers in unit tests; lazy, behind a flag | An interceptor-based mock skips the real network path                                                         |
| `@playwright/test`, `@axe-core/playwright` (dev)      | E2E and automated accessibility checks                                                                            | None                                                                                                          |
| `@vitest/coverage-v8` (dev)                           | Coverage for the Angular CLI's default runner                                                                     | n/a                                                                                                           |
| `angular-eslint`, `eslint`, `typescript-eslint` (dev) | Linting, including typed and template a11y rules; the CLI has no linter                                           | None                                                                                                          |
| `prettier`, `eslint-config-prettier` (dev)            | Formatting, so reviews skip whitespace                                                                            | None                                                                                                          |
| `husky`, `lint-staged`, `@commitlint/*` (dev)         | Lint/format staged files; Conventional Commits                                                                    | None                                                                                                          |

**Deliberately not added:** a component library (Material, PrimeNG), Angular CDK (native `<dialog>` covers modals and focus trapping), Tailwind, an icon package, a date library (`Intl` covers formatting), lodash.

## Decision records

[`docs/ADR/`](docs/ADR/README.md): [0001 Runtime configuration](docs/ADR/0001-runtime-configuration.md) · [0002 Pluggable auth](docs/ADR/0002-pluggable-auth-provider.md) · [0003 State management](docs/ADR/0003-state-management.md) · [0004 i18n with Transloco](docs/ADR/0004-i18n-transloco.md). Add a record when you make a decision future developers would otherwise have to reverse-engineer.

## Troubleshooting

| Symptom                                                     | Fix                                                                                                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| "The application failed to start"                           | `assets/config.json` is missing or invalid; the console names the bad key                                                                    |
| `npm ci` fails with an engine error                         | Use Node 26 (`nvm use`), or 24.15+                                                                                                           |
| Commit rejected (GUI clients may show an unrelated message) | The message must follow Conventional Commits, e.g. `feat(users): add export`. Run `git commit` in a terminal to see commitlint's explanation |
| API calls return stale mock data or bypass the mock         | Hard-reload. If needed, DevTools → Application → Service workers → Unregister                                                                |
| E2E: "Executable doesn't exist"                             | `npx playwright install chromium` (`npm run e2e` does this automatically)                                                                    |
| E2E hits the wrong app on :4300                             | Locally Playwright reuses any server already on :4300; stop it, or set `E2E_BASE_URL` to the app you mean to test                            |
| A page reloads by itself the first time in `npm start`      | Vite is optimizing a newly used dependency; it happens once                                                                                  |
| Lint error "This layer must not import from …"              | Move the code to the right layer, or invert the dependency (see [Conventions](#conventions))                                                 |

---

## Progress log

| Phase                 | Status  | Summary                                                                                                                                                                                                                                                                             |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Plan                | ✅ Done | Plan approved. Defaults: no Angular CDK (native `<dialog>`), Spanish as the second language                                                                                                                                                                                         |
| 1 Workspace & tooling | ✅ Done | Angular 22.2 zoneless app (SCSS, routing, Vitest, no SSR); angular-eslint with typed rules and layer boundaries; Prettier; husky + lint-staged + commitlint; path aliases; `.nvmrc`, `.editorconfig`                                                                                |
| 2 Architecture        | ✅ Done | Validated runtime `config.json` loaded before boot; logger with pluggable sinks; global error handler; title strategy; responsive shell (header, off-canvas sidebar, footer, skip link, route loading bar); lazy routes and 404                                                     |
| 3 Auth                | ✅ Done | `AuthProvider` contract and mock JWT provider (persisted session, real refresh), `AuthService` with signals and single-flight refresh, `authGuard`/`guestGuard`/`roleGuard`, accessible login page with safe `returnUrl`, 403 page; OIDC swap documented                            |
| 4 HTTP layer          | ✅ Done | Loading/error/auth/timeout interceptors (refresh-on-401 with queueing, token scoped to the API host), `ApiService` and `CrudResource`, toasts, MSW mock backend (lazy), HTTP playground. Fixed the layer-boundary lint rule                                                         |
| 5 UI foundation       | ✅ Done | Token-based theming with light/dark/system (persisted, no flash), shared UI kit, Transloco en + es with runtime switching, translated titles and errors; axe-clean in both themes and languages and on mobile                                                                       |
| 6 State & Users       | ✅ Done | Users feature: URL-driven list with search, filters, sort, paging and delete; detail with `rxResource`; create/edit with client and server validation and an unsaved-changes guard; admin-only writes. NgRx SignalStore with entities; feature tests against the real mock handlers |
| 7 Testing             | ✅ Done | 156 unit/integration tests; coverage gate ≥ 80% on `core/` (~96% statements, 92% branches); Playwright e2e (30 tests: auth, protected redirect, users CRUD, a11y with axe in both themes, preferences) on desktop and mobile; `E2E_BASE_URL` to test any deployment                 |
| 8 DevOps & docs       | ✅ Done | GitHub Actions (format, lint, coverage, build, e2e, Docker build + container smoke test); multi-stage Dockerfile on unprivileged nginx with runtime config via env, SPA routing, cache rules, CSP (+ Angular `autoCsp`) and security headers; this README; four ADRs                |
