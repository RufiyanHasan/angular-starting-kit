import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-footer',
  imports: [TranslocoPipe],
  template: `<footer class="footer">
    {{ 'app.footer' | transloco: { year, appName: appName() } }}
  </footer>`,
  styles: `
    .footer {
      padding: var(--space-4);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      border-top: 1px solid var(--color-border);
    }
  `,
})
export class Footer {
  readonly appName = input.required<string>();
  protected readonly year = new Date().getFullYear();
}
