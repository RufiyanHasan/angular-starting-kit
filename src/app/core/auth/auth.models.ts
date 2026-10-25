export type Role = 'admin' | 'user';

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly roles: readonly Role[];
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface AuthSession {
  readonly user: User;
  readonly accessToken: string;
  /** Epoch milliseconds. */
  readonly expiresAt: number;
}

export type AuthErrorCode = 'invalid_credentials' | 'session_expired' | 'unknown';

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
