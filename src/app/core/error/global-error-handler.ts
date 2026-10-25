import { HttpErrorResponse } from '@angular/common/http';
import { type ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/logging/logger.service';
import { TranslocoService } from '@jsverse/transloco';
import { ToastService } from '@shared/ui/toast/toast.service';

/**
 * Last-resort handler for uncaught errors (component, signal effect, and — via
 * provideBrowserGlobalErrorListeners — window `error` / `unhandledrejection`).
 * HTTP errors were already toasted by the error interceptor, so they're only logged here.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  handleError(error: unknown): void {
    this.logger.error('Unhandled error', error);
    if (!(error instanceof HttpErrorResponse)) {
      this.toast.error(this.transloco.translate('errors.unexpected'));
    }
  }
}
