import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { filter, map } from 'rxjs';

/** Thin bar at the top of the page while a navigation (incl. lazy chunk loading) is pending. */
@Component({
  selector: 'app-route-loading-bar',
  template: `
    @if (loading()) {
      <div class="bar" role="progressbar" aria-label="Loading page"></div>
    }
  `,
  styleUrl: './route-loading-bar.scss',
})
export class RouteLoadingBar {
  protected readonly loading = toSignal(
    inject(Router).events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError,
      ),
      map((e) => e instanceof NavigationStart),
    ),
    { initialValue: false },
  );
}
