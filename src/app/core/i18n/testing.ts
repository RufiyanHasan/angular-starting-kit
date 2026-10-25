import { type EnvironmentProviders, importProvidersFrom } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import en from '../../../../public/assets/i18n/en.json';
import es from '../../../../public/assets/i18n/es.json';

/**
 * Real translation files, loaded synchronously. Registered for every test via
 * `src/test-providers.ts`, so specs can assert on English text.
 */
export function provideI18nForTesting(): EnvironmentProviders {
  return importProvidersFrom(
    TranslocoTestingModule.forRoot({
      langs: { en, es },
      translocoConfig: {
        availableLangs: ['en', 'es'],
        defaultLang: 'en',
        missingHandler: { logMissingKey: false },
      },
      preloadLangs: true,
    }),
  );
}
