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
  private refreshInFlight: Promise<AuthSession> | null = null;

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
    this.refreshInFlight ??= this.provider
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
      .finally(() => (this.refreshInFlight = null));
    return this.refreshInFlight;
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
