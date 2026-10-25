import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;
const CI = !!process.env['CI'];
/** Point the suite at an already running app (e.g. the Docker image) instead of starting one. */
const BASE_URL = process.env['E2E_BASE_URL'];

/**
 * E2E against a production build served by the Angular dev server, with the in-browser mock
 * API (config.json → mockApi: true), so no backend is needed. Mock data resets on every page
 * load, so tests are independent and can run in parallel.
 *
 *   npm run e2e                                      # starts its own server on :4300
 *   E2E_BASE_URL=http://localhost:8080 npm run e2e   # against a running container
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL ?? `http://localhost:${PORT}`,
    locale: 'en-US',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Phone layout (off-canvas nav, hidden columns): accessibility and the core journeys.
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: BASE_URL
    ? undefined
    : {
        command: `npx ng serve --configuration production --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !CI,
        timeout: 180_000,
      },
});
