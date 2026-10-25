# Architecture Decision Records

Short records of decisions that shape this codebase: the context, what we chose, and what it costs. Read them before changing one of these areas; add a new record (don't rewrite history) when a decision changes.

| #                                       | Decision                                          | Status   |
| --------------------------------------- | ------------------------------------------------- | -------- |
| [0001](0001-runtime-configuration.md)   | Runtime configuration via `assets/config.json`    | Accepted |
| [0002](0002-pluggable-auth-provider.md) | Pluggable authentication behind `AuthProvider`    | Accepted |
| [0003](0003-state-management.md)        | Signals by default, NgRx SignalStore for features | Accepted |
| [0004](0004-i18n-transloco.md)          | Runtime i18n with Transloco                       | Accepted |

**Adding one:** copy the structure of an existing record into `NNNN-short-title.md` (next number), set the status to _Proposed_, open a PR, and switch it to _Accepted_ when merged. Superseded records stay, with a link to their replacement.
