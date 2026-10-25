import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConfirmService } from '@shared/ui/confirm-dialog/confirm.service';
import { db } from '../../../../mocks/db';
import { useMockApi } from '../../../../mocks/testing';
import { setupUsersFeature } from '../testing';

describe('UserEdit', () => {
  useMockApi();

  const type = (el: HTMLElement, selector: string, value: string) => {
    const input = el.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  };
  const submit = (el: HTMLElement) =>
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();

  it('validates on submit and focuses the first invalid field', async () => {
    const { el, settle } = await setupUsersFeature('/users/new');
    submit(el());
    await settle();
    expect(el().querySelector('#user-name-error')?.textContent).toContain('Name is required');
    expect(el().querySelector('#user-email-error')?.textContent).toContain('Email is required');
    expect(document.activeElement?.id).toBe('user-name');
  });

  it('creates a user and opens it', async () => {
    const { el, settle } = await setupUsersFeature('/users/new');
    type(el(), '#user-name', 'Zed Shaw');
    type(el(), '#user-email', 'zed@example.com');
    submit(el());
    await settle();
    const created = db.users.find((u) => u.email === 'zed@example.com');
    expect(created).toBeDefined();
    expect(TestBed.inject(Router).url).toBe(`/users/${created!.id}`);
  });

  it('shows server field errors (422) on the right field', async () => {
    const { el, settle } = await setupUsersFeature('/users/new');
    type(el(), '#user-name', 'Copy Cat');
    type(el(), '#user-email', db.users[1]!.email);
    submit(el());
    await settle();
    expect(el().querySelector('[role="alert"]')?.textContent).toContain('fix the highlighted');
    expect(el().querySelector('#user-email-error')?.textContent).toContain('already in use');
    expect(el().querySelector('#user-email')?.getAttribute('aria-invalid')).toBe('true');

    type(el(), '#user-email', 'unique@example.com'); // editing clears the server error
    await settle();
    expect(el().querySelector('#user-email-error')?.textContent?.trim()).toBe('');
  });

  it('loads an existing user, saves changes and returns to the detail page', async () => {
    const user = db.users[0]!;
    const { el, settle } = await setupUsersFeature(`/users/${user.id}/edit`);
    expect(el().querySelector<HTMLInputElement>('#user-name')?.value).toBe(user.name);

    type(el(), '#user-name', 'Renamed Person');
    submit(el());
    await settle();
    expect(db.users.find((u) => u.id === user.id)?.name).toBe('Renamed Person');
    expect(TestBed.inject(Router).url).toBe(`/users/${user.id}`);
  });

  it('asks before discarding unsaved changes', async () => {
    const user = db.users[0]!;
    const { el, harness, settle } = await setupUsersFeature(`/users/${user.id}/edit`);
    const confirm = vi.spyOn(TestBed.inject(ConfirmService), 'confirm').mockResolvedValue(false);
    type(el(), '#user-name', 'Half-typed');

    await harness.navigateByUrl('/users');
    await settle();
    expect(confirm).toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe(`/users/${user.id}/edit`);

    confirm.mockResolvedValue(true);
    await harness.navigateByUrl('/users');
    expect(TestBed.inject(Router).url).toBe('/users');
  });

  it('is admin-only', async () => {
    await setupUsersFeature('/users/new', ['user']);
    expect(TestBed.inject(Router).url).toBe('/forbidden');
  });
});
