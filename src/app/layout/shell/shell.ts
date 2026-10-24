import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ConfigService } from '@core/config/config.service';
import { filter } from 'rxjs';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { RouteLoadingBar } from '../route-loading-bar/route-loading-bar';
import { Sidebar } from '../sidebar/sidebar';

/** Authenticated app chrome. Feature routes render inside its <router-outlet>. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Header, Sidebar, Footer, RouteLoadingBar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  host: { '(document:keydown.escape)': 'closeMenu()' },
})
export class Shell {
  protected readonly appName = inject(ConfigService).get('appName');
  protected readonly menuOpen = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenu());
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
