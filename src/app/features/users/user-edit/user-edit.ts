import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { type ApiErrorBody } from '@core/http/api.models';
import { type HasUnsavedChanges } from '@core/routing/unsaved-changes.guard';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Button } from '@shared/ui/button/button';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { FormField, InputDirective } from '@shared/ui/form-field/form-field';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { ToastService } from '@shared/ui/toast/toast.service';
import {
  USER_ROLES,
  USER_STATUSES,
  type UserInput,
  type UserRole,
  type UserStatus,
} from '../user.model';
import { UsersApi } from '../users.api';
import { UsersStore } from '../users.store';

type Field = keyof UserInput;

const NAME_MAX_LENGTH = 100;

/** Create (`/users/new`) and edit (`/users/:id/edit`) share this form. */
@Component({
  selector: 'app-user-edit',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
    Button,
    EmptyState,
    FormField,
    InputDirective,
    Skeleton,
  ],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.scss',
})
export class UserEdit implements HasUnsavedChanges {
  /** Route param `:id`; undefined on `/users/new`. */
  readonly id = input<string>();

  private readonly api = inject(UsersApi);
  private readonly store = inject(UsersStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly roles = USER_ROLES;
  protected readonly statuses = USER_STATUSES;
  protected readonly nameMaxLength = NAME_MAX_LENGTH;
  protected readonly isNew = computed(() => !this.id());
  protected readonly saving = signal(false);
  /** Form-level message for a 422 (field messages go on the fields). */
  protected readonly serverError = signal(false);
  private saved = false;

  /** Idle (no request) when creating: the params function returns undefined. */
  protected readonly user = rxResource({
    params: () => this.id(),
    stream: ({ params: id }) => this.api.getById(id),
  });
  protected readonly notFound = computed(() => {
    const error = this.user.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['user' as UserRole, Validators.required],
    status: ['active' as UserStatus, Validators.required],
  });

  constructor() {
    effect(() => {
      const user = this.user.value();
      if (user) {
        const { name, email, role, status } = user;
        this.form.reset({ name, email, role, status });
      }
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saved;
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    this.serverError.set(false);
    const t = this.transloco;
    try {
      const value = this.form.getRawValue();
      const id = this.id();
      const user = id ? await this.store.update(id, value) : await this.store.create(value);
      this.saved = true;
      this.toast.success(
        id ? t.translate('users.updated') : t.translate('users.created', { name: user.name }),
      );
      await this.router.navigate(['/users', user.id]);
    } catch (error) {
      // Other failures were already toasted by the error interceptor.
      if (error instanceof HttpErrorResponse && error.status === 422) {
        this.applyServerErrors(error.error as ApiErrorBody);
      }
    } finally {
      this.saving.set(false);
    }
  }

  /** Translation key for the first client-side validation error; '' when none is shown. */
  protected errorKey(field: Field): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors || control.hasError('server')) return '';
    if (control.hasError('required')) return `users.form.errors.${field}Required`;
    if (control.hasError('maxlength')) return 'users.form.errors.nameMaxLength';
    if (control.hasError('email')) return 'users.form.errors.emailInvalid';
    return '';
  }

  /** Message from the API's `fieldErrors`; cleared as soon as the user edits the field. */
  protected serverFieldError(field: Field): string {
    return (this.form.controls[field].getError('server') as string | undefined) ?? '';
  }

  private applyServerErrors(body: ApiErrorBody | null): void {
    this.serverError.set(true);
    for (const [field, message] of Object.entries(body?.fieldErrors ?? {})) {
      const control = this.form.controls[field as Field] as
        (typeof this.form.controls)[Field] | undefined;
      control?.setErrors({ server: message });
      control?.markAsTouched();
    }
    this.focusFirstInvalid();
  }

  private focusFirstInvalid(): void {
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
  }
}
