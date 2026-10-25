import { TestBed } from '@angular/core/testing';
import { AuthError } from '../auth.models';
import { decodeJwt } from '../jwt';
import { MOCK_AUTH_OPTIONS, MockJwtAuthProvider } from './mock-jwt-auth.provider';

describe('MockJwtAuthProvider', () => {
  let provider: MockJwtAuthProvider;
  const options = { latencyMs: 0, accessTokenTtlMs: 60_000, refreshTokenTtlMs: 120_000 };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [MockJwtAuthProvider, { provide: MOCK_AUTH_OPTIONS, useValue: options }],
    });
    provider = TestBed.inject(MockJwtAuthProvider);
  });

  afterEach(() => vi.useRealTimers());

  it('logs in a demo account and issues a decodable JWT', async () => {
    const session = await provider.login({ email: ' ADMIN@example.com ', password: 'admin123' });
    expect(session.user.roles).toContain('admin');
    expect(decodeJwt(session.accessToken)).toMatchObject({ sub: 'u-1', roles: ['admin', 'user'] });
  });

  it('rejects bad credentials', async () => {
    await expect(provider.login({ email: 'admin@example.com', password: 'nope' })).rejects.toEqual(
      new AuthError('invalid_credentials', 'Invalid email or password'),
    );
  });

  it('restores a persisted session', async () => {
    const session = await provider.login({ email: 'user@example.com', password: 'user123' });
    expect(await provider.restore()).toEqual(session);
  });

  it('silently refreshes an expired access token on restore', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const first = await provider.login({ email: 'user@example.com', password: 'user123' });
    vi.advanceTimersByTime(options.accessTokenTtlMs + 1_000);

    const restored = await provider.restore();
    expect(restored?.user.id).toBe('u-2');
    expect(restored?.accessToken).not.toBe(first.accessToken);
  });

  it('fails refresh once the refresh token has expired', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    await provider.login({ email: 'user@example.com', password: 'user123' });
    vi.advanceTimersByTime(options.refreshTokenTtlMs + 1_000);

    await expect(provider.refresh()).rejects.toMatchObject({ code: 'session_expired' });
    expect(await provider.restore()).toBeNull();
  });

  it('logout clears the persisted session', async () => {
    await provider.login({ email: 'user@example.com', password: 'user123' });
    await provider.logout();
    expect(await provider.restore()).toBeNull();
  });
});
