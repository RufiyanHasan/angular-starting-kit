import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { type Role } from '@core/auth/auth.models';
import { AuthService } from '@core/auth/auth.service';
import { TEST_USER, provideAuthForTesting } from '@core/auth/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { authInterceptor } from '@core/http/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/http/interceptors/error.interceptor';
import { TEST_API_BASE, testToken } from '../../../mocks/testing';

@Component({ template: '<h1>Access denied</h1>' })
class ForbiddenStub {}

/**
 * Routed integration setup for the Users feature: real routes, store, interceptors and
 * (with `useMockApi()` in the spec) the real mock API. Signed in with `roles`.
 */
export async function setupUsersFeature(url: string, roles: Role[] = ['admin']) {
  TestBed.configureTestingModule({
    providers: [
      provideConfigForTesting({ apiBaseUrl: TEST_API_BASE }),
      provideAuthForTesting({ ...TEST_USER, roles }, { accessToken: testToken(roles) }),
      provideHttpClient(withFetch(), withInterceptors([errorInterceptor, authInterceptor])),
      provideRouter(
        [
          { path: 'users', loadChildren: () => import('./users.routes') },
          { path: 'forbidden', component: ForbiddenStub },
        ],
        withComponentInputBinding(),
      ),
    ],
  });
  await TestBed.inject(AuthService).init();
  const harness = await RouterTestingHarness.create(url);
  const el = () => harness.routeNativeElement as HTMLElement;

  /** Waits for HTTP + rendering to settle (HttpClient requests count as pending tasks). */
  const settle = async () => {
    for (let i = 0; i < 5; i++) await harness.fixture.whenStable();
  };
  await settle();
  return { harness, el, settle };
}
