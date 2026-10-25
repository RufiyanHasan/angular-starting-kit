import { ACCOUNTS, expect, login, test } from './fixtures';

test.describe('authentication', () => {
  test('redirects a protected URL to login and comes back after sign-in @mobile', async ({
    page,
  }) => {
    await page.goto('/users?status=inactive');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fusers%3Fstatus%3Dinactive/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await page.getByLabel('Email').fill(ACCOUNTS.admin.email);
    await page.getByLabel('Password').fill(ACCOUNTS.admin.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/users?status=inactive');
    await expect(page.getByRole('heading', { name: 'Users', level: 1 })).toBeVisible();
  });

  test('validates the form and focuses the first invalid field', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeFocused();
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(ACCOUNTS.admin.email);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Invalid' })).toHaveText(
      'Invalid email or password.',
    );
    await expect(page).toHaveURL('/login');
  });

  test('keeps the session across reloads and signs out', async ({ page }) => {
    await login(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(ACCOUNTS.admin.name)).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fdashboard/);
  });

  test('sends signed-in users away from the login page', async ({ page }) => {
    await login(page);
    await page.goto('/login');
    await expect(page).toHaveURL('/dashboard');
  });

  test('refreshes an expired access token silently', async ({ page }) => {
    await login(page);
    // Make the stored access token look expired; the next API call gets a 401 → refresh → retry.
    await page.evaluate(() => {
      const key = 'app.mock-auth.session';
      const stored = JSON.parse(localStorage.getItem(key)!);
      const [header, , signature] = stored.session.accessToken.split('.');
      const payload = { sub: 'u-1', iat: 1, exp: 2, roles: ['admin', 'user'] };
      const body = btoa(JSON.stringify(payload)).replace(/=+$/, '');
      stored.session.accessToken = [header, body, signature].join('.');
      localStorage.setItem(key, JSON.stringify(stored));
    });
    await page.reload();
    await expect(page.getByRole('definition').filter({ hasText: /^\s*42\s*$/ })).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });

  test('non-admins get the 403 page for admin routes', async ({ page }) => {
    await login(page, 'user');
    await page.goto('/users/new');
    await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
  });
});
