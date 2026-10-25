import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from '@shared/ui/button/button';
import { LanguageSelect } from '../language-select/language-select';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-header',
  imports: [RouterLink, TranslocoPipe, Button, LanguageSelect, ThemeToggle],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(AuthService);

  readonly appName = input.required<string>();
  readonly menuOpen = input(false);
  readonly menuToggle = output();

  protected readonly user = this.auth.user;

  protected logout(): void {
    void this.auth.logout();
  }
}
