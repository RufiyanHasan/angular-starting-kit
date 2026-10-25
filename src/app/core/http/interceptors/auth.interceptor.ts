import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { ConfigService } from '@core/config/config.service';
import { type Observable, catchError, defer, from, switchMap, throwError } from 'rxjs';
import { SKIP_AUTH } from '../http-context';
import { isApiUrl } from '../is-api-url';

/**
 * 1. Adds `Authorization: Bearer <token>` to API requests (never to third-party URLs).
 * 2. Requests started while a refresh is running wait for it, then use the new token.
 * 3. On 401: refresh once (shared by all concurrent 401s via AuthService), then retry.
 *    If the token already changed since this request was sent, retry without refreshing.
 * 4. If refresh fails, the session is expired and the user goes to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiBaseUrl = inject(ConfigService).get('apiBaseUrl');
  if (req.context.get(SKIP_AUTH) || !isApiUrl(req.url, apiBaseUrl)) return next(req);

  let usedToken: string | null = null;
  const send = (): Observable<HttpEvent<unknown>> =>
    defer(() => {
      usedToken = auth.accessToken();
      return next(withToken(req, usedToken));
    });

  const pending = auth.refreshInFlight();
  const first$ = pending ? from(pending.catch(() => null)).pipe(switchMap(send)) : send();

  return first$.pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !auth.isAuthenticated()
      ) {
        return throwError(() => error);
      }
      const current = auth.accessToken();
      if (current && current !== usedToken) return retry(next, req, current);

      return from(auth.refresh()).pipe(
        catchError(() => {
          void auth.expireSession();
          return throwError(() => error);
        }),
        switchMap((session) => retry(next, req, session.accessToken)),
      );
    }),
  );
};

function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

/** The retry is not wrapped in catchError: a second 401 propagates instead of looping. */
function retry(
  next: HttpHandlerFn,
  req: HttpRequest<unknown>,
  token: string,
): Observable<HttpEvent<unknown>> {
  return next(withToken(req, token));
}
