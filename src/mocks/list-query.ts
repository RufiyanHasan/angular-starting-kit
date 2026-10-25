export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

const RESERVED = new Set(['page', 'pageSize', 'sort', 'order', 'q']);

/**
 * Applies the ListParams convention (see core/http/api.models.ts) to an array:
 * `q` full-text over `searchFields`, any other param as an exact-match filter,
 * `sort`/`order`, then `page`/`pageSize` (1-based, max 100).
 */
export function applyListQuery<T extends object>(
  rows: readonly T[],
  params: URLSearchParams,
  searchFields: readonly (keyof T)[],
): PageResult<T> {
  let result = [...rows];

  const q = params.get('q')?.trim().toLowerCase();
  if (q) {
    result = result.filter((row) =>
      searchFields.some((f) => String(row[f]).toLowerCase().includes(q)),
    );
  }

  for (const [key, value] of params) {
    if (RESERVED.has(key) || value === '') continue;
    result = result.filter((row) => String((row as Record<string, unknown>)[key]) === value);
  }

  const sort = params.get('sort');
  if (sort) {
    const dir = params.get('order') === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      const av = String((a as Record<string, unknown>)[sort] ?? '');
      const bv = String((b as Record<string, unknown>)[sort] ?? '');
      return av.localeCompare(bv, undefined, { numeric: true }) * dir;
    });
  }

  const pageSize = clamp(Number(params.get('pageSize')) || 10, 1, 100);
  const page = Math.max(1, Number(params.get('page')) || 1);
  return {
    items: result.slice((page - 1) * pageSize, page * pageSize),
    total: result.length,
    page,
    pageSize,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
