import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let listeners: ((e: { matches: boolean }) => void)[];
  let systemDark: boolean;

  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    listeners = [];
    systemDark = false;
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return systemDark;
      },
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.push(fn),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  const create = () => {
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();
    return theme;
  };

  it('defaults to system and follows the OS preference live', () => {
    systemDark = true;
    const theme = create();
    expect(theme.preference()).toBe('system');
    expect(document.documentElement.dataset['theme']).toBe('dark');

    listeners.forEach((fn) => fn({ matches: false }));
    TestBed.tick();
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('applies and persists an explicit choice', () => {
    systemDark = true;
    const theme = create();
    theme.setPreference('light');
    TestBed.tick();
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('app.theme')).toBe('"light"');
  });

  it('restores the saved preference and ignores garbage', () => {
    localStorage.setItem('app.theme', '"dark"');
    expect(create().preference()).toBe('dark');

    TestBed.resetTestingModule();
    localStorage.setItem('app.theme', '"purple"');
    expect(create().preference()).toBe('system');
  });

  it('cycles light → dark → system', () => {
    const theme = create();
    theme.setPreference('light');
    theme.cycle();
    expect(theme.preference()).toBe('dark');
    theme.cycle();
    expect(theme.preference()).toBe('system');
    theme.cycle();
    expect(theme.preference()).toBe('light');
  });
});
