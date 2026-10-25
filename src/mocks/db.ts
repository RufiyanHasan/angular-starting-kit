import { type MockUser, seedUsers } from './data/users';

/** In-memory tables. Reset on page reload (keeps demos and e2e runs deterministic). */
export const db = {
  users: seedUsers(),
  reset(): void {
    this.users = seedUsers();
  },
};

export type { MockUser };
