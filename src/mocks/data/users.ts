/** Shape returned by the mock `/users` API. Mirrors `features/users/user.model.ts` (Phase 6). */
export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
}

const FIRST = [
  'Ada',
  'Alan',
  'Grace',
  'Linus',
  'Margaret',
  'Ken',
  'Barbara',
  'Dennis',
  'Radia',
  'Tim',
  'Frances',
  'John',
];
const LAST = [
  'Lovelace',
  'Turing',
  'Hopper',
  'Torvalds',
  'Hamilton',
  'Thompson',
  'Liskov',
  'Ritchie',
  'Perlman',
  'Berners-Lee',
  'Allen',
  'Backus',
];

/** Deterministic seed data so screenshots and e2e assertions are stable. */
export function seedUsers(count = 42): MockUser[] {
  const start = Date.UTC(2025, 0, 1);
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[i % FIRST.length]!;
    // Shifts the surname each time the first names wrap around, so all 42 names are unique.
    const last = LAST[(i * 5 + Math.floor(i / FIRST.length)) % LAST.length]!;
    return {
      id: `u-${String(i + 1).padStart(3, '0')}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i + 1}@example.com`.toLowerCase().replace(/[^a-z0-9.@-]/g, ''),
      role: i % 7 === 0 ? 'admin' : 'user',
      status: i % 5 === 3 ? 'inactive' : 'active',
      createdAt: new Date(start + i * 86_400_000 * 3).toISOString(),
    };
  });
}
