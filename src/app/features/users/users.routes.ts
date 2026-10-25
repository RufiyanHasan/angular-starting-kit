import { type Routes } from '@angular/router';
import { roleGuard } from '@core/auth/auth.guards';
import { unsavedChangesGuard } from '@core/routing/unsaved-changes.guard';
import { UsersStore } from './users.store';

/** Everyone signed in can browse users; only admins can create or edit (the API enforces it too). */
export default [
  {
    path: '',
    providers: [UsersStore],
    children: [
      {
        path: '',
        title: 'titles.users',
        loadComponent: () => import('./user-list/user-list').then((m) => m.UserList),
      },
      {
        path: 'new',
        title: 'titles.userNew',
        canActivate: [roleGuard('admin')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./user-edit/user-edit').then((m) => m.UserEdit),
      },
      {
        path: ':id',
        title: 'titles.userDetail',
        loadComponent: () => import('./user-detail/user-detail').then((m) => m.UserDetail),
      },
      {
        path: ':id/edit',
        title: 'titles.userEdit',
        canActivate: [roleGuard('admin')],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./user-edit/user-edit').then((m) => m.UserEdit),
      },
    ],
  },
] satisfies Routes;
