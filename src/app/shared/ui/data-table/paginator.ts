import { Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

export interface PageChange {
  readonly page: number;
  readonly pageSize: number;
}

/** Previous / next paging with a "1–10 of 42" summary. Pages are 1-based. */
@Component({
  selector: 'app-paginator',
  imports: [TranslocoPipe, Button, Icon],
  template: `
    <nav class="paginator" [attr.aria-label]="'ui.paginator.label' | transloco">
      @if (pageSizeOptions().length) {
        <label class="size">
          <span class="size-label">{{ 'ui.paginator.pageSize' | transloco }}</span>
          <select class="app-input" (change)="changeSize($event)">
            @for (size of pageSizeOptions(); track size) {
              <option [value]="size" [selected]="size === pageSize()">{{ size }}</option>
            }
          </select>
        </label>
      }
      <p class="range" aria-live="polite">{{ 'ui.paginator.range' | transloco: range() }}</p>
      <span class="buttons">
        <button
          appButton
          type="button"
          variant="ghost"
          size="icon"
          [disabled]="page() <= 1"
          [attr.aria-label]="'ui.paginator.previous' | transloco"
          (click)="go(page() - 1)"
        >
          <app-icon name="chevron-left" />
        </button>
        <button
          appButton
          type="button"
          variant="ghost"
          size="icon"
          [disabled]="page() >= lastPage()"
          [attr.aria-label]="'ui.paginator.next' | transloco"
          (click)="go(page() + 1)"
        >
          <app-icon name="chevron-right" />
        </button>
      </span>
    </nav>
  `,
  styles: `
    .paginator {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-2) var(--space-4);
      padding: var(--space-2) 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    .size {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      select {
        width: auto;
        min-height: 2rem;
        padding-block: var(--space-1);
      }
    }
    .range {
      margin: 0;
    }
    .buttons {
      display: inline-flex;
    }
    /* Phones: keep one row; the label stays available to screen readers. */
    @media (max-width: 479.98px) {
      .size-label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }
    }
  `,
})
export class Paginator {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>([]);
  readonly pageChange = output<PageChange>();

  protected readonly lastPage = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  protected readonly range = computed(() => {
    const total = this.total();
    if (total === 0) return { from: 0, to: 0, total };
    const from = (this.page() - 1) * this.pageSize() + 1;
    return { from, to: Math.min(from + this.pageSize() - 1, total), total };
  });

  protected go(page: number): void {
    this.pageChange.emit({ page, pageSize: this.pageSize() });
  }

  protected changeSize(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);
    this.pageChange.emit({ page: 1, pageSize });
  }
}
