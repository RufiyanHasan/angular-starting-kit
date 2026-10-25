export interface JwtPayload {
  readonly sub: string;
  readonly exp: number;
  readonly iat: number;
  readonly [claim: string]: unknown;
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/** Decodes (does NOT verify) a JWT. Returns null for anything malformed. */
export function decodeJwt(token: string): JwtPayload | null {
  const [, payload] = token.split('.');
  if (!payload) return null;
  try {
    const parsed: unknown = JSON.parse(base64UrlDecode(payload));
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { sub, exp, iat } = parsed as Record<string, unknown>;
    if (typeof sub !== 'string' || typeof exp !== 'number' || typeof iat !== 'number') return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

/** Unsigned token for the mock provider only. Real tokens come from your identity provider. */
export function createUnsignedJwt(payload: JwtPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  return `${header}.${base64UrlEncode(JSON.stringify(payload))}.mock-signature`;
}
