import { type HttpErrorResponse } from '@angular/common/http';

/**
 * Maps an HTTP failure to a short, user-facing sentence. A server-provided `message` wins for
 * 4xx (assumed to be user-safe and localised by the server); 5xx details are never shown.
 * `translate` turns the `errors.http.*` keys into text (TranslocoService.translate in the app).
 */
export function httpErrorMessage(
  error: HttpErrorResponse,
  translate: (key: string) => string = (key) => key,
): string {
  const serverMessage =
    typeof error.error === 'object' && error.error !== null && 'message' in error.error
      ? String((error.error as { message: unknown }).message)
      : null;

  switch (true) {
    case error.status === 0:
      return translate('errors.http.network');
    case error.status === 408:
      return translate('errors.http.timeout');
    case error.status === 403:
      return translate('errors.http.forbidden');
    case error.status === 404:
      return serverMessage ?? translate('errors.http.notFound');
    case error.status >= 400 && error.status < 500:
      return serverMessage ?? translate('errors.http.badRequest');
    default:
      return translate('errors.http.server');
  }
}
