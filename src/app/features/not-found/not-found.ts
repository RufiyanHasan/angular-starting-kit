import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslocoPipe],
  template: `
    <section class="not-found">
      <p class="code" aria-hidden="true">404</p>
      <h1>{{ 'titles.notFound' | transloco }}</h1>
      <p>{{ 'errors.notFoundPage.text' | transloco }}</p>
      <a routerLink="/">{{ 'errors.notFoundPage.back' | transloco }}</a>
    </section>
  `,
  styles: `
    .not-found {
      max-width: 32rem;
      margin: var(--space-8) auto;
      text-align: center;
    }
    .code {
      margin: 0;
      font-size: 4rem;
      font-weight: 700;
      color: var(--color-text-muted);
    }
  `,
})
export class NotFound {}
