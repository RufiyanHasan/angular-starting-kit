export type SortOrder = 'asc' | 'desc';

/** Query for list endpoints. Extra filters go in `filters` and are sent as query params. */
export interface ListParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly sort?: string;
  readonly order?: SortOrder;
  readonly q?: string;
  readonly filters?: Readonly<Record<string, string | number | boolean | undefined>>;
}

/** Paged list response. The mock backend and real APIs must both return this shape. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** Error body convention for 4xx responses. `fieldErrors` maps form field → message. */
export interface ApiErrorBody {
  readonly message: string;
  readonly fieldErrors?: Readonly<Record<string, string>>;
}
