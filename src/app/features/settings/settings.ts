import { Component, inject } from '@angular/core';
import { LanguageService } from '@core/i18n/language.service';
import { THEME_PREFERENCES, type ThemePreference, ThemeService } from '@core/theme/theme.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormField, InputDirective } from '@shared/ui/form-field/form-field';

@Component({
  selector: 'app-settings',
  imports: [TranslocoPipe, FormField, InputDirective],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  protected readonly theme = inject(ThemeService);
  protected readonly language = inject(LanguageService);
  protected readonly themes = THEME_PREFERENCES;

  protected setTheme(preference: ThemePreference): void {
    this.theme.setPreference(preference);
  }

  protected setLanguage(event: Event): void {
    void this.language.use((event.target as HTMLSelectElement).value);
  }
}
