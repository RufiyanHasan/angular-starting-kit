import { type EnvironmentProviders, isDevMode } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { I18nLoader } from './i18n-loader';

/**
 * Transloco with runtime-loaded JSON files. Languages and the default come from config.json
 * and are applied by LanguageService.init(); the values here are only the pre-boot defaults.
 * English is the fallback for any key missing from another language.
 */
export function provideI18n(): EnvironmentProviders[] {
  return provideTransloco({
    config: {
      availableLangs: ['en'],
      defaultLang: 'en',
      fallbackLang: 'en',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
      missingHandler: { useFallbackTranslation: true, logMissingKey: isDevMode() },
    },
    loader: I18nLoader,
  });
}
