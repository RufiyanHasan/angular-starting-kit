import { setupWorker } from 'msw/browser';
import { db } from './db';
import { createHandlers } from './handlers';

/** Registers the MSW service worker. Requests that don't match a handler go to the network. */
export async function startMockApi(apiBaseUrl: string): Promise<void> {
  const worker = setupWorker(...createHandlers(apiBaseUrl));
  await worker.start({
    serviceWorker: { url: new URL('mockServiceWorker.js', document.baseURI).pathname },
    onUnhandledFrame: 'bypass',
    quiet: true,
  });
  // Hook for e2e tests to reset data between specs.
  (globalThis as { __mockDb?: typeof db }).__mockDb = db;
  console.warn(`[mock API] Serving ${apiBaseUrl}/* from the browser (config.json → mockApi: true)`);
}
