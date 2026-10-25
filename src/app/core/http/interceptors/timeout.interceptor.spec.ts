import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { httpContext } from '../http-context';
import { timeoutInterceptor } from './timeout.interceptor';

describe('timeoutInterceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting({ httpTimeoutMs: 1000 }),
        provideHttpClient(withInterceptors([timeoutInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  it('fails with 408 after the configured timeout', () => {
    const error = vi.fn();
    TestBed.inject(HttpClient).get('/slow').subscribe({ error });
    const req = TestBed.inject(HttpTestingController).expectOne('/slow');

    vi.advanceTimersByTime(999);
    expect(error).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ status: 408 }));
    expect(req.cancelled).toBe(true);
  });

  it('uses the per-request override', () => {
    const error = vi.fn();
    TestBed.inject(HttpClient)
      .get('/slow', { context: httpContext({ timeoutMs: 5000 }) })
      .subscribe({ error });
    TestBed.inject(HttpTestingController).expectOne('/slow');

    vi.advanceTimersByTime(4999);
    expect(error).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(error).toHaveBeenCalled();
  });
});
