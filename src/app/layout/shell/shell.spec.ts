import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '@core/auth/auth.service';
import { provideAuthForTesting } from '@core/auth/testing';
import { provideConfigForTesting } from '@core/config/testing';
import { Shell } from './shell';

describe('Shell', () => {
  async function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideConfigForTesting({ appName: 'Acme' }),
        provideAuthForTesting(),
        provideRouter([{ path: '', component: Shell, children: [] }]),
      ],
    });
    await TestBed.inject(AuthService).init();
    const harness = await RouterTestingHarness.create('/');
    const el = harness.routeNativeElement as HTMLElement;
    const menuButton = () =>
      el.querySelector<HTMLButtonElement>('button[aria-controls="app-sidebar"]')!;
    return { harness, el, menuButton };
  }

  it('renders skip link, brand, nav and main landmark', async () => {
    const { el } = await setup();
    expect(el.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main-content');
    expect(el.querySelector('.brand')?.textContent).toContain('Acme');
    expect(el.querySelector('nav[aria-label="Main"]')).not.toBeNull();
    expect(el.querySelector('main#main-content')).not.toBeNull();
    expect(el.querySelector('.user')?.textContent).toContain('Test User');
  });

  it('toggles the mobile menu and closes it on Escape', async () => {
    const { harness, el, menuButton } = await setup();
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');

    menuButton().click();
    await harness.fixture.whenStable();
    expect(menuButton().getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('app-sidebar')?.classList).toContain('open');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await harness.fixture.whenStable();
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
  });
});
