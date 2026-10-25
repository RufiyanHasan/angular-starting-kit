import { HttpContext, HttpContextToken } from '@angular/common/http';

/** Don't attach the access token or attempt a refresh (public endpoints, token endpoint). */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

/** Don't count towards the global loading indicator (polling, background prefetch). */
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

/** Don't show the global error toast; the caller handles the error itself. */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

/** Per-request timeout override in ms. `null` uses `config.json → httpTimeoutMs`. */
export const REQUEST_TIMEOUT_MS = new HttpContextToken<number | null>(() => null);

/** Convenience builder: `context: httpContext({ skipErrorToast: true })`. */
export function httpContext(options: {
  skipAuth?: boolean;
  skipLoading?: boolean;
  skipErrorToast?: boolean;
  timeoutMs?: number;
}): HttpContext {
  const context = new HttpContext();
  if (options.skipAuth) context.set(SKIP_AUTH, true);
  if (options.skipLoading) context.set(SKIP_LOADING, true);
  if (options.skipErrorToast) context.set(SKIP_ERROR_TOAST, true);
  if (options.timeoutMs !== undefined) context.set(REQUEST_TIMEOUT_MS, options.timeoutMs);
  return context;
}
