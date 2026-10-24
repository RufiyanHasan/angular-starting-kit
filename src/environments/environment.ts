import { type Environment } from './environment.model';

/**
 * Build-time flags only. Anything that differs per deployment (API URL, feature flags, auth
 * settings) belongs in the runtime config `public/assets/config.json`, so one build serves every env.
 */
export const environment: Environment = {
  production: true,
};
