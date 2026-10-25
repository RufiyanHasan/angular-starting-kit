import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from '../button/button';
import { Dialog } from '../dialog/dialog';
import { ConfirmService } from './confirm.service';

/**
 * Renders ConfirmService requests. Place once in the root component. The dialog stays in
 * the DOM between requests so the native close (and focus return) always runs.
 * Cancel gets initial focus: the safe choice for destructive actions.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Dialog, Button, TranslocoPipe],
  template: `
    @let request = confirm.pending();
    <app-dialog
      size="sm"
      [heading]="request?.title ?? ''"
      [open]="!!request"
      (openChange)="$event || confirm.settle(false)"
    >
      <p class="message">{{ request?.message }}</p>
      <button appButton dialogActions type="button" data-autofocus (click)="confirm.settle(false)">
        {{ request?.cancelLabel ?? ('ui.cancel' | transloco) }}
      </button>
      <button
        appButton
        dialogActions
        type="button"
        [variant]="request?.danger ? 'danger' : 'primary'"
        (click)="confirm.settle(true)"
      >
        {{ request?.confirmLabel ?? ('ui.confirm' | transloco) }}
      </button>
    </app-dialog>
  `,
  styles: `
    .message {
      margin: 0;
    }
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
}
