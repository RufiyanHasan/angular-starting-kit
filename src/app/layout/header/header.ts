import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
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
