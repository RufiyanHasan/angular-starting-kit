import { provideHttpClient, withFetch } from '@angular/common/http';
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
import { AppTitleStrategy } from './routing/app-title-strategy';

/** All app-wide singletons in one place. Called once from app.config.ts. */
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideAuth(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    // Angular runs separate initializers in parallel; these steps depend on each other,
    // so they share one: config first (everything reads it), then the persisted session.
    provideAppInitializer(async () => {
      const injector = inject(Injector);
      await injector.get(ConfigService).load();
      // Resolved only now: the AuthProvider factory reads config.
      await injector.get(AuthService).init();
    }),
  ]);
}
