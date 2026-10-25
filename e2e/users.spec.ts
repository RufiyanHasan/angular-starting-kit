import { type Page } from '@playwright/test';
import { expect, login, test } from './fixtures';

const rows = (page: Page) => page.locator('tbody tr');

test.describe('users CRUD (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/users');
    await expect(page.getByText('1–10 of 42')).toBeVisible();
  });

  test('lists, searches, filters, sorts and pages via the URL @mobile', async ({ page }) => {
    await expect(rows(page)).toHaveCount(10);

    await page.getByLabel('Search').fill('grace');
    await expect(page).toHaveURL(/q=grace/);
    await expect(page.getByText('1–4 of 4')).toBeVisible();

    await page.getByLabel('Search').fill('');
    await page.getByLabel('Role').selectOption('admin');
    await expect(page).toHaveURL(/role=admin/);
    await expect(rows(page).getByText('User', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page).toHaveURL('/users');

    await page.getByRole('button', { name: 'Name' }).click();
    await expect(page.locator('th[aria-sort="descending"]')).toContainText('Name');
    await expect(page).toHaveURL('/users?order=desc');

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('11–20 of 42')).toBeVisible();

    await page.goBack();
    await expect(page.getByText('1–10 of 42')).toBeVisible();
  });

  test('creates, views, edits and deletes a user', async ({ page }) => {
    // Create (with a server-side validation error first)
    await page.getByRole('link', { name: 'New user' }).click();
    await page.getByLabel('Name').fill('Edsger Dijkstra');
    await page.getByLabel('Email').fill('ada.lovelace1@example.com');
    await page.getByRole('button', { name: 'Create user' }).click();
    await expect(page.getByText('This email is already in use.')).toBeVisible();
    await page.getByLabel('Email').fill('edsger@example.com');
    await page.getByLabel('Role').selectOption('admin');
    await page.getByRole('button', { name: 'Create user' }).click();

    // Detail
    await expect(page).toHaveURL(/\/users\/u-[\w-]+$/);
    await expect(page.getByRole('heading', { name: 'Edsger Dijkstra', level: 1 })).toBeVisible();
    await expect(page.getByText('Edsger Dijkstra was created.')).toBeVisible();
    await expect(page.getByText('edsger@example.com')).toBeVisible();
    const detailUrl = page.url();

    // Edit
    await page.getByRole('link', { name: 'Edit', exact: true }).click();
    await expect(page.getByLabel('Name')).toHaveValue('Edsger Dijkstra');
    await page.getByLabel('Name').fill('Edsger W. Dijkstra');
    await page.getByLabel('Inactive').check();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page).toHaveURL(detailUrl);
    await expect(page.getByRole('heading', { name: 'Edsger W. Dijkstra', level: 1 })).toBeVisible();
    await expect(page.getByText('Inactive')).toBeVisible();

    // Delete (cancel first, then confirm)
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete user?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await dialog.getByRole('button', { name: 'Delete user' }).click();
    await expect(page).toHaveURL('/users');
    await expect(page.getByText('Edsger W. Dijkstra was deleted.')).toBeVisible();
    await expect(page.getByText('1–10 of 42')).toBeVisible();
  });

  test('deletes from the list', async ({ page }) => {
    const first = rows(page).first().getByRole('link').first();
    const name = (await first.textContent())!.trim();
    await page.getByRole('button', { name: `Delete ${name}` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete user' }).click();
    await expect(page.getByText(`${name} was deleted.`)).toBeVisible();
    await expect(page.getByText('1–10 of 41')).toBeVisible();
  });

  test('warns before leaving a form with unsaved changes', async ({ page }) => {
    await rows(page).first().getByRole('link').first().click();
    await page.getByRole('link', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Name').fill('Unsaved name');

    await page.getByRole('link', { name: 'Dashboard' }).click();
    const dialog = page.getByRole('dialog', { name: 'Discard changes?' });
    await dialog.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page).toHaveURL(/\/edit$/);

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await dialog.getByRole('button', { name: 'Discard changes' }).click();
    await expect(page).toHaveURL('/dashboard');
  });
});

test('regular users can browse but not change users', async ({ page }) => {
  await login(page, 'user');
  await page.goto('/users');
  await expect(page.getByText('Only admins can create, edit or delete them.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'New user' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Delete / })).toHaveCount(0);

  await rows(page).first().getByRole('link').first().click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
});
