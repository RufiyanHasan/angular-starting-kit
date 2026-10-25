import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideConfigForTesting } from '@core/config/testing';
import { AuthProvider } from './auth-provider';
import { AuthService } from './auth.service';
import { type FakeAuthProvider, TEST_USER, provideAuthForTesting } from './testing';

describe('AuthService', () => {
  function setup(user = TEST_USER as typeof TEST_USER | null) {
    TestBed.configureTestingModule({
      providers: [provideConfigForTesting(), provideRouter([]), provideAuthForTesting(user)],
    });
    return {
      auth: TestBed.inject(AuthService),
      provider: TestBed.inject(AuthProvider) as FakeAuthProvider,
    };
  }

  it('starts signed out until init restores a session', async () => {
    const { auth } = setup();
    expect(auth.isAuthenticated()).toBe(false);
    await auth.init();
    expect(auth.user()).toEqual(TEST_USER);
    expect(auth.accessToken()).toBe('test-token');
  });

  it('init never throws', async () => {
    const { auth, provider } = setup();
    provider.restore.mockRejectedValueOnce(new Error('storage broken'));
    await expect(auth.init()).resolves.toBeUndefined();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('login sets the session', async () => {
    const { auth } = setup(null);
    await auth.login({ email: 'a@b.c', password: 'secret1' });
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('logout clears the session and navigates to /login', async () => {
    const { auth } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await auth.init();
    await auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('shares one in-flight refresh between concurrent callers', async () => {
    const { auth, provider } = setup();
    await auth.init();
    const [a, b] = await Promise.all([auth.refresh(), auth.refresh()]);
    expect(provider.refresh).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(auth.accessToken()).toBe('refreshed-token');

    await auth.refresh();
    expect(provider.refresh).toHaveBeenCalledTimes(2);
  });

  it('clears the session when refresh fails', async () => {
    const { auth, provider } = setup();
    await auth.init();
    provider.refresh.mockRejectedValueOnce(new Error('expired'));
    await expect(auth.refresh()).rejects.toThrow('expired');
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('checks roles', async () => {
    const { auth } = setup({ ...TEST_USER, roles: ['user'] });
    await auth.init();
    expect(auth.hasAnyRole(['user'])).toBe(true);
    expect(auth.hasAnyRole(['admin'])).toBe(false);
  });
});
