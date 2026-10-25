import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { type User, type UserInput } from './user.model';
import { UsersApi } from './users.api';
import { DEFAULT_USERS_QUERY, type UsersQuery, toListParams } from './users-query';

interface UsersState {
  readonly query: UsersQuery;
  readonly total: number;
  readonly loading: boolean;
  readonly loadFailed: boolean;
}

/**
 * State for the Users feature: the current page of users plus list status. This is the kit's
 * NgRx SignalStore example (see docs/ADR for when to pick it over a plain signal service).
 *
 * Provided on the `users` route, so it lives while the user is anywhere under /users (list →
 * detail → edit → back keeps the page) and is destroyed on leaving the feature.
 *
 * The list page passes its URL-derived query signal to `load()`; every change loads that page,
 * and a newer query cancels the older request (switchMap). `query` holds the last one loaded.
 */
export const UsersStore = signalStore(
  withEntities<User>(),
  withState<UsersState>({
    query: DEFAULT_USERS_QUERY,
    total: 0,
    loading: false,
    loadFailed: false,
  }),
  withComputed(({ query }) => ({
    hasFilters: computed(() => !!(query().q || query().role || query().status)),
  })),
  withMethods((store, api = inject(UsersApi)) => {
    const load = rxMethod<UsersQuery>(
      pipe(
        tap((query) => patchState(store, { query, loading: true, loadFailed: false })),
        switchMap((query) =>
          api.list(toListParams(query)).pipe(
            tap((page) =>
              patchState(store, setAllEntities([...page.items]), {
                total: page.total,
                loading: false,
              }),
            ),
            catchError(() => {
              patchState(store, { loading: false, loadFailed: true });
              return EMPTY;
            }),
          ),
        ),
      ),
    );
    const reload = () => load(store.query());

    return {
      load,
      reload,
      /** Mutations return promises so forms can await them and handle errors inline. */
      async create(input: UserInput): Promise<User> {
        const user = await firstValueFrom(api.create(input));
        reload();
        return user;
      },
      async update(id: string, changes: Partial<UserInput>): Promise<User> {
        const user = await firstValueFrom(api.update(id, changes));
        patchState(store, updateEntity({ id, changes: user }));
        return user;
      },
      async remove(id: string): Promise<void> {
        await firstValueFrom(api.remove(id));
        reload();
      },
    };
  }),
);
