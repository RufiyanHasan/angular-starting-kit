import { setupServer } from 'msw/node';
import { createUnsignedJwt } from '../app/core/auth/jwt';
import { db } from './db';
import { createHandlers } from './handlers';

/** Absolute, because Node's fetch can't resolve relative URLs. Use it as `apiBaseUrl` in tests. */
export const TEST_API_BASE = 'http://localhost/api';

/**
 * Runs the real mock API handlers under Node (msw/node) for the calling spec file, so tests
 * exercise HttpClient, interceptors and the API contract end to end. Resets the DB per test.
 */
export function useMockApi() {
  const server = setupServer(...createHandlers(TEST_API_BASE, { latencyMs: 0 }));
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  beforeEach(() => db.reset());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  return server;
}

/** A token the mock API accepts. */
export function testToken(roles: readonly string[], expiresInS = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  return createUnsignedJwt({ sub: 'u-test', iat: now, exp: now + expiresInS, roles: [...roles] });
}
