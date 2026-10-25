import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthProvider } from '@core/auth/auth-provider';
import { AuthError } from '@core/auth/auth.models';
import { type FakeAuthProvider, provideAuthForTesting } from '@core/auth/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { Login, safeReturnUrl } from './login';

describe('Login', () => {
  async function setup(url = '/login') {
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting({ auth: { provider: 'mock' } }),
        provideAuthForTesting(null),
        provideRouter([{ path: 'login', component: Login }], withComponentInputBinding()),
      ],
    });
    const harness = await RouterTestingHarness.create(url);
    const el = harness.routeNativeElement as HTMLElement;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const provider = TestBed.inject(AuthProvider) as FakeAuthProvider;

    const type = (selector: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    };
    const submit = async () => {
      el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await harness.fixture.whenStable();
    };
    return { harness, el, navigate, provider, type, submit };
  }

  it('shows validation errors and does not call login when invalid', async () => {
    const { el, provider, type, submit } = await setup();
    type('#email', 'not-an-email');
    await submit();

    expect(el.querySelector('#email-error')?.textContent).toContain('valid email');
    expect(el.querySelector('#password-error')?.textContent).toContain('required');
    expect(el.querySelector('#email')?.getAttribute('aria-invalid')).toBe('true');
    expect(provider.login).not.toHaveBeenCalled();
  });

  it('signs in and navigates to the returnUrl', async () => {
    const { navigate, provider, type, submit } = await setup('/login?returnUrl=%2Fsettings');
    type('#email', 'user@example.com');
    type('#password', 'user123');
    await submit();

    expect(provider.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'user123' });
    expect(navigate).toHaveBeenCalledWith('/settings');
  });

  it('shows an alert on invalid credentials', async () => {
    const { el, provider, type, submit } = await setup();
    provider.login.mockRejectedValueOnce(new AuthError('invalid_credentials'));
    type('#email', 'user@example.com');
    type('#password', 'wrong-pass');
    await submit();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Invalid email or password');
  });

  it('lists demo accounts for the mock provider', async () => {
    const { el } = await setup();
    expect(el.textContent).toContain('admin@example.com');
  });
});

describe('safeReturnUrl', () => {
  it.each([
    [undefined, '/dashboard'],
    ['/users/1?tab=a', '/users/1?tab=a'],
    ['//evil.com', '/dashboard'],
    ['https://evil.com', '/dashboard'],
  ])('%s → %s', (input, expected) => {
    expect(safeReturnUrl(input)).toBe(expected);
  });
});
