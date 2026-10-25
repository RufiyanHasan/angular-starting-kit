import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink, TranslocoPipe],
  template: `
    <section class="forbidden">
      <p class="code" aria-hidden="true">403</p>
      <h1>{{ 'titles.forbidden' | transloco }}</h1>
      <p>{{ 'errors.forbiddenPage.text' | transloco }}</p>
      <a routerLink="/">{{ 'errors.forbiddenPage.back' | transloco }}</a>
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
