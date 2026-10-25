import { expect, expectNoA11yViolations, login, setPreferences, test } from './fixtures';

/** axe on every page type, in both themes. The mobile project runs these too (@mobile). */
for (const theme of ['light', 'dark'] as const) {
  test.describe(`accessibility (${theme}) @mobile`, () => {
    test.beforeEach(({ page }) => setPreferences(page, { theme }));

    test('login, including validation errors', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
      await expectNoA11yViolations(page);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByText('Email is required.')).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test('dashboard, settings and 404', async ({ page }) => {
      await login(page);
      await expect(page.getByRole('definition').filter({ hasText: /^\s*42\s*$/ })).toBeVisible();
      await expectNoA11yViolations(page);
      await page.goto('/settings');
      await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
      await expectNoA11yViolations(page);
      await page.goto('/does-not-exist');
      await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
      await expectNoA11yViolations(page);
    });

    test('users list, detail, form and confirm dialog', async ({ page }) => {
      await login(page);
      await page.goto('/users');
      await expect(page.getByText('1–10 of 42')).toBeVisible();
      await expectNoA11yViolations(page);

      await page.locator('tbody a').first().click();
      await expect(page.getByRole('link', { name: 'Edit', exact: true })).toBeVisible();
      await expectNoA11yViolations(page);

      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expectNoA11yViolations(page);
      await page.keyboard.press('Escape');

      await page.getByRole('link', { name: 'Edit', exact: true }).click();
      await page.getByLabel('Name').fill('');
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByText('Name is required.')).toBeVisible();
      await expectNoA11yViolations(page);
    });
  });
}

test('keyboard: skip link moves focus to the main content', async ({ page }) => {
  await login(page);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
