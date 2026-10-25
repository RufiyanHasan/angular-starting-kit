/** A user as returned by `GET /users` and `GET /users/:id`. Mirrors `src/mocks/data/users.ts`. */
export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  /** ISO 8601 */
  readonly createdAt: string;
}

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';

export const USER_ROLES: readonly UserRole[] = ['admin', 'user'];
export const USER_STATUSES: readonly UserStatus[] = ['active', 'inactive'];

/** Body of `POST /users` and (partially) `PATCH /users/:id`. */
export type UserInput = Pick<User, 'name' | 'email' | 'role' | 'status'>;
