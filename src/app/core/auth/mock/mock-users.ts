import { type User } from '../auth.models';

export interface MockAccount {
  readonly user: User;
  readonly password: string;
}

/** Demo accounts for the mock provider. Shown on the login page when the mock provider is active. */
export const MOCK_ACCOUNTS: readonly MockAccount[] = [
  {
    user: { id: 'u-1', name: 'Ada Admin', email: 'admin@example.com', roles: ['admin', 'user'] },
    password: 'admin123',
  },
  {
    user: { id: 'u-2', name: 'Uma User', email: 'user@example.com', roles: ['user'] },
    password: 'user123',
  },
];
