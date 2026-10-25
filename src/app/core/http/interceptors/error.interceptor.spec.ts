import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { ToastService } from '@shared/ui/toast/toast.service';
import { httpContext } from '../http-context';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let toastError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting(),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    toastError = vi.spyOn(TestBed.inject(ToastService), 'error');
  });

  it('toasts and rethrows', () => {
    const error = vi.fn();
    http.get('/api/x').subscribe({ error });
    backend.expectOne('/api/x').flush(null, { status: 500, statusText: 'Server Error' });

    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('Something went wrong'));
    expect(error).toHaveBeenCalled();
  });

  it('prefers the server message for 4xx', () => {
    http.get('/api/x').subscribe({ error: () => undefined });
    backend
      .expectOne('/api/x')
      .flush({ message: 'Email already in use.' }, { status: 409, statusText: 'Conflict' });
    expect(toastError).toHaveBeenCalledWith('Email already in use.');
  });

  it('skips 401 (owned by the auth interceptor) and SKIP_ERROR_TOAST requests', () => {
    http.get('/api/a').subscribe({ error: () => undefined });
    http
      .get('/api/b', { context: httpContext({ skipErrorToast: true }) })
      .subscribe({ error: () => undefined });
    backend.expectOne('/api/a').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/b').flush(null, { status: 500, statusText: 'Server Error' });
    expect(toastError).not.toHaveBeenCalled();
  });
});
