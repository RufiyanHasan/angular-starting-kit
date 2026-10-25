import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { LoggerService } from '@core/logging/logger.service';
import { ToastService } from '@shared/ui/toast/toast.service';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting(),
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
      ],
    });
    return {
      handler: TestBed.inject(ErrorHandler),
      log: vi.spyOn(TestBed.inject(LoggerService), 'error').mockImplementation(() => undefined),
      toast: vi.spyOn(TestBed.inject(ToastService), 'error'),
    };
  }

  it('logs and toasts unexpected errors', () => {
    const { handler, log, toast } = setup();
    const error = new Error('boom');
    handler.handleError(error);
    expect(log).toHaveBeenCalledWith('Unhandled error', error);
    expect(toast).toHaveBeenCalled();
  });

  it('only logs HTTP errors (the error interceptor already toasted them)', () => {
    const { handler, log, toast } = setup();
    handler.handleError(new HttpErrorResponse({ status: 500 }));
    expect(log).toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });
});
