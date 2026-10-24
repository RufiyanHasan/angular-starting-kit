import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ErrorHandler,
  type EnvironmentProviders,
  makeEnvironmentProviders,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy } from '@angular/router';
import { provideAppConfig } from './config/provide-app-config';
import { GlobalErrorHandler } from './error/global-error-handler';
import { AppTitleStrategy } from './routing/app-title-strategy';

/** All app-wide singletons in one place. Called once from app.config.ts. */
export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideAppConfig(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ]);
}
