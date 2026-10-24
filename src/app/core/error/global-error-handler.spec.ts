import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { LoggerService } from '@core/logging/logger.service';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  it('logs unhandled errors', () => {
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting(),
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
      ],
    });
    const logger = TestBed.inject(LoggerService);
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    const error = new Error('boom');

    TestBed.inject(ErrorHandler).handleError(error);

    expect(spy).toHaveBeenCalledWith('Unhandled error', error);
  });
});
