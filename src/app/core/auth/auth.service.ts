import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoggerService } from '@core/logging/logger.service';
import { AuthProvider } from './auth-provider';
import { type AuthSession, type LoginCredentials, type Role } from './auth.models';

/**
 * The only auth API feature code should use. Holds the session as signals and
 * delegates the mechanics to whichever AuthProvider is configured.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly provider = inject(AuthProvider);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  private readonly session = signal<AuthSession | null>(null);
  private refreshPromise: Promise<AuthSession> | null = null;

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly loginMode = this.provider.loginMode;

  /** Restores a persisted session. Runs once during app initialization; never throws. */
  async init(): Promise<void> {
    try {
      this.session.set(await this.provider.restore());
    } catch (error) {
      this.logger.warn('Session restore failed', error);
      this.session.set(null);
    }
  }

  async login(credentials?: LoginCredentials): Promise<void> {
    this.session.set(await this.provider.login(credentials));
  }

  async logout(): Promise<void> {
    try {
      await this.provider.logout();
    } finally {
      this.session.set(null);
      await this.router.navigateByUrl('/login');
    }
  }

  /**
   * Single-flight: concurrent callers (e.g. several requests hitting 401 at once)
   * share one refresh. On failure the session is cleared and the error is rethrown.
   */
  refresh(): Promise<AuthSession> {
    this.refreshPromise ??= this.provider
      .refresh()
      .then(
        (session) => {
          this.session.set(session);
          return session;
        },
        (error: unknown) => {
          this.session.set(null);
          throw error;
        },
      )
      .finally(() => (this.refreshPromise = null));
    return this.refreshPromise;
  }

  /** The running refresh, if any. The auth interceptor holds new requests until it settles. */
  refreshInFlight(): Promise<AuthSession> | null {
    return this.refreshPromise;
  }

  /**
   * Called when the session can't be refreshed: clear it and send the user to /login,
   * remembering where they were. Safe to call several times (concurrent failures).
   */
  async expireSession(): Promise<void> {
    this.session.set(null);
    await this.provider.logout().catch(() => undefined);
    if (this.router.url.startsWith('/login')) return;
    await this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url, reason: 'expired' },
    });
  }

  /** Current access token, for the auth interceptor. */
  accessToken(): string | null {
    return this.session()?.accessToken ?? null;
  }

  hasAnyRole(roles: readonly Role[]): boolean {
    const userRoles = this.user()?.roles ?? [];
    return roles.some((role) => userRoles.includes(role));
  }
}
