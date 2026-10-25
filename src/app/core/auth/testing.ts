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

  constructor(
    user: User | null,
    private readonly accessToken = 'test-token',
  ) {
    super();
    this.session = user ? { user, accessToken, expiresAt: Date.now() + 60_000 } : null;
  }

  restore = vi.fn(async () => this.session);
  login = vi.fn(async () => {
    this.session = {
      user: TEST_USER,
      accessToken: this.accessToken,
      expiresAt: Date.now() + 60_000,
    };
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
 * to load `user` as the signed-in user (pass null for signed-out). Pass `accessToken` when
 * requests must pass the mock API's token check (see `testToken` in src/mocks/testing.ts).
 */
export function provideAuthForTesting(
  user: User | null = TEST_USER,
  options: { accessToken?: string } = {},
): Provider[] {
  return [{ provide: AuthProvider, useValue: new FakeAuthProvider(user, options.accessToken) }];
}
