import { type ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from '@core/logging/logger.service';

/**
 * Last-resort handler for uncaught errors (component, signal effect, and — via
 * provideBrowserGlobalErrorListeners — window `error` / `unhandledrejection`).
 * HTTP errors are handled earlier by the error interceptor.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);

  handleError(error: unknown): void {
    this.logger.error('Unhandled error', error);
  }
}
