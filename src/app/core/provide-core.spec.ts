import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TRANSLOCO_LOADER } from '@jsverse/transloco';
import { of } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { CONFIG_URL, ConfigService } from './config/config.service';
import { provideCore } from './provide-core';

// Translations aren't under test here: a stub loader keeps i18n off the HTTP mock.
const stubLoader = { provide: TRANSLOCO_LOADER, useValue: { getTranslation: () => of({}) } };

describe('provideCore initialization', () => {
  beforeEach(() => localStorage.clear());

  it('loads config before resolving the auth provider, then restores the session', async () => {
    TestBed.configureTestingModule({
      providers: [provideCore(), provideHttpClientTesting(), provideRouter([]), stubLoader],
    });
    const done = TestBed.inject(ApplicationInitStatus).donePromise;

    TestBed.inject(HttpTestingController)
      .expectOne(CONFIG_URL)
      .flush({ appName: 'Acme', auth: { provider: 'mock' } });
    await done;

    expect(TestBed.inject(ConfigService).get('appName')).toBe('Acme');
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(document.documentElement.lang).toBe('en');
    TestBed.tick(); // flush ThemeService's effect
    expect(document.documentElement.dataset['theme']).toMatch(/^(light|dark)$/);
  });

  it('fails initialization for an unregistered auth provider', async () => {
    TestBed.configureTestingModule({
      providers: [provideCore(), provideHttpClientTesting(), provideRouter([]), stubLoader],
    });
    const done = TestBed.inject(ApplicationInitStatus).donePromise;

    TestBed.inject(HttpTestingController)
      .expectOne(CONFIG_URL)
      .flush({ auth: { provider: 'oidc' } });
    await expect(done).rejects.toThrow(/not registered/);
  });
});
