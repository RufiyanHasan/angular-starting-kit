import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConfirmService } from '@shared/ui/confirm-dialog/confirm.service';
import { ToastService } from '@shared/ui/toast/toast.service';
import { db } from '../../../../mocks/db';
import { useMockApi } from '../../../../mocks/testing';
import { setupUsersFeature } from '../testing';

describe('UserList', () => {
  useMockApi();

  const rows = (el: HTMLElement) => [...el.querySelectorAll('tbody tr')];
  const names = (el: HTMLElement) =>
    [...el.querySelectorAll('tbody td a.name')].map((a) => a.textContent?.trim());

  it('shows the first page sorted by name, with admin actions', async () => {
    const { el } = await setupUsersFeature('/users');
    expect(el().querySelector('h1')?.textContent).toContain('Users');
    expect(rows(el())).toHaveLength(10);
    expect(names(el())).toEqual([...names(el())].sort((a, b) => a!.localeCompare(b!)));
    expect(el().querySelector('.range')?.textContent).toContain('1–10 of 42');
    expect(el().querySelector('a[href="/users/new"]')).not.toBeNull();
    expect(el().querySelector('[aria-label^="Delete "]')).not.toBeNull();
  });

  it('is read-only for non-admins', async () => {
    const { el } = await setupUsersFeature('/users', ['user']);
    expect(el().textContent).toContain('Only admins can create');
    expect(el().querySelector('a[href="/users/new"]')).toBeNull();
    expect(el().querySelector('[aria-label^="Delete "]')).toBeNull();
  });

  it('reads page, sort and filters from the URL', async () => {
    const { el } = await setupUsersFeature(
      '/users?page=2&pageSize=25&status=inactive&sort=name&order=desc',
    );
    const range = el().querySelector('.range')?.textContent ?? '';
    expect(range).toMatch(/of \d+/);
    expect(el().querySelector<HTMLSelectElement>('#users-status')?.value).toBe('inactive');
    expect(el().querySelector('th[aria-sort="descending"]')?.textContent).toContain('Name');
    expect(el().querySelectorAll('.badge[data-tone="success"]')).toHaveLength(0);
  });

  it('writes sort, filter, paging and (debounced) search to the URL', async () => {
    const { el, settle } = await setupUsersFeature('/users');
    const router = TestBed.inject(Router);

    el().querySelector<HTMLButtonElement>('th button')!.click(); // name: asc → desc
    await settle();
    expect(router.url).toBe('/users?order=desc');

    const role = el().querySelector<HTMLSelectElement>('#users-role')!;
    role.value = 'admin';
    role.dispatchEvent(new Event('change'));
    await settle();
    expect(router.url).toContain('role=admin');
    expect(el().textContent).toContain('Clear filters');

    vi.useFakeTimers();
    const search = el().querySelector<HTMLInputElement>('#users-search')!;
    search.value = 'ada';
    search.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    await settle();
    expect(router.url).toContain('q=ada');

    [...el().querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Clear filters'))!
      .click();
    await settle();
    expect(router.url).toBe('/users?order=desc');
  });

  it('shows an empty state when nothing matches', async () => {
    const { el } = await setupUsersFeature('/users?q=nobody-matches-this');
    expect(el().querySelector('app-empty-state')?.textContent).toContain('No users found');
    expect(el().querySelector('app-empty-state')?.textContent).toContain('clear the filters');
  });

  it('moves to the last page when the requested page is past the end', async () => {
    await setupUsersFeature('/users?page=99');
    expect(TestBed.inject(Router).url).toBe('/users?page=5');
  });

  it('deletes after confirmation', async () => {
    const { el, settle } = await setupUsersFeature('/users');
    const confirm = vi.spyOn(TestBed.inject(ConfirmService), 'confirm').mockResolvedValue(true);
    const success = vi.spyOn(TestBed.inject(ToastService), 'success');
    const first = names(el())[0]!;
    const id = el().querySelector('tbody a.name')!.getAttribute('href')!.split('/').pop();

    el().querySelector<HTMLButtonElement>(`[aria-label="Delete ${first}"]`)!.click();
    await settle();
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ danger: true }));
    expect(success).toHaveBeenCalledWith(`${first} was deleted.`);
    expect(db.users.some((u) => u.id === id)).toBe(false);
    expect(el().querySelector(`a[href="/users/${id}"]`)).toBeNull();
    expect(el().querySelector('.range')?.textContent).toContain('of 41');
  });

  it('keeps the user when the confirmation is cancelled', async () => {
    const { el, settle } = await setupUsersFeature('/users');
    vi.spyOn(TestBed.inject(ConfirmService), 'confirm').mockResolvedValue(false);
    const first = names(el())[0]!;
    el().querySelector<HTMLButtonElement>(`[aria-label="Delete ${first}"]`)!.click();
    await settle();
    expect(db.users).toHaveLength(42);
  });
});
