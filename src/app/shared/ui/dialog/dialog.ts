import {
  Component,
  type ElementRef,
  afterRenderEffect,
  booleanAttribute,
  input,
  model,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

let nextId = 0;

/**
 * Modal built on the native <dialog> + showModal(): the browser provides the focus trap,
 * makes the rest of the page inert, handles Escape and renders in the top layer, so no
 * overlay library is needed. Focus returns to the opener on close. Initial focus goes to
 * the first `[data-autofocus]` element, else the browser's default.
 *
 *   <app-dialog heading="Edit user" [(open)]="editing">
 *     …content…
 *     <button appButton dialogActions (click)="editing.set(false)">Cancel</button>
 *   </app-dialog>
 */
@Component({
  selector: 'app-dialog',
  imports: [TranslocoPipe, Button, Icon],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog {
  readonly open = model(false);
  readonly heading = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });

  protected readonly titleId = `dialog-title-${++nextId}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private returnFocus: HTMLElement | null = null;

  constructor() {
    afterRenderEffect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) {
        this.returnFocus = document.activeElement as HTMLElement | null;
        el.showModal();
        el.querySelector<HTMLElement>('[data-autofocus]')?.focus();
      } else if (!this.open() && el.open) {
        el.close();
      }
    });
  }

  /** Native `close` fires for Escape, el.close() and <form method="dialog">. */
  protected onClose(): void {
    this.open.set(false);
    this.returnFocus?.focus();
    this.returnFocus = null;
  }

  /** A click whose target is the <dialog> itself landed on the backdrop (the panel fills the box). */
  protected onClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) this.open.set(false);
  }
}
