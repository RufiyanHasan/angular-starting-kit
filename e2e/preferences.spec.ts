import { expect, login, test } from './fixtures';

test('theme: toggles, persists and applies before boot', async ({ page }) => {
  await page.goto('/login');
  const html = page.locator('html');
  await page.getByRole('button', { name: /^Theme: System/ }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /^Theme: Light/ }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');

  // The inline script in index.html sets the attribute before Angular runs.
  await page.route('**/*.js', (route) =>
    route.request().url().includes('/main-') ? route.abort() : route.continue(),
  );
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('language: switches at runtime, persists, and translates titles @mobile', async ({ page }) => {
  await login(page);
  await page.goto('/settings');
  await page.getByLabel('Language', { exact: true }).last().selectOption('es');

  await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page).toHaveTitle('Configuración · Angular Starter Kit');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Configuración', level: 1 })).toBeVisible();
  await page.goto('/users');
  await expect(page.getByText('1–10 de 42')).toBeVisible();
});
