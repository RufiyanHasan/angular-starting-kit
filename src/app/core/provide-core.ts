import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ErrorHandler,
  type EnvironmentProviders,
  Injector,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { provideAuth } from './auth/provide-auth';
import { ConfigService } from './config/config.service';
import { GlobalErrorHandler } from './error/global-error-handler';
import { authInterceptor } from './http/interceptors/auth.interceptor';
import { errorInterceptor } from './http/interceptors/error.interceptor';
import { loadingInterceptor } from './http/interceptors/loading.interceptor';
import { timeoutInterceptor } from './http/interceptors/timeout.interceptor';
import { MOCK_BACKEND } from './http/mock-backend';
import { LanguageService } from './i18n/language.service';
import { provideI18n } from './i18n/provide-i18n';
import { AppTitleStrategy } from './routing/app-title-strategy';
import { ThemeService } from './theme/theme.service';

/** All app-wide singletons in one place. Called once from app.config.ts. */
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withFetch(),
      // Outermost first. loading: counts the whole exchange incl. retries.
      // error: sees only the final outcome (after refresh + retry). auth: token + refresh-on-401.
      // timeout: innermost, so each attempt gets its own timer.
      withInterceptors([loadingInterceptor, errorInterceptor, authInterceptor, timeoutInterceptor]),
    ),
    provideAuth(),
    provideI18n(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    // Angular runs separate initializers in parallel; these steps depend on each other,
    // so they share one: config → (mock API + translations) → persisted session.
    provideAppInitializer(async () => {
      const injector = inject(Injector);
      injector.get(ThemeService); // applies the saved theme right away
      const config = injector.get(ConfigService);
      await config.load();
      const startMockBackend = injector.get(MOCK_BACKEND, null);
      await Promise.all([
        config.get('mockApi') && startMockBackend
          ? startMockBackend(config.get('apiBaseUrl'))
          : undefined,
        injector.get(LanguageService).init(),
      ]);
      // Resolved only now: the AuthProvider factory reads config.
      await injector.get(AuthService).init();
    }),
  ]);
}
