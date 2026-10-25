import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Translation, type TranslocoLoader } from '@jsverse/transloco';
import { httpContext } from '../http/http-context';

/** Translation files live in `public/assets/i18n/<lang>.json`; `en.json` is the source of truth. */
export const I18N_PATH = 'assets/i18n';

@Injectable({ providedIn: 'root' })
export class I18nLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`${I18N_PATH}/${lang}.json`, {
      // A failed load is handled by LanguageService (falls back to the default language).
      context: httpContext({ skipErrorToast: true }),
    });
  }
}
