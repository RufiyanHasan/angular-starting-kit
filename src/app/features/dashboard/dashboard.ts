import { Component, inject, signal } from '@angular/core';
import { ConfigService } from '@core/config/config.service';
import { type Page } from '@core/http/api.models';
import { ApiService } from '@core/http/api.service';
import { httpContext } from '@core/http/http-context';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Button } from '@shared/ui/button/button';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ToastService } from '@shared/ui/toast/toast.service';

@Component({
  selector: 'app-dashboard',
  imports: [TranslocoPipe, Button, Skeleton],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  protected readonly config = inject(ConfigService).config;
  protected readonly userCount = signal<number | null>(null);

  constructor() {
    this.loadUserCount();
  }

  protected loadUserCount(): void {
    this.api
      .get<Page<unknown>>('users', { params: { pageSize: 1 } })
      .subscribe({ next: (page) => this.userCount.set(page.total), error: () => undefined });
  }

  /** Error toasts come from the error interceptor; this component doesn't handle them. */
  protected triggerError(status: number): void {
    this.api.get(`demo/status/${status}`).subscribe({ error: () => undefined });
  }

  protected triggerTimeout(): void {
    this.api
      .get('demo/slow', { params: { ms: 5000 }, context: httpContext({ timeoutMs: 1500 }) })
      .subscribe({ error: () => undefined });
  }

  protected triggerSlow(): void {
    this.api
      .get('demo/slow', { params: { ms: 2000 } })
      .subscribe(() => this.toast.success(this.transloco.translate('dashboard.slowDone')));
  }
}
