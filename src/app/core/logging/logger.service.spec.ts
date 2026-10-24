import { TestBed } from '@angular/core/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { type LogLevel } from '@core/config/app-config.model';
import { LOG_SINKS, type LogSink, LoggerService } from './logger.service';

describe('LoggerService', () => {
  function setup(logLevel: LogLevel) {
    const sink: LogSink = { write: vi.fn() };
    TestBed.configureTestingModule({
      providers: [provideConfigForTesting({ logLevel }), { provide: LOG_SINKS, useValue: [sink] }],
    });
    return { logger: TestBed.inject(LoggerService), write: vi.mocked(sink.write) };
  }

  it('writes entries at or above the configured level', () => {
    const { logger, write } = setup('warn');
    logger.debug('d');
    logger.info('i');
    logger.warn('w', { id: 1 });
    logger.error('e');

    expect(write.mock.calls).toEqual([
      ['warn', 'w', [{ id: 1 }]],
      ['error', 'e', []],
    ]);
  });

  it('writes nothing when level is off', () => {
    const { logger, write } = setup('off');
    logger.error('e');
    expect(write).not.toHaveBeenCalled();
  });
});
