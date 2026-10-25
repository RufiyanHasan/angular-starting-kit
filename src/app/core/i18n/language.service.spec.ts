import { TestBed } from '@angular/core/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { TRANSLOCO_LOADER, TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import en from '../../../../public/assets/i18n/en.json';
import es from '../../../../public/assets/i18n/es.json';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  const files: Record<string, object> = { en, es };
  let getTranslation: ReturnType<typeof vi.fn>;

  function setup(browserLang = 'en-US') {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([browserLang]);
    getTranslation = vi.fn((lang: string) =>
      files[lang] ? of(files[lang]) : throwError(() => new Error('404')),
    );
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting({
          i18n: { defaultLang: 'en', availableLangs: ['en', 'es', 'fr'] },
        }),
        { provide: TRANSLOCO_LOADER, useValue: { getTranslation } },
      ],
    });
    return {
      language: TestBed.inject(LanguageService),
      transloco: TestBed.inject(TranslocoService),
    };
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('uses the browser language when available and sets <html lang>', async () => {
    const { language, transloco } = setup('es-ES');
    await language.init();
    expect(language.lang()).toBe('es');
    expect(transloco.getActiveLang()).toBe('es');
    expect(document.documentElement.lang).toBe('es');
    expect(transloco.translate('header.signOut')).toBe('Cerrar sesión');
  });

  it('prefers the saved choice over the browser language', async () => {
    localStorage.setItem('app.lang', '"en"');
    const { language } = setup('es-ES');
    await language.init();
    expect(language.lang()).toBe('en');
  });

  it('falls back to the default language when a file fails to load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined); // Transloco logs the failure
    const { language } = setup('fr-FR');
    await language.init();
    expect(getTranslation.mock.calls.map(([lang]) => lang)).toContain('fr');
    expect(language.lang()).toBe('en');
  });

  it('switches language, persists it and ignores unknown ones', async () => {
    const { language } = setup();
    await language.init();
    await language.use('es');
    expect(language.lang()).toBe('es');
    expect(localStorage.getItem('app.lang')).toBe('"es"');

    await language.use('de');
    expect(language.lang()).toBe('es');
  });

  it('names languages in their own language', () => {
    const { language } = setup();
    expect(language.displayName('es')).toBe('español');
    expect(language.displayName('en')).toBe('English');
  });
});
