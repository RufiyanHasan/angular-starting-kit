# 0003. Signals by default, NgRx SignalStore for features

- **Status:** Accepted
- **Date:** 2026-10-25

## Context

Angular now ships first-class reactive primitives: `signal`, `computed`, `effect`, `linkedSignal`, and `resource`/`rxResource` for async data. Most state in a typical admin app is small and local. Some features, though, hold a collection with list status and several mutations shared across pages, where ad-hoc services tend to grow inconsistent. Global Redux-style stores (`@ngrx/store`) bring boilerplate we rarely need.

## Decision

Pick the lightest tool that fits, in this order:

1. **Component signals** for UI state that dies with the component (`menuOpen`, `saving`).
2. **`rxResource` / `resource`** for read-only data a view derives from inputs or route params (`UserDetail` loads one user). Stale requests are cancelled; loading/error/value come for free.
3. **A plain signal service** (`@Injectable` + private `signal` + `asReadonly()` + methods) for app-wide state: `AuthService`, `ThemeService`, `LanguageService`, `ToastService`. This is the default for shared state.
4. **NgRx SignalStore** (`@ngrx/signals`) for a **feature** with an entity collection, list state and several mutations used by more than one page. The Users feature is the reference: `withEntities` + `withState` + `withMethods` with an `rxMethod` that loads whenever the URL-derived query changes (switchMap cancels stale loads).

Rules that apply to all of them:

- State is exposed read-only; writes go through methods.
- Feature stores are **provided on the feature route**, not in root, so they're created on entry and destroyed on exit.
- Filters, sorting and paging live in the **URL**; stores load what the URL says, so links and the Back button work.
- Mutations return promises (or observables) so forms can handle errors inline.

## Consequences

- One dependency (`@ngrx/signals`, ~6 KB minified in the Users chunk only, maintained in lockstep with Angular) and one extra concept for new developers — limited to features that need it.
- No global store, actions or reducers to maintain; DevTools time-travel isn't available out of the box (SignalStore has community DevTools integration if a project needs it).
- Consistency comes from the rules above, which reviewers enforce.

## Alternatives considered

- **`@ngrx/store` (Redux):** strong for very large, event-heavy apps; too much ceremony as a default.
- **Signal services only:** works, but each feature reinvents entity updates and loading flags; SignalStore gives a shared vocabulary for those.
- **TanStack Query:** excellent server-cache semantics; `rxResource` covers our read cases with zero dependencies, and it's easy to add later per project.
