import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  template: `
    <section class="forbidden">
      <p class="code" aria-hidden="true">403</p>
      <h1>Access denied</h1>
      <p>You don't have permission to view this page.</p>
      <a routerLink="/">Go to the dashboard</a>
    </section>
  `,
  styles: `
    .forbidden {
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
export class Forbidden {}
