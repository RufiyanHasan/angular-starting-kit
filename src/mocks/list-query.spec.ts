import { applyListQuery } from './list-query';

const rows = [
  { id: 1, name: 'Ada', role: 'admin' },
  { id: 2, name: 'Alan', role: 'user' },
  { id: 3, name: 'Grace', role: 'user' },
  { id: 10, name: 'Linus', role: 'user' },
];
const q = (s: string) => applyListQuery(rows, new URLSearchParams(s), ['name']);

describe('applyListQuery', () => {
  it('searches, filters, sorts (numeric-aware) and pages', () => {
    expect(q('q=a').total).toBe(3);
    expect(q('role=user').items.map((r) => r.id)).toEqual([2, 3, 10]);
    expect(q('sort=id&order=desc').items.map((r) => r.id)).toEqual([10, 3, 2, 1]);
    expect(q('page=2&pageSize=3')).toEqual({ items: [rows[3]], total: 4, page: 2, pageSize: 3 });
  });

  it('clamps page size', () => {
    expect(q('pageSize=1000').pageSize).toBe(100);
  });
});
