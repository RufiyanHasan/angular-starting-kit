import {
  DEFAULT_USERS_QUERY,
  parseUsersQuery,
  toListParams,
  toUsersQueryParams,
} from './users-query';

describe('users query <-> URL', () => {
  it('parses valid params', () => {
    expect(
      parseUsersQuery({
        page: '3',
        pageSize: '25',
        sort: 'createdAt',
        order: 'desc',
        q: 'ada',
        role: 'admin',
        status: 'inactive',
      }),
    ).toEqual({
      page: 3,
      pageSize: 25,
      sort: 'createdAt',
      order: 'desc',
      q: 'ada',
      role: 'admin',
      status: 'inactive',
    });
  });

  it('falls back to defaults for missing or malformed values', () => {
    expect(
      parseUsersQuery({ page: '-1', pageSize: '7', sort: 'password', order: 'up', role: 'root' }),
    ).toEqual(DEFAULT_USERS_QUERY);
    expect(parseUsersQuery({ page: '2.5' }).page).toBe(1);
  });

  it('omits defaults from the URL and round-trips', () => {
    expect(toUsersQueryParams(DEFAULT_USERS_QUERY)).toEqual({
      page: null,
      pageSize: null,
      sort: null,
      order: null,
      q: null,
      role: null,
      status: null,
    });
    const query = { ...DEFAULT_USERS_QUERY, page: 2, q: 'x', status: 'active' as const };
    const params = Object.fromEntries(
      Object.entries(toUsersQueryParams(query)).filter(([, v]) => v !== null),
    );
    expect(params).toEqual({ page: 2, q: 'x', status: 'active' });
    expect(parseUsersQuery(params)).toEqual(query);
  });

  it('maps to API list params with filters', () => {
    expect(toListParams({ ...DEFAULT_USERS_QUERY, role: 'admin' })).toEqual({
      page: 1,
      pageSize: 10,
      sort: 'name',
      order: 'asc',
      q: '',
      filters: { role: 'admin', status: undefined },
    });
  });
});
