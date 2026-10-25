import { inject } from '@angular/core';
import { type Observable } from 'rxjs';
import { type ListParams, type Page } from './api.models';
import { ApiService, type ApiRequestOptions } from './api.service';

/**
 * Generic REST resource: extend it once per entity and get typed CRUD for free.
 *
 * @example
 * @Injectable({ providedIn: 'root' })
 * export class UsersApi extends CrudResource<User, CreateUserDto> {
 *   protected readonly path = 'users';
 * }
 */
export abstract class CrudResource<
  T extends { readonly id: string | number },
  TCreate = Omit<T, 'id'>,
  TUpdate = Partial<TCreate>,
> {
  protected readonly api = inject(ApiService);
  protected abstract readonly path: string;

  list(params: ListParams = {}, options: ApiRequestOptions = {}): Observable<Page<T>> {
    const { filters, ...rest } = params;
    return this.api.get<Page<T>>(this.path, {
      ...options,
      params: { ...rest, ...filters, ...options.params },
    });
  }

  getById(id: T['id'], options?: ApiRequestOptions): Observable<T> {
    return this.api.get<T>(this.itemPath(id), options);
  }

  create(body: TCreate, options?: ApiRequestOptions): Observable<T> {
    return this.api.post<T>(this.path, body, options);
  }

  update(id: T['id'], body: TUpdate, options?: ApiRequestOptions): Observable<T> {
    return this.api.patch<T>(this.itemPath(id), body, options);
  }

  remove(id: T['id'], options?: ApiRequestOptions): Observable<void> {
    return this.api.delete<void>(this.itemPath(id), options);
  }

  protected itemPath(id: T['id']): string {
    return `${this.path}/${encodeURIComponent(String(id))}`;
  }
}
