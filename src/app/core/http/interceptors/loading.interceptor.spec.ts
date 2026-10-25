import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { httpContext } from '../http-context';
import { LoadingService } from '../loading.service';
import { loadingInterceptor } from './loading.interceptor';

describe('loadingInterceptor', () => {
  it('counts in-flight requests, including failures, and honours SKIP_LOADING', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const backend = TestBed.inject(HttpTestingController);
    const loading = TestBed.inject(LoadingService);

    http.get('/a').subscribe();
    http.get('/b').subscribe({ error: () => undefined });
    http.get('/c', { context: httpContext({ skipLoading: true }) }).subscribe();
    expect(loading.pendingRequests()).toBe(2);
    expect(loading.isLoading()).toBe(true);

    backend.expectOne('/a').flush({});
    backend.expectOne('/b').flush(null, { status: 500, statusText: 'Error' });
    expect(loading.isLoading()).toBe(false);
    backend.expectOne('/c').flush({});
  });
});
