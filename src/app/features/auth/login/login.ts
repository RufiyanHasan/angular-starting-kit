import {
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
  Injector,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthError } from '@core/auth/auth.models';
import { AuthService } from '@core/auth/auth.service';
import { MOCK_ACCOUNTS } from '@core/auth/mock/mock-users';
import { ConfigService } from '@core/config/config.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from '@shared/ui/button/button';
import { FormField, InputDirective } from '@shared/ui/form-field/form-field';
import { LanguageSelect } from '@layout/language-select/language-select';
import { ThemeToggle } from '@layout/theme-toggle/theme-toggle';

const DEFAULT_REDIRECT = '/dashboard';
const PASSWORD_MIN_LENGTH = 6;

/** Only same-origin paths: blocks open redirects like `?returnUrl=//evil.com`. */
export function safeReturnUrl(url: string | undefined): string {
  return url?.startsWith('/') && !url.startsWith('//') ? url : DEFAULT_REDIRECT;
}

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    Button,
    FormField,
    InputDirective,
    LanguageSelect,
    ThemeToggle,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly config = inject(ConfigService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Bound from `?returnUrl=` (withComponentInputBinding). */
  readonly returnUrl = input<string>();
  /** `?reason=expired` is set by AuthService.expireSession(). */
  readonly reason = input<string>();

  protected readonly appName = this.config.get('appName');
  protected readonly loginMode = this.auth.loginMode;
  protected readonly demoAccounts =
    this.config.get('auth').provider === 'mock' ? MOCK_ACCOUNTS : [];
  protected readonly submitting = signal(false);
  /** Translation key of the form-level error. */
  protected readonly error = signal<string | null>(null);
  protected readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
  });

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    if (this.loginMode === 'credentials' && this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.loginMode === 'credentials' ? this.form.getRawValue() : undefined);
      await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
    } catch (e) {
      this.error.set(
        e instanceof AuthError && e.code === 'invalid_credentials'
          ? 'auth.invalidCredentials'
          : 'auth.failed',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  protected fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
    this.error.set(null);
  }

  /** Translation key for the control's first error, shown once touched; '' when valid. */
  protected errorKey(control: 'email' | 'password'): string {
    const c = this.form.controls[control];
    if (!c.touched || c.valid) return '';
    if (c.hasError('required')) return `auth.errors.${control}Required`;
    return control === 'email' ? 'auth.errors.emailInvalid' : 'auth.errors.passwordMinLength';
  }

  private focusFirstInvalid(): void {
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
  }
}
