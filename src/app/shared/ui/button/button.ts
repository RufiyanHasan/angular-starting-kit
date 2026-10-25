import { Component, booleanAttribute, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'icon';

/**
 * Styles a native <button> or <a>, keeping its semantics, keyboard behaviour and form
 * integration. `loading` shows a spinner and sets aria-busy; disable the button yourself
 * (`[disabled]="saving()"`) so double submits are impossible. Icon-only buttons need an aria-label.
 *
 *   <button appButton variant="primary" type="submit" [loading]="saving()">Save</button>
 */
@Component({
  // Attribute selector on purpose: the host stays a real <button>/<a> (like Angular Material).
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appButton], a[appButton]',
  template: `
    @if (loading()) {
      <span class="spinner" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styleUrl: './button.scss',
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.aria-busy]': 'loading() || null',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false, { transform: booleanAttribute });
}
