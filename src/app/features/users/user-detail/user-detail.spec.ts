import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConfirmService } from '@shared/ui/confirm-dialog/confirm.service';
import { db } from '../../../../mocks/db';
import { useMockApi } from '../../../../mocks/testing';
import { setupUsersFeature } from '../testing';

describe('UserDetail', () => {
  useMockApi();

  it('shows the user with admin actions', async () => {
    const user = db.users[0]!;
    const { el } = await setupUsersFeature(`/users/${user.id}`);
    expect(el().querySelector('h1')?.textContent).toContain(user.name);
    expect(el().textContent).toContain(user.email);
    expect(el().querySelector('a[href$="/edit"]')).not.toBeNull();
  });

  it('hides actions for non-admins', async () => {
    const { el } = await setupUsersFeature(`/users/${db.users[0]!.id}`, ['user']);
    expect(el().querySelector('a[href$="/edit"]')).toBeNull();
  });

  it('shows a not-found state for unknown ids', async () => {
    const { el } = await setupUsersFeature('/users/u-missing');
    expect(el().querySelector('app-empty-state')?.textContent).toContain('User not found');
  });

  it('links back to the list page the user came from', async () => {
    const { el, harness, settle } = await setupUsersFeature('/users?page=2&q=a');
    await harness.navigateByUrl(`/users/${db.users[0]!.id}`);
    await settle();
    expect(el().querySelector('a.back')?.getAttribute('href')).toBe('/users?page=2&q=a');
  });

  it('deletes and returns to the list', async () => {
    const user = db.users[0]!;
    const { el, settle } = await setupUsersFeature(`/users/${user.id}`);
    vi.spyOn(TestBed.inject(ConfirmService), 'confirm').mockResolvedValue(true);
    [...el().querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Delete'))!
      .click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/users');
    expect(db.users.some((u) => u.id === user.id)).toBe(false);
  });
});
