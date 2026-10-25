import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthProvider } from '@core/auth/auth-provider';
import { AuthService } from '@core/auth/auth.service';
import { type FakeAuthProvider, provideAuthForTesting } from '@core/auth/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { firstValueFrom } from 'rxjs';
import { httpContext } from '../http-context';
import { authInterceptor } from './auth.interceptor';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let provider: FakeAuthProvider;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting({ apiBaseUrl: '/api' }),
        provideAuthForTesting(),
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    provider = TestBed.inject(AuthProvider) as FakeAuthProvider;
    await auth.init();
  });

  afterEach(() => backend.verify());

  it('adds the bearer token to API requests only', () => {
    http.get('/api/users').subscribe();
    http.get('https://cdn.example.com/x.json').subscribe();
    http.get('/apix/not-ours').subscribe();

    expect(backend.expectOne('/api/users').request.headers.get('Authorization')).toBe(
      'Bearer test-token',
    );
    expect(
      backend.expectOne('https://cdn.example.com/x.json').request.headers.has('Authorization'),
    ).toBe(false);
    expect(backend.expectOne('/apix/not-ours').request.headers.has('Authorization')).toBe(false);
  });

  it('respects SKIP_AUTH', () => {
    http.get('/api/public', { context: httpContext({ skipAuth: true }) }).subscribe();
    expect(backend.expectOne('/api/public').request.headers.has('Authorization')).toBe(false);
  });

  it('refreshes on 401 and retries with the new token', async () => {
    const result = firstValueFrom(http.get('/api/users'));
    backend.expectOne('/api/users').flush(null, UNAUTHORIZED);
    await tick();

    const retry = backend.expectOne('/api/users');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer refreshed-token');
    retry.flush({ ok: true });
    expect(await result).toEqual({ ok: true });
    expect(provider.refresh).toHaveBeenCalledTimes(1);
  });

  it('shares one refresh between concurrent 401s', async () => {
    const a = firstValueFrom(http.get('/api/a'));
    const b = firstValueFrom(http.get('/api/b'));
    backend.expectOne('/api/a').flush(null, UNAUTHORIZED);
    backend.expectOne('/api/b').flush(null, UNAUTHORIZED);
    await tick();

    backend.expectOne('/api/a').flush('A');
    backend.expectOne('/api/b').flush('B');
    expect(await Promise.all([a, b])).toEqual(['A', 'B']);
    expect(provider.refresh).toHaveBeenCalledTimes(1);
  });

  it('holds requests made during a refresh until it completes', async () => {
    let resolveRefresh!: () => void;
    provider.refresh.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRefresh = () => resolve({ ...provider.session!, accessToken: 'refreshed-token' });
        }),
    );
    void auth.refresh();

    http.get('/api/queued').subscribe();
    backend.expectNone('/api/queued');

    resolveRefresh();
    await tick();
    expect(backend.expectOne('/api/queued').request.headers.get('Authorization')).toBe(
      'Bearer refreshed-token',
    );
  });

  it('does not loop: a 401 after the retry is returned to the caller', async () => {
    const result = firstValueFrom(http.get('/api/users'));
    backend.expectOne('/api/users').flush(null, UNAUTHORIZED);
    await tick();
    backend.expectOne('/api/users').flush(null, UNAUTHORIZED);

    await expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(provider.refresh).toHaveBeenCalledTimes(1);
  });

  it('expires the session when the refresh fails', async () => {
    provider.refresh.mockRejectedValueOnce(new Error('refresh token expired'));
    const expire = vi.spyOn(auth, 'expireSession').mockResolvedValue();
    const result = firstValueFrom(http.get('/api/users'));
    backend.expectOne('/api/users').flush(null, UNAUTHORIZED);

    await expect(result).rejects.toMatchObject({ status: 401 });
    expect(expire).toHaveBeenCalled();
  });

  it('passes through non-401 errors untouched', async () => {
    const result = firstValueFrom(http.get('/api/users'));
    backend.expectOne('/api/users').flush(null, { status: 500, statusText: 'Server Error' });
    await expect(result).rejects.toMatchObject({ status: 500 });
    expect(provider.refresh).not.toHaveBeenCalled();
  });
});
