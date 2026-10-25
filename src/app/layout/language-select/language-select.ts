import { Component, inject } from '@angular/core';
import { LanguageService } from '@core/i18n/language.service';
import { TranslocoPipe } from '@jsverse/transloco';

let nextId = 0;

/** Compact language switcher; hidden when only one language is configured. */
@Component({
  selector: 'app-language-select',
  imports: [TranslocoPipe],
  template: `
    @if (language.available().length > 1) {
      <label class="visually-hidden" [for]="id">{{ 'language.label' | transloco }}</label>
      <select [id]="id" class="app-input" (change)="change($event)">
        @for (lang of language.available(); track lang) {
          <option [value]="lang" [attr.lang]="lang" [selected]="lang === language.lang()">
            {{ language.displayName(lang) }}
          </option>
        }
      </select>
    }
  `,
  styles: `
    select {
      width: auto;
      min-height: 2rem;
      padding-block: var(--space-1);
      font-size: var(--font-size-sm);
    }
  `,
})
export class LanguageSelect {
  protected readonly language = inject(LanguageService);
  protected readonly id = `language-select-${++nextId}`;

  protected change(event: Event): void {
    void this.language.use((event.target as HTMLSelectElement).value);
  }
}
