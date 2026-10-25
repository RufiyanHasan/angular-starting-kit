import { AxeBuilder } from '@axe-core/playwright';
import { type Page, expect, test as base } from '@playwright/test';

export const ACCOUNTS = {
  admin: { email: 'admin@example.com', password: 'admin123', name: 'Ada Admin' },
  user: { email: 'user@example.com', password: 'user123', name: 'Uma User' },
} as const;

export type AccountName = keyof typeof ACCOUNTS;

/** Signs in through the real login form and waits for the dashboard. */
export async function login(page: Page, account: AccountName = 'admin'): Promise<void> {
  const { email, password } = ACCOUNTS[account];
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Fails with a readable list if axe finds WCAG 2.1 A/AA or best-practice violations. */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  // Let colour transitions (theme switch) and enter animations finish before measuring.
  await page.waitForTimeout(250);
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );
  expect(summary).toEqual([]);
}

/** Sets the persisted theme/language before the app boots (as a returning visitor would). */
export async function setPreferences(
  page: Page,
  prefs: { theme?: 'light' | 'dark' | 'system'; lang?: string },
): Promise<void> {
  await page.addInitScript((p) => {
    if (p.theme) localStorage.setItem('app.theme', JSON.stringify(p.theme));
    if (p.lang) localStorage.setItem('app.lang', JSON.stringify(p.lang));
  }, prefs);
}

export const test = base;
export { expect };
