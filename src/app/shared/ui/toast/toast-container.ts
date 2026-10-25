import { Component, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from '../button/button';
import { Icon, type IconName } from '../icon/icon';
import { type Toast, type ToastKind, ToastService } from './toast.service';

const ICONS: Record<ToastKind, IconName> = {
  success: 'check',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
};

/** One toast. Starts with a visually hidden kind ("Error: …") so colour isn't the only cue. */
@Component({
  selector: 'app-toast-item',
  imports: [TranslocoPipe, Button, Icon],
  template: `
    <app-icon class="icon" [name]="icons[toast().kind]" />
    <p class="message">
      <span class="visually-hidden">{{ 'ui.toast.' + toast().kind | transloco }}: </span>
      {{ toast().message }}
    </p>
    <button
      appButton
      type="button"
      variant="ghost"
      size="icon"
      class="close"
      [attr.aria-label]="'ui.dismiss' | transloco"
      (click)="dismiss.emit()"
    >
      <app-icon name="x" [size]="16" />
    </button>
  `,
  styleUrl: './toast-item.scss',
  host: { '[attr.data-kind]': 'toast().kind' },
})
export class ToastItem {
  readonly toast = input.required<Toast>();
  readonly dismiss = output();
  protected readonly icons = ICONS;
}

/**
 * Renders toasts. Place once in the root component. The two live regions always exist
 * (screen readers ignore regions added later): errors are assertive, the rest polite.
 */
@Component({
  selector: 'app-toast-container',
  imports: [ToastItem],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {
  protected readonly toast = inject(ToastService);
  protected readonly errors = computed(() => this.toast.toasts().filter((t) => t.kind === 'error'));
  protected readonly others = computed(() => this.toast.toasts().filter((t) => t.kind !== 'error'));
}
