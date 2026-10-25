import { type Provider } from '@angular/core';
import { AuthProvider } from './auth-provider';
import { type AuthSession, type User } from './auth.models';

export const TEST_USER: User = {
  id: 'u-test',
  name: 'Test User',
  email: 'test@example.com',
  roles: ['user'],
};

/** In-memory AuthProvider for unit tests. */
export class FakeAuthProvider extends AuthProvider {
  readonly loginMode = 'credentials' as const;
  session: AuthSession | null;

  constructor(user: User | null) {
    super();
    this.session = user
      ? { user, accessToken: 'test-token', expiresAt: Date.now() + 60_000 }
      : null;
  }

  restore = vi.fn(async () => this.session);
  login = vi.fn(async () => {
    this.session = { user: TEST_USER, accessToken: 'test-token', expiresAt: Date.now() + 60_000 };
    return this.session;
  });
  refresh = vi.fn(async () => {
    if (!this.session) throw new Error('no session');
    this.session = { ...this.session, accessToken: 'refreshed-token' };
    return this.session;
  });
  logout = vi.fn(async () => {
    this.session = null;
  });
}

/**
 * Provides a FakeAuthProvider. Call `await TestBed.inject(AuthService).init()` afterwards
 * to load `user` as the signed-in user (pass null for signed-out).
 */
export function provideAuthForTesting(user: User | null = TEST_USER): Provider[] {
  return [{ provide: AuthProvider, useValue: new FakeAuthProvider(user) }];
}
