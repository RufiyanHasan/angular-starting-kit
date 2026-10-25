import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly message: string;
}

export interface ToastOptions {
  readonly kind?: ToastKind;
  /** Auto-dismiss delay; 0 keeps the toast until dismissed. Default: 8s for errors, 5s otherwise. */
  readonly durationMs?: number;
}

const MAX_TOASTS = 5;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly state = signal<readonly Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 1;

  readonly toasts = this.state.asReadonly();

  /** Identical visible toasts are not duplicated (e.g. five requests failing at once). */
  show(message: string, { kind = 'info', durationMs }: ToastOptions = {}): number {
    const existing = this.state().find((t) => t.kind === kind && t.message === message);
    if (existing) return existing.id;

    const toast: Toast = { id: this.nextId++, kind, message };
    const next = [...this.state(), toast];
    for (const dropped of next.slice(0, Math.max(0, next.length - MAX_TOASTS))) {
      this.clearTimer(dropped.id);
    }
    this.state.set(next.slice(-MAX_TOASTS));

    const duration = durationMs ?? (kind === 'error' ? 8000 : 5000);
    if (duration > 0)
      this.timers.set(
        toast.id,
        setTimeout(() => this.dismiss(toast.id), duration),
      );
    return toast.id;
  }

  success(message: string, durationMs?: number): number {
    return this.show(message, { kind: 'success', durationMs });
  }

  error(message: string, durationMs?: number): number {
    return this.show(message, { kind: 'error', durationMs });
  }

  warning(message: string, durationMs?: number): number {
    return this.show(message, { kind: 'warning', durationMs });
  }

  info(message: string, durationMs?: number): number {
    return this.show(message, { kind: 'info', durationMs });
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.state.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  clear(): void {
    for (const id of this.timers.keys()) this.clearTimer(id);
    this.state.set([]);
  }

  private clearTimer(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
  }
}
