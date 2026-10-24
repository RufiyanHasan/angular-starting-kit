import { type EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { type AppConfig, DEFAULT_APP_CONFIG } from './app-config.model';
import { ConfigService } from './config.service';

/** Test helper: seeds ConfigService synchronously instead of fetching config.json. */
export function provideConfigForTesting(overrides: Partial<AppConfig> = {}): EnvironmentProviders {
  return provideEnvironmentInitializer(() =>
    inject(ConfigService).set({ ...DEFAULT_APP_CONFIG, logLevel: 'off', ...overrides }),
  );
}
