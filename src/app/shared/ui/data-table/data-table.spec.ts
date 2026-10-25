import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CellDef, DataTable, type Sort, type TableColumn } from './data-table';
import { type PageChange, Paginator } from './paginator';

interface Row {
  id: number;
  name: string;
  age: number;
}

@Component({
  imports: [DataTable, CellDef, Paginator],
  template: `
    <app-data-table
      caption="People"
      [rows]="rows()"
      [columns]="columns"
      [trackBy]="trackById"
      [loading]="loading()"
      [sort]="sort()"
      (sortChange)="sort.set($event)"
    >
      <ng-template appCell="name" [appCellOf]="rows()" let-row>
        <strong>{{ row.name.toUpperCase() }}</strong>
      </ng-template>
    </app-data-table>
    <app-paginator
      [page]="page()"
      [pageSize]="2"
      [total]="5"
      [pageSizeOptions]="[2, 10]"
      (pageChange)="change = $event"
    />
  `,
})
class Host {
  readonly rows = signal<Row[]>([
    { id: 1, name: 'Ada', age: 36 },
    { id: 2, name: 'Linus', age: 54 },
  ]);
  readonly loading = signal(false);
  readonly sort = signal<Sort | null>(null);
  readonly page = signal(1);
  change: PageChange | null = null;
  readonly columns: TableColumn<Row>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'age', header: 'Age', align: 'end', value: (r) => `${r.age} y` },
  ];
  readonly trackById = (r: Row) => r.id;
}

describe('DataTable + Paginator', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('renders caption, cell templates and value functions', async () => {
    const { el } = await setup();
    expect(el.querySelector('caption')?.textContent).toContain('People');
    const cells = [...el.querySelectorAll('tbody td')].map((td) => td.textContent?.trim());
    expect(cells).toEqual(['ADA', '36 y', 'LINUS', '54 y']);
  });

  it('cycles sort and reflects it in aria-sort', async () => {
    const { fixture, host, el } = await setup();
    const th = () => el.querySelector('th')!;
    expect(th().getAttribute('aria-sort')).toBe('none');
    expect(el.querySelectorAll('th')[1]?.hasAttribute('aria-sort')).toBe(false);

    th().querySelector('button')!.click();
    await fixture.whenStable();
    expect(host.sort()).toEqual({ active: 'name', direction: 'asc' });
    expect(th().getAttribute('aria-sort')).toBe('ascending');

    th().querySelector('button')!.click();
    await fixture.whenStable();
    expect(th().getAttribute('aria-sort')).toBe('descending');
  });

  it('shows skeleton rows while loading the first page, and an empty state', async () => {
    const { fixture, host, el } = await setup();
    host.rows.set([]);
    host.loading.set(true);
    await fixture.whenStable();
    expect(el.querySelectorAll('app-skeleton').length).toBe(10);
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Loading');

    host.loading.set(false);
    await fixture.whenStable();
    expect(el.querySelector('app-empty-state')?.textContent).toContain('No results');
  });

  it('paginates', async () => {
    const { fixture, host, el } = await setup();
    const [prev, next] = [...el.querySelectorAll<HTMLButtonElement>('app-paginator button')];
    expect(el.querySelector('app-paginator .range')?.textContent).toContain('1–2 of 5');
    expect(prev?.disabled).toBe(true);

    next!.click();
    expect(host.change).toEqual({ page: 2, pageSize: 2 });

    host.page.set(3);
    await fixture.whenStable();
    expect(el.querySelector('app-paginator .range')?.textContent).toContain('5–5 of 5');
    expect(next?.disabled).toBe(true);

    const select = el.querySelector<HTMLSelectElement>('app-paginator select')!;
    select.value = '10';
    select.dispatchEvent(new Event('change'));
    expect(host.change).toEqual({ page: 1, pageSize: 10 });
  });
});
