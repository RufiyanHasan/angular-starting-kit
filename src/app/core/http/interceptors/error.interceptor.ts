import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoggerService } from '@core/logging/logger.service';
import { TranslocoService } from '@jsverse/transloco';
import { ToastService } from '@shared/ui/toast/toast.service';
import { catchError, throwError } from 'rxjs';
import { SKIP_ERROR_TOAST } from '../http-context';
import { httpErrorMessage } from '../http-error-message';

/**
 * Logs every failed request and shows a toast, then rethrows so callers can still react.
 * 401s are skipped: the auth interceptor owns them (refresh, or redirect to login).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const logger = inject(LoggerService);
  const transloco = inject(TranslocoService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        logger.warn(`HTTP ${error.status} ${req.method} ${req.urlWithParams}`, error.error);
        if (error.status !== 401 && !req.context.get(SKIP_ERROR_TOAST)) {
          toast.error(httpErrorMessage(error, (key) => transloco.translate(key)));
        }
      }
      return throwError(() => error);
    }),
  );
};
