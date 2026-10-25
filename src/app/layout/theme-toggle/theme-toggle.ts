import { Component, computed, inject } from '@angular/core';
import { THEME_PREFERENCES, type ThemePreference, ThemeService } from '@core/theme/theme.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from '@shared/ui/button/button';
import { Icon, type IconName } from '@shared/ui/icon/icon';

/** Header button cycling light → dark → system. The full choice lives on the Settings page. */
@Component({
  selector: 'app-theme-toggle',
  imports: [TranslocoPipe, Button, Icon],
  template: `
    @let label =
      'theme.toggle'
        | transloco
          : { current: 'theme.' + preference() | transloco, next: 'theme.' + next() | transloco };
    <button
      appButton
      type="button"
      variant="ghost"
      size="icon"
      [attr.aria-label]="label"
      [title]="label"
      (click)="theme.cycle()"
    >
      <app-icon [name]="icons[preference()]" />
    </button>
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly preference = this.theme.preference;
  protected readonly next = computed(
    () =>
      THEME_PREFERENCES[
        (THEME_PREFERENCES.indexOf(this.preference()) + 1) % THEME_PREFERENCES.length
      ],
  );
  protected readonly icons: Record<ThemePreference, IconName> = {
    light: 'sun',
    dark: 'moon',
    system: 'monitor',
  };
}
