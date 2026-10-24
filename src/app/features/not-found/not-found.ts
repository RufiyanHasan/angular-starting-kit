import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <p class="code" aria-hidden="true">404</p>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or has moved.</p>
      <a routerLink="/">Go to the dashboard</a>
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
