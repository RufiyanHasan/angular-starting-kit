import { InjectionToken } from '@angular/core';

/**
 * Starts the in-browser mock API. Provided in app.config.ts as a lazy import, so the mock
 * code is only downloaded when `config.json → mockApi` is true.
 */
export type MockBackendStarter = (apiBaseUrl: string) => Promise<void>;

export const MOCK_BACKEND = new InjectionToken<MockBackendStarter>('MOCK_BACKEND');
