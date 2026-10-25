import { type AuthSession, type LoginCredentials } from './auth.models';

/**
 * The contract every auth implementation fulfils. Feature code never sees this —
 * it talks to AuthService. Swap implementations in `provide-auth.ts` (see README).
 *
 * An abstract class (not an interface) so it doubles as the DI token.
 */
export abstract class AuthProvider {
  /**
   * `credentials`: the login page renders an email/password form.
   * `redirect`: the login page renders a single "Sign in" button (OIDC / SSO).
   */
  abstract readonly loginMode: 'credentials' | 'redirect';

  /** Called once at startup. Return the persisted session, or null if there is none. */
  abstract restore(): Promise<AuthSession | null>;

  /** Credentials mode: resolve with a session. Redirect mode: navigate away (may never resolve). */
  abstract login(credentials?: LoginCredentials): Promise<AuthSession>;

  /** Exchange the refresh token for a new access token. Reject with AuthError('session_expired') if impossible. */
  abstract refresh(): Promise<AuthSession>;

  abstract logout(): Promise<void>;
}
