import { InjectionToken, Injectable, inject } from '@angular/core';
import { StorageService } from '@core/storage/storage.service';
import { AuthProvider } from '../auth-provider';
import { AuthError, type AuthSession, type LoginCredentials, type User } from '../auth.models';
import { createUnsignedJwt, decodeJwt } from '../jwt';
import { MOCK_ACCOUNTS } from './mock-users';

export const MOCK_AUTH_OPTIONS = new InjectionToken<{
  /** Simulated network latency. */
  readonly latencyMs: number;
  readonly accessTokenTtlMs: number;
  readonly refreshTokenTtlMs: number;
}>('MOCK_AUTH_OPTIONS', {
  factory: () => ({
    latencyMs: 400,
    accessTokenTtlMs: 5 * 60_000,
    refreshTokenTtlMs: 7 * 24 * 60 * 60_000,
  }),
});

interface StoredSession {
  readonly session: AuthSession;
  readonly refreshToken: string;
  readonly refreshExpiresAt: number;
}

const STORAGE_KEY = 'mock-auth.session';

/**
 * Fully client-side auth for demos and local development. Issues unsigned JWTs with a short
 * access-token TTL, so the refresh flow is exercised for real. NEVER use in production.
 */
@Injectable()
export class MockJwtAuthProvider extends AuthProvider {
  readonly loginMode = 'credentials' as const;

  private readonly storage = inject(StorageService);
  private readonly options = inject(MOCK_AUTH_OPTIONS);

  async restore(): Promise<AuthSession | null> {
    const stored = this.storage.get<StoredSession>(STORAGE_KEY);
    if (!stored) return null;
    const payload = decodeJwt(stored.session.accessToken);
    if (payload && payload.exp * 1000 > Date.now()) return stored.session;
    // Access token expired: try a silent refresh before giving up.
    return this.refresh().catch(() => null);
  }

  async login(credentials?: LoginCredentials): Promise<AuthSession> {
    await this.delay();
    const account = MOCK_ACCOUNTS.find(
      (a) =>
        a.user.email.toLowerCase() === credentials?.email.trim().toLowerCase() &&
        a.password === credentials.password,
    );
    if (!account) throw new AuthError('invalid_credentials', 'Invalid email or password');
    return this.issue(account.user);
  }

  async refresh(): Promise<AuthSession> {
    await this.delay();
    const stored = this.storage.get<StoredSession>(STORAGE_KEY);
    if (!stored || stored.refreshExpiresAt <= Date.now()) {
      this.storage.remove(STORAGE_KEY);
      throw new AuthError('session_expired', 'Your session has expired');
    }
    return this.issue(stored.session.user);
  }

  async logout(): Promise<void> {
    this.storage.remove(STORAGE_KEY);
  }

  private issue(user: User): AuthSession {
    const now = Date.now();
    const expiresAt = now + this.options.accessTokenTtlMs;
    const accessToken = createUnsignedJwt({
      sub: user.id,
      iat: Math.floor(now / 1000),
      exp: Math.floor(expiresAt / 1000),
      name: user.name,
      email: user.email,
      roles: user.roles,
    });
    const session: AuthSession = { user, accessToken, expiresAt };
    this.storage.set(STORAGE_KEY, {
      session,
      refreshToken: crypto.randomUUID(),
      refreshExpiresAt: now + this.options.refreshTokenTtlMs,
    } satisfies StoredSession);
    return session;
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.options.latencyMs));
  }
}
