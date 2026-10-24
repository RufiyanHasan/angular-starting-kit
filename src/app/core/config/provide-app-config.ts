import { type EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { ConfigService } from './config.service';

/** Blocks bootstrap until `/assets/config.json` is loaded and validated. */
export function provideAppConfig(): EnvironmentProviders {
  return provideAppInitializer(() => inject(ConfigService).load());
}
