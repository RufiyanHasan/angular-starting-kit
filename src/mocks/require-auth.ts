import { decodeJwt } from '../app/core/auth/jwt';
import { HttpResponse } from 'msw';

/** Returns a 401 response unless the request carries a non-expired Bearer token. */
export function requireAuth(request: Request): HttpResponse<{ message: string }> | null {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  const payload = token ? decodeJwt(token) : null;
  if (!payload || payload.exp * 1000 <= Date.now()) {
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** Roles claim from a token already validated by requireAuth. */
export function rolesOf(request: Request): string[] {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
  const roles = decodeJwt(token)?.['roles'];
  return Array.isArray(roles) ? roles.map(String) : [];
}
