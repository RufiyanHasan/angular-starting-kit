# 0002. Pluggable authentication behind `AuthProvider`

- **Status:** Accepted
- **Date:** 2026-10-24

## Context

Every client uses a different identity system (Auth0, Entra ID, Keycloak, Cognito, a custom JWT API). A starter kit that hard-codes one forces a rewrite of guards, interceptors and the login page on every project. We also need a working login on day one with no backend.

## Decision

- `core/auth/auth-provider.ts` defines a small abstract class every provider implements: `loginMode` (`credentials` or `redirect`), `restore()`, `login()`, `refresh()`, `logout()`.
- `AuthService` is the **only** auth API features use. It holds the session as signals (`user`, `isAuthenticated`), makes `refresh()` single-flight, exposes `hasAnyRole()`, and handles session expiry (redirect to `/login?reason=expired&returnUrl=…`).
- Guards (`authGuard`, `guestGuard`, `roleGuard(...roles)`) and the auth interceptor depend on `AuthService`, never on a provider.
- `provide-auth.ts` maps `config.json → auth.provider` to an implementation. The kit ships `MockJwtAuthProvider` (unsigned JWTs, persisted session, real expiry and refresh) so the full flow — including refresh-on-401 — is exercised in development, unit tests and e2e.
- The access token is only attached to requests whose URL starts with `apiBaseUrl`; it never leaks to third-party hosts.

## Consequences

- Switching to OIDC means writing one class (≈50 lines around a library such as `angular-auth-oidc-client`) and flipping `auth.provider`; nothing in features changes. The README has the step-by-step.
- The login page supports both modes: a form for `credentials`, a single button for `redirect`.
- The mock provider is not security: tokens are unsigned and stored in `localStorage`. It must never be enabled for real users; production deployments set `auth.provider` to a real provider.
- Real providers decide their own token storage; for OIDC, prefer the library's in-memory storage plus refresh tokens over `localStorage`.

## Alternatives considered

- **Use an OIDC library directly everywhere:** fastest for one project, but ties every feature and test to that library.
- **Backend-for-frontend (cookie session):** the most secure model for many apps and compatible with this design — implement an `AuthProvider` whose `login()` redirects to the BFF and whose requests rely on cookies.
