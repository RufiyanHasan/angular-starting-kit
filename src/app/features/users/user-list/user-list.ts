import { Component, computed, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LocalDatePipe } from '@shared/pipes/local-date.pipe';
import { Button } from '@shared/ui/button/button';
import { ConfirmService } from '@shared/ui/confirm-dialog/confirm.service';
import { CellDef, DataTable, type Sort, type TableColumn } from '@shared/ui/data-table/data-table';
import { Paginator } from '@shared/ui/data-table/paginator';
import { FormField, InputDirective } from '@shared/ui/form-field/form-field';
import { Icon } from '@shared/ui/icon/icon';
import { ToastService } from '@shared/ui/toast/toast.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { USER_ROLES, USER_STATUSES, type User } from '../user.model';
import {
  PAGE_SIZES,
  type UserSortKey,
  type UsersQuery,
  parseUsersQuery,
  toUsersQueryParams,
} from '../users-query';
import { UsersStore } from '../users.store';

/**
 * Searchable, filterable, sortable, paged users table. The URL query string is the source
 * of truth for what's shown (shareable links, working back button); the store loads it.
 */
@Component({
  selector: 'app-user-list',
  imports: [
    RouterLink,
    TranslocoPipe,
    LocalDatePipe,
    Button,
    Icon,
    DataTable,
    CellDef,
    Paginator,
    FormField,
    InputDirective,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
})
export class UserList {
  protected readonly store = inject(UsersStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly auth = inject(AuthService);

  private readonly params = toSignal(this.route.queryParams, { requireSync: true });
  private readonly lang = toSignal(this.transloco.langChanges$);
  private readonly search$ = new Subject<string>();

  protected readonly query = computed(() => parseUsersQuery(this.params()));
  protected readonly sort = computed<Sort>(() => ({
    active: this.query().sort,
    direction: this.query().order,
  }));
  protected readonly isAdmin = computed(() => this.auth.hasAnyRole(['admin']));
  protected readonly roles = USER_ROLES;
  protected readonly statuses = USER_STATUSES;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly trackById = (user: User) => user.id;

  protected readonly columns = computed((): TableColumn<User>[] => {
    this.lang(); // re-translate headers on language change
    const t = (key: string) => this.transloco.translate(key);
    return [
      { key: 'name', header: t('users.name'), sortable: true },
      { key: 'email', header: t('users.email'), sortable: true, hideOnMobile: true },
      { key: 'role', header: t('users.role'), sortable: true },
      { key: 'status', header: t('users.status'), sortable: true, hideOnMobile: true },
      { key: 'createdAt', header: t('users.createdAt'), sortable: true, hideOnMobile: true },
      ...(this.isAdmin()
        ? [{ key: 'actions', header: t('users.actions'), align: 'end' as const }]
        : []),
    ];
  });

  constructor() {
    this.store.load(this.query);

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.navigate({ q, page: 1 }, true));

    // A page past the end (deleted last row, or a hand-edited URL): go to the last real page.
    effect(() => {
      const { loading, loadFailed, total } = this.store;
      const { page, pageSize } = this.query();
      const lastPage = Math.max(1, Math.ceil(total() / pageSize));
      if (!loading() && !loadFailed() && page > lastPage) {
        untracked(() => this.navigate({ page: lastPage }, true));
      }
    });
  }

  protected navigate(changes: Partial<UsersQuery>, replaceUrl = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toUsersQueryParams({ ...this.query(), ...changes }),
      replaceUrl,
    });
  }

  protected onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  protected onFilter(key: 'role' | 'status', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.navigate({ [key]: value || null, page: 1 });
  }

  protected onSort(sort: Sort): void {
    this.navigate({ sort: sort.active as UserSortKey, order: sort.direction, page: 1 });
  }

  protected clearFilters(): void {
    this.navigate({ q: '', role: null, status: null, page: 1 });
  }

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
    } catch {
      // The error interceptor already showed a toast.
    }
  }
}
