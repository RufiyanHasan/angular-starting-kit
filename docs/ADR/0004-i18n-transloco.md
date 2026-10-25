# 0004. Runtime i18n with Transloco

- **Status:** Accepted
- **Date:** 2026-10-25

## Context

Client apps need at least two languages, switchable by the user without a reload, with translations that can be updated (or added) per deployment. Angular's built-in `@angular/localize` compiles one bundle per locale: excellent runtime performance, but no in-app switching, one deploy target per language, and a build for every translation change.

## Decision

- Use **Transloco** (`@jsverse/transloco`) with JSON files in `public/assets/i18n/<lang>.json`, loaded over HTTP at runtime.
- **`en.json` is the source of truth** and the fallback for missing keys. `translations.spec.ts` fails the build if any other language has different keys or different `{{ params }}`.
- `LanguageService` (core) owns the active language: saved choice → browser language → `config.json` default. It always loads a file **before** activating it (no flash of raw keys), persists the choice, and sets `<html lang>`.
- Available languages come from `config.json → i18n.availableLangs`, so a deployment can enable a language without a rebuild.
- Keys are namespaced by area (`auth.*`, `users.*`, `ui.*`). Route `title`s are keys; `AppTitleStrategy` translates them and follows language changes. Dates use `Intl` via the `localDate` pipe, so no Angular locale data is registered per language.
- Shared UI components may use the `transloco` pipe for their own labels (`ui.*`), keeping them usable without passing every string as an input.

## Consequences

- ~19 KB minified (≈6 KB gzipped) added to the initial bundle, plus one JSON request (a few KB) per language used.
- Missing translations fall back to English instead of breaking the page; the parity test catches them before merge.
- Messages from the server (e.g. validation `fieldErrors`) are shown as sent; a real API should localize them using the `Accept-Language` header.
- Translators edit plain JSON; no XLIFF tooling is required (Transloco can export if a client's workflow needs it).

## Alternatives considered

- **`@angular/localize`:** best runtime performance and the official solution; rejected because it can't switch language at runtime and needs one build per locale. A reasonable choice for public, SEO-heavy sites with SSR.
- **`ngx-translate`:** similar model, but Transloco has better typing, signal helpers (`translateSignal`), scopes for lazy features, and active maintenance.
