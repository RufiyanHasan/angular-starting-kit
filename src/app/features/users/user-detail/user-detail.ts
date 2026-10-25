import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { httpContext } from '@core/http/http-context';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { Button } from '@shared/ui/button/button';
import { ConfirmService } from '@shared/ui/confirm-dialog/confirm.service';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Icon } from '@shared/ui/icon/icon';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ToastService } from '@shared/ui/toast/toast.service';
import { type User } from '../user.model';
import { toUsersQueryParams } from '../users-query';
import { UsersApi } from '../users.api';
import { UsersStore } from '../users.store';

/**
 * One user. Loaded with Angular's built-in `rxResource` (plain signals, no store needed for a
 * single read); mutations still go through UsersStore so the cached list stays in sync.
 */
@Component({
  selector: 'app-user-detail',
  imports: [RouterLink, TranslocoPipe, LocalDatePipe, Button, EmptyState, Icon, Skeleton],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.scss',
})
export class UserDetail {
  /** Route param `:id` (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly api = inject(UsersApi);
  private readonly store = inject(UsersStore);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly auth = inject(AuthService);

  protected readonly user = rxResource({
    params: () => this.id(),
    // This page renders its own not-found / error states instead of a toast.
    stream: ({ params: id }) =>
      this.api.getById(id, { context: httpContext({ skipErrorToast: true }) }),
  });
  protected readonly notFound = computed(() => {
    const error = this.user.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly isAdmin = computed(() => this.auth.hasAnyRole(['admin']));
  /** Back to the list page the user came from (page, filters, sort). */
  protected readonly listParams = computed(() => toUsersQueryParams(this.store.query()));

  protected async remove(user: User): Promise<void> {
    const t = this.transloco;
    const confirmed = await this.confirm.confirm({
      title: t.translate('users.confirmDelete.title'),
      message: t.translate('users.confirmDelete.message', { name: user.name }),
      confirmLabel: t.translate('users.confirmDelete.confirm'),
      danger: true,
    });
    if (!confirmed) return;
    try {
      await this.store.remove(user.id);
      this.toast.success(t.translate('users.deleted', { name: user.name }));
      await this.router.navigate(['/users'], { queryParams: this.listParams() });
    } catch {
      // The error interceptor already showed a toast.
    }
  }
}
