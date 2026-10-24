import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { TitleStrategy, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { AppTitleStrategy } from '@core/routing/app-title-strategy';
import { routes } from './app.routes';

describe('App routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting({ appName: 'Acme' }),
        provideRouter(routes),
        { provide: TitleStrategy, useClass: AppTitleStrategy },
      ],
    });
  });

  it('redirects the root to the lazy-loaded dashboard', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(TestBed.inject(Title).getTitle()).toBe('Dashboard · Acme');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Dashboard');
  });

  it('shows the 404 page for unknown URLs', async () => {
    const harness = await RouterTestingHarness.create('/does-not-exist');
    expect(TestBed.inject(Title).getTitle()).toBe('Page not found · Acme');
    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
  });
});
