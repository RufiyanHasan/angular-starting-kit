import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthError } from '@core/auth/auth.models';
import { AuthService } from '@core/auth/auth.service';
import { MOCK_ACCOUNTS } from '@core/auth/mock/mock-users';
import { ConfigService } from '@core/config/config.service';

const DEFAULT_REDIRECT = '/dashboard';

/** Only same-origin paths: blocks open redirects like `?returnUrl=//evil.com`. */
export function safeReturnUrl(url: string | undefined): string {
  return url?.startsWith('/') && !url.startsWith('//') ? url : DEFAULT_REDIRECT;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly config = inject(ConfigService);

  /** Bound from `?returnUrl=` (withComponentInputBinding). */
  readonly returnUrl = input<string>();

  protected readonly appName = this.config.get('appName');
  protected readonly loginMode = this.auth.loginMode;
  protected readonly demoAccounts =
    this.config.get('auth').provider === 'mock' ? MOCK_ACCOUNTS : [];
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    if (this.loginMode === 'credentials' && this.form.invalid) {
      this.form.markAllAsTouched();
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
          ? 'Invalid email or password.'
          : 'Sign-in failed. Please try again.',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  protected fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
    this.error.set(null);
  }

  protected showError(control: 'email' | 'password', error: string): boolean {
    const c = this.form.controls[control];
    return c.touched && c.hasError(error);
  }
}
