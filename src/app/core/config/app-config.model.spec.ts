import { DEFAULT_APP_CONFIG, parseAppConfig } from './app-config.model';

describe('parseAppConfig', () => {
  it('fills defaults for missing keys', () => {
    expect(parseAppConfig({})).toEqual(DEFAULT_APP_CONFIG);
  });

  it('keeps valid values', () => {
    const config = parseAppConfig({
      appName: 'Acme',
      mockApi: true,
      logLevel: 'error',
      httpTimeoutMs: 5000,
      auth: { provider: 'oidc' },
      i18n: { defaultLang: 'es', availableLangs: ['en', 'es'] },
    });
    expect(config.appName).toBe('Acme');
    expect(config.mockApi).toBe(true);
    expect(config.logLevel).toBe('error');
    expect(config.auth.provider).toBe('oidc');
    expect(config.i18n.defaultLang).toBe('es');
  });

  it.each([
    ['non-object root', []],
    ['wrong type', { mockApi: 'yes' }],
    ['unknown log level', { logLevel: 'verbose' }],
    ['non-positive timeout', { httpTimeoutMs: 0 }],
    ['unknown auth provider', { auth: { provider: 'saml' } }],
    ['default lang not available', { i18n: { defaultLang: 'fr', availableLangs: ['en'] } }],
  ])('rejects %s', (_label, raw) => {
    expect(() => parseAppConfig(raw)).toThrow();
  });
});
