export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'off';

export const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error', 'off'];

/**
 * Runtime configuration loaded from `/assets/config.json` before the app boots.
 * One build artifact serves every environment: replace the JSON at deploy time.
 */
export interface AppConfig {
  readonly appName: string;
  /** Base URL prepended by ApiService. Relative (`/api`) or absolute. */
  readonly apiBaseUrl: string;
  /** Serve API calls from the in-browser mock backend instead of a real server. */
  readonly mockApi: boolean;
  readonly logLevel: LogLevel;
  readonly httpTimeoutMs: number;
  readonly auth: {
    readonly provider: 'mock' | 'oidc';
  };
  readonly i18n: {
    readonly defaultLang: string;
    readonly availableLangs: readonly string[];
  };
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  appName: 'Angular Starter Kit',
  apiBaseUrl: '/api',
  mockApi: false,
  logLevel: 'warn',
  httpTimeoutMs: 15_000,
  auth: { provider: 'mock' },
  i18n: { defaultLang: 'en', availableLangs: ['en'] },
};

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function pick<T>(source: Json, key: string, guard: (v: unknown) => v is T, fallback: T): T {
  const value = source[key];
  if (value === undefined) return fallback;
  if (!guard(value)) throw new Error(`Invalid config value for "${key}": ${JSON.stringify(value)}`);
  return value;
}

const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
const isPositiveNumber = (v: unknown): v is number => typeof v === 'number' && v > 0;
const isLogLevel = (v: unknown): v is LogLevel => LOG_LEVELS.includes(v as LogLevel);
const isAuthProvider = (v: unknown): v is AppConfig['auth']['provider'] =>
  v === 'mock' || v === 'oidc';
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && v.every(isString);

/** Validates untrusted JSON and fills in defaults. Throws on malformed values. */
export function parseAppConfig(raw: unknown): AppConfig {
  if (!isObject(raw)) throw new Error('App config must be a JSON object');
  const d = DEFAULT_APP_CONFIG;
  const auth = isObject(raw['auth']) ? raw['auth'] : {};
  const i18n = isObject(raw['i18n']) ? raw['i18n'] : {};

  const availableLangs = pick(i18n, 'availableLangs', isStringArray, [...d.i18n.availableLangs]);
  const defaultLang = pick(i18n, 'defaultLang', isString, d.i18n.defaultLang);
  if (!availableLangs.includes(defaultLang)) {
    throw new Error(`i18n.defaultLang "${defaultLang}" is not in i18n.availableLangs`);
  }

  return {
    appName: pick(raw, 'appName', isString, d.appName),
    apiBaseUrl: pick(raw, 'apiBaseUrl', isString, d.apiBaseUrl),
    mockApi: pick(raw, 'mockApi', isBoolean, d.mockApi),
    logLevel: pick(raw, 'logLevel', isLogLevel, d.logLevel),
    httpTimeoutMs: pick(raw, 'httpTimeoutMs', isPositiveNumber, d.httpTimeoutMs),
    auth: { provider: pick(auth, 'provider', isAuthProvider, d.auth.provider) },
    i18n: { defaultLang, availableLangs },
  };
}
