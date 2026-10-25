import { HttpResponse, delay, http } from 'msw';
import { type MockUser, db } from '../db';
import { applyListQuery } from '../list-query';
import { requireAuth, rolesOf } from '../require-auth';

type UserInput = Partial<Pick<MockUser, 'name' | 'email' | 'role' | 'status'>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: UserInput, partial: boolean, ignoreId?: string) {
  const fieldErrors: Record<string, string> = {};
  if (!partial || input.name !== undefined) {
    if (!input.name?.trim()) fieldErrors['name'] = 'Name is required.';
  }
  if (!partial || input.email !== undefined) {
    if (!input.email || !EMAIL.test(input.email)) fieldErrors['email'] = 'Enter a valid email.';
    else if (db.users.some((u) => u.email === input.email!.toLowerCase() && u.id !== ignoreId)) {
      fieldErrors['email'] = 'This email is already in use.';
    }
  }
  if (input.role !== undefined && !['admin', 'user'].includes(input.role)) {
    fieldErrors['role'] = 'Unknown role.';
  }
  if (input.status !== undefined && !['active', 'inactive'].includes(input.status)) {
    fieldErrors['status'] = 'Unknown status.';
  }
  return Object.keys(fieldErrors).length
    ? HttpResponse.json(
        { message: 'Please fix the highlighted fields.', fieldErrors },
        { status: 422 },
      )
    : null;
}

const forbidden = () => HttpResponse.json({ message: 'Admins only.' }, { status: 403 });
const notFound = () => HttpResponse.json({ message: 'User not found.' }, { status: 404 });

export function usersHandlers(base: string, latencyMs: number) {
  return [
    http.get(`${base}/users`, async ({ request }) => {
      await delay(latencyMs);
      const denied = requireAuth(request);
      if (denied) return denied;
      const params = new URL(request.url).searchParams;
      return HttpResponse.json(applyListQuery(db.users, params, ['name', 'email']));
    }),

    http.get<{ id: string }>(`${base}/users/:id`, async ({ request, params }) => {
      await delay(latencyMs);
      const denied = requireAuth(request);
      if (denied) return denied;
      const user = db.users.find((u) => u.id === params.id);
      return user ? HttpResponse.json(user) : notFound();
    }),

    http.post(`${base}/users`, async ({ request }) => {
      await delay(latencyMs);
      const denied = requireAuth(request);
      if (denied) return denied;
      if (!rolesOf(request).includes('admin')) return forbidden();
      const input = (await request.json()) as UserInput;
      const invalid = validate(input, false);
      if (invalid) return invalid;
      const user: MockUser = {
        id: `u-${crypto.randomUUID().slice(0, 8)}`,
        name: input.name!.trim(),
        email: input.email!.toLowerCase(),
        role: input.role ?? 'user',
        status: input.status ?? 'active',
        createdAt: new Date().toISOString(),
      };
      db.users = [user, ...db.users];
      return HttpResponse.json(user, { status: 201 });
    }),

    http.patch<{ id: string }>(`${base}/users/:id`, async ({ request, params }) => {
      await delay(latencyMs);
      const denied = requireAuth(request);
      if (denied) return denied;
      if (!rolesOf(request).includes('admin')) return forbidden();
      const existing = db.users.find((u) => u.id === params.id);
      if (!existing) return notFound();
      const input = (await request.json()) as UserInput;
      const invalid = validate(input, true, existing.id);
      if (invalid) return invalid;
      const updated: MockUser = {
        ...existing,
        ...input,
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.email !== undefined && { email: input.email.toLowerCase() }),
      };
      db.users = db.users.map((u) => (u.id === existing.id ? updated : u));
      return HttpResponse.json(updated);
    }),

    http.delete<{ id: string }>(`${base}/users/:id`, async ({ request, params }) => {
      await delay(latencyMs);
      const denied = requireAuth(request);
      if (denied) return denied;
      if (!rolesOf(request).includes('admin')) return forbidden();
      if (!db.users.some((u) => u.id === params.id)) return notFound();
      db.users = db.users.filter((u) => u.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
