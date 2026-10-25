import { Component, input } from '@angular/core';
import { Icon, type IconName } from '../icon/icon';

/**
 * "Nothing here yet" block. Project call-to-action buttons as content.
 *
 *   <app-empty-state heading="No users" description="Try a different search.">
 *     <button appButton (click)="clear()">Clear filters</button>
 *   </app-empty-state>
 */
@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  template: `
    <app-icon class="icon" [name]="icon()" [size]="40" />
    <p class="heading">{{ heading() }}</p>
    @if (description()) {
      <p class="description">{{ description() }}</p>
    }
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: grid;
      justify-items: center;
      gap: var(--space-2);
      padding: var(--space-8) var(--space-4);
      text-align: center;
    }
    .icon {
      color: var(--color-text-muted);
    }
    .heading {
      margin: 0;
      font-weight: 600;
      font-size: var(--font-size-lg);
    }
    .description {
      margin: 0;
      max-width: 36ch;
      color: var(--color-text-muted);
    }
    .actions:not(:empty) {
      margin-top: var(--space-2);
    }
  `,
})
export class EmptyState {
  readonly heading = input.required<string>();
  readonly description = input<string>();
  readonly icon = input<IconName>('inbox');
}
