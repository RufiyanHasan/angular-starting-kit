import { demoHandlers } from './handlers/demo.handlers';
import { usersHandlers } from './handlers/users.handlers';

/**
 * All mock API handlers. `base` is `config.json → apiBaseUrl`, so mocks follow the config.
 * To mock a new endpoint: add `handlers/<resource>.handlers.ts` and spread it in here.
 */
export function createHandlers(base: string, { latencyMs = 300 } = {}) {
  const root = base.replace(/\/+$/, '');
  return [...usersHandlers(root, latencyMs), ...demoHandlers(root)];
}
