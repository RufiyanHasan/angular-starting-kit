import { type Params } from '@angular/router';
import { type ListParams, type SortOrder } from '@core/http/api.models';
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from './user.model';

export const USER_SORT_KEYS = ['name', 'email', 'role', 'status', 'createdAt'] as const;
export type UserSortKey = (typeof USER_SORT_KEYS)[number];

export const PAGE_SIZES = [10, 25, 50] as const;

/** Everything that defines one page of the users list. Lives in the URL query string. */
export interface UsersQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly sort: UserSortKey;
  readonly order: SortOrder;
  readonly q: string;
  readonly role: UserRole | null;
  readonly status: UserStatus | null;
}

export const DEFAULT_USERS_QUERY: UsersQuery = {
  page: 1,
  pageSize: 10,
  sort: 'name',
  order: 'asc',
  q: '',
  role: null,
  status: null,
};

const oneOf = <T extends string>(options: readonly T[], value: unknown): T | null =>
  options.includes(value as T) ? (value as T) : null;

const positiveInt = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** URL → query. Unknown or malformed values fall back to defaults (URLs are user input). */
export function parseUsersQuery(params: Params): UsersQuery {
  const d = DEFAULT_USERS_QUERY;
  return {
    page: positiveInt(params['page']) ?? d.page,
    pageSize: oneOf(PAGE_SIZES.map(String), params['pageSize'])
      ? Number(params['pageSize'])
      : d.pageSize,
    sort: oneOf(USER_SORT_KEYS, params['sort']) ?? d.sort,
    order: oneOf(['asc', 'desc'], params['order']) ?? d.order,
    q: typeof params['q'] === 'string' ? params['q'] : d.q,
    role: oneOf(USER_ROLES, params['role']),
    status: oneOf(USER_STATUSES, params['status']),
  };
}

/** Query → URL. Defaults are omitted so the URL stays short; `null` removes a param. */
export function toUsersQueryParams(query: UsersQuery): Params {
  const d = DEFAULT_USERS_QUERY;
  const params: Params = {};
  for (const key of Object.keys(d) as (keyof UsersQuery)[]) {
    params[key] = query[key] === d[key] || query[key] === '' ? null : query[key];
  }
  return params;
}

/** Query → API list params (`GET /users?…`). */
export function toListParams(query: UsersQuery): ListParams {
  const { page, pageSize, sort, order, q, role, status } = query;
  return {
    page,
    pageSize,
    sort,
    order,
    q,
    filters: { role: role ?? undefined, status: status ?? undefined },
  };
}
