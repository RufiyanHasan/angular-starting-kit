# 0001. Runtime configuration via `assets/config.json`

- **Status:** Accepted
- **Date:** 2026-10-24

## Context

Client projects deploy the same app to several environments (dev, staging, production, sometimes one per customer). Angular's `environment.ts` files are compiled into the bundle, so each environment needs its own build. That breaks "build once, promote the same artifact", makes rollbacks per-environment, and puts environment URLs into the build pipeline.

## Decision

- Environment-specific values live in `public/assets/config.json`, fetched **before** the app boots by a single `provideAppInitializer` in `core/provide-core.ts`.
- `parseAppConfig()` validates the untrusted JSON and fills defaults; a malformed file fails startup with a clear message (and `main.ts` shows a fallback page) instead of half-working.
- `ConfigService` exposes it as a typed, read-only signal: `config.get('apiBaseUrl')`.
- `environment.ts` remains only for **build-time** flags (e.g. `production`), never for URLs or feature switches.
- The Docker image overwrites `config.json` at container start from `APP_CONFIG_JSON`, or a file can be mounted over it. nginx serves `assets/` with `Cache-Control: no-cache`, so a new config is picked up without a rebuild.
- The config request bypasses HTTP interceptors (`HttpBackend`), since the interceptors themselves depend on config.

## Consequences

- One image is promoted through every environment; config changes need a container restart, not a build.
- One extra request (~1 KB, revalidated by ETag) before first render.
- Everything in `config.json` is public. Secrets never go there (they don't belong in a browser app at all).
- Initialization order matters and is centralized in one initializer: config → (mock API, translations) → session restore. `provide-core.spec.ts` pins it.

## Alternatives considered

- **`environment.*.ts` + `fileReplacements`:** zero runtime cost, but one build per environment. Rejected for the reasons above.
- **Server-side templating of `index.html`:** needs a server that knows the app, and couples hosting to config.
- **Inline `<script>window.__CONFIG__</script>`:** avoids a request but needs a CSP hash per environment.
