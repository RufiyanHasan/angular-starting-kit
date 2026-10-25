import { setupServer } from 'msw/node';
import { createUnsignedJwt } from '../../app/core/auth/jwt';
import { db } from '../db';
import { createHandlers } from '../handlers';

const BASE = 'http://localhost/api';
const server = setupServer(...createHandlers(BASE, { latencyMs: 0 }));

function token(roles: string[], expiresInS = 60): string {
  const now = Math.floor(Date.now() / 1000);
  return createUnsignedJwt({ sub: 'u-1', iat: now, exp: now + expiresInS, roles });
}

function api(path: string, init: RequestInit & { roles?: string[]; expired?: boolean } = {}) {
  const { roles = ['admin'], expired = false, ...rest } = init;
  return fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token(roles, expired ? -1 : 60)}`,
    },
  });
}

describe('mock users API (MSW handlers)', () => {
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
  afterAll(() => server.close());
  beforeEach(() => db.reset());

  it('requires a valid, unexpired token', async () => {
    expect((await fetch(`${BASE}/users`)).status).toBe(401);
    expect((await api('/users', { expired: true })).status).toBe(401);
  });

  it('lists with paging and search', async () => {
    const page = await (await api('/users?pageSize=5&page=2')).json();
    expect(page).toMatchObject({ total: 42, page: 2, pageSize: 5 });
    expect(page.items).toHaveLength(5);

    const search = await (await api('/users?q=lovelace')).json();
    expect(search.items.every((u: { name: string }) => u.name.includes('Lovelace'))).toBe(true);
  });

  it('runs a full CRUD cycle as admin', async () => {
    const created = await api('/users', {
      method: 'POST',
      body: JSON.stringify({ name: ' New Person ', email: 'NEW@example.com' }),
    });
    expect(created.status).toBe(201);
    const user = await created.json();
    expect(user).toMatchObject({ name: 'New Person', email: 'new@example.com', role: 'user' });

    const patched = await api(`/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'inactive' }),
    });
    expect((await patched.json()).status).toBe('inactive');

    expect((await api(`/users/${user.id}`, { method: 'DELETE' })).status).toBe(204);
    expect((await api(`/users/${user.id}`)).status).toBe(404);
  });

  it('validates input with field errors', async () => {
    const res = await api('/users', {
      method: 'POST',
      body: JSON.stringify({ name: '', email: db.users[0]!.email }),
    });
    expect(res.status).toBe(422);
    expect((await res.json()).fieldErrors).toEqual({
      name: 'Name is required.',
      email: 'This email is already in use.',
    });
  });

  it('forbids writes for non-admins', async () => {
    const res = await api('/users/u-001', { method: 'DELETE', roles: ['user'] });
    expect(res.status).toBe(403);
  });
});
