import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  output,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { EmptyState } from '../empty-state/empty-state';
import { Icon, type IconName } from '../icon/icon';
import { Skeleton } from '../skeleton/skeleton';

export interface TableColumn<T> {
  readonly key: string;
  /** Already-translated header text. */
  readonly header: string;
  readonly sortable?: boolean;
  /** Plain-text cell value; defaults to `row[key]`. Use an `appCell` template for markup. */
  readonly value?: (row: T) => unknown;
  readonly align?: 'start' | 'end';
  /** Hide this column below 768px. */
  readonly hideOnMobile?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface Sort {
  readonly active: string;
  readonly direction: SortDirection;
}

/**
 * Custom cell markup for one column. `appCellOf` is only there so `let-row` is typed:
 *
 *   <ng-template appCell="name" [appCellOf]="users()" let-user>
 *     <a [routerLink]="[user.id]">{{ user.name }}</a>
 *   </ng-template>
 */
@Directive({ selector: 'ng-template[appCell]' })
export class CellDef<T> {
  /** Column key this template renders. */
  readonly appCell = input.required<string>();
  readonly appCellOf = input<readonly T[]>();
  readonly template = inject<TemplateRef<{ $implicit: T }>>(TemplateRef);

  static ngTemplateContextGuard<T>(_dir: CellDef<T>, _ctx: unknown): _ctx is { $implicit: T } {
    return true;
  }
}

let nextId = 0;

/**
 * Accessible data table: real <table> semantics, a caption, `aria-sort` on sortable headers,
 * skeleton rows while loading and an empty state. Stateless: the parent owns rows, sort and
 * paging (pair it with <app-paginator>), so it works with server- or client-side data.
 */
@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet, TranslocoPipe, Icon, Skeleton, EmptyState],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
})
export class DataTable<T> {
  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly trackBy = input.required<(row: T) => unknown>();
  /** Accessible name of the table (visually hidden). */
  readonly caption = input.required<string>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly sort = input<Sort | null>(null);
  readonly emptyHeading = input<string>();
  readonly emptyDescription = input<string>();
  readonly sortChange = output<Sort>();

  private readonly cellDefs = contentChildren(CellDef);
  protected readonly templates = computed(
    () => new Map(this.cellDefs().map((def) => [def.appCell(), def.template])),
  );
  protected readonly captionId = `table-caption-${++nextId}`;
  protected readonly skeletonRows = [1, 2, 3, 4, 5];

  protected value(row: T, column: TableColumn<T>): unknown {
    return column.value ? column.value(row) : (row as Record<string, unknown>)[column.key];
  }

  protected ariaSort(column: TableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) return null;
    const sort = this.sort();
    if (sort?.active !== column.key) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIcon(column: TableColumn<T>): IconName {
    const state = this.ariaSort(column);
    return state === 'ascending'
      ? 'chevron-up'
      : state === 'descending'
        ? 'chevron-down'
        : 'chevrons-up-down';
  }

  protected toggleSort(column: TableColumn<T>): void {
    const sort = this.sort();
    const direction = sort?.active === column.key && sort.direction === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ active: column.key, direction });
  }
}
