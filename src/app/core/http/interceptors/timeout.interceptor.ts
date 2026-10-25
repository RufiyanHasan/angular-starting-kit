import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ConfigService } from '@core/config/config.service';
import { throwError, timeout } from 'rxjs';
import { REQUEST_TIMEOUT_MS } from '../http-context';

/**
 * Fails a request with a 408 HttpErrorResponse when no event arrives for `ms`.
 * Uses `each` (idle timeout) because HttpClient emits a `Sent` event immediately.
 */
export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  const ms = req.context.get(REQUEST_TIMEOUT_MS) ?? inject(ConfigService).get('httpTimeoutMs');
  return next(req).pipe(
    timeout({
      each: ms,
      with: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 408,
              statusText: 'Request Timeout',
              url: req.urlWithParams,
              error: { message: `No response within ${ms} ms` },
            }),
        ),
    }),
  );
};
