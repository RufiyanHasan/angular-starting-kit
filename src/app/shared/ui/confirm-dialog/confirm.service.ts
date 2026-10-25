import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  /** Already-translated texts. Labels default to "Confirm" / "Cancel". */
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  /** Destructive action: red confirm button. */
  readonly danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  readonly resolve: (confirmed: boolean) => void;
}

/**
 * Promise-based confirmation, rendered by <app-confirm-dialog> (placed once in the root):
 *
 *   if (await confirm.confirm({ title: 'Delete user?', message: '…', danger: true })) { … }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly state = signal<PendingConfirm | null>(null);
  readonly pending = this.state.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.settle(false); // a newer request replaces (and cancels) an open one
    return new Promise((resolve) => this.state.set({ ...options, resolve }));
  }

  settle(confirmed: boolean): void {
    const pending = this.state();
    if (!pending) return;
    this.state.set(null);
    pending.resolve(confirmed);
  }
}
