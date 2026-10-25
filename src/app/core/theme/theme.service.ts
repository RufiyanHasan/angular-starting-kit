import { DOCUMENT, DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from '../storage/storage.service';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Theme = Exclude<ThemePreference, 'system'>;

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

/** Read by the inline script in index.html too, to apply the theme before Angular boots. */
const STORAGE_KEY = 'theme';

const isPreference = (v: unknown): v is ThemePreference =>
  THEME_PREFERENCES.includes(v as ThemePreference);

/**
 * Light / dark / system theme. Writes `data-theme` on <html>; the CSS variables in
 * `styles/_tokens.scss` do the rest. "System" follows `prefers-color-scheme` live.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly media = inject(DOCUMENT).defaultView?.matchMedia?.(
    '(prefers-color-scheme: dark)',
  );

  private readonly systemDark = signal(this.media?.matches ?? false);
  private readonly pref = signal<ThemePreference>(
    ((v) => (isPreference(v) ? v : 'system'))(this.storage.get(STORAGE_KEY)),
  );

  readonly preference = this.pref.asReadonly();
  readonly theme = computed<Theme>(() => {
    const pref = this.pref();
    return pref === 'system' ? (this.systemDark() ? 'dark' : 'light') : pref;
  });

  constructor() {
    const onChange = (e: MediaQueryListEvent) => this.systemDark.set(e.matches);
    this.media?.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener('change', onChange));

    effect(() => {
      this.root.dataset['theme'] = this.theme();
    });
  }

  setPreference(preference: ThemePreference): void {
    this.pref.set(preference);
    this.storage.set(STORAGE_KEY, preference);
  }

  /** light → dark → system → light (header toggle). */
  cycle(): void {
    const i = THEME_PREFERENCES.indexOf(this.pref());
    this.setPreference(THEME_PREFERENCES[(i + 1) % THEME_PREFERENCES.length] ?? 'system');
  }
}
