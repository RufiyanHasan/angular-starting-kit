import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { LoadingService } from '@core/http/loading.service';
import { filter, map } from 'rxjs';

/** Thin bar at the top of the page while a navigation or an HTTP request is pending. */
@Component({
  selector: 'app-route-loading-bar',
  template: `
    @if (loading()) {
      <div class="bar" role="progressbar" aria-label="Loading"></div>
    }
  `,
  styleUrl: './route-loading-bar.scss',
})
export class RouteLoadingBar {
  private readonly navigating = toSignal(
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
  private readonly http = inject(LoadingService).isLoading;

  protected readonly loading = computed(() => this.navigating() || this.http());
}
