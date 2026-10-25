import { type Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/auth/auth.guards';
import { Shell } from './layout/shell/shell';

/**
 * Every feature is lazy-loaded via `loadChildren` pointing at its own `*.routes.ts`.
 * To add one: create `features/<name>/<name>.routes.ts`, add an entry below and in `layout/nav-items.ts`.
 * Restrict by role with `canActivate: [roleGuard('admin')]` on the feature's route.
 */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [guestGuard],
    loadComponent: () => import('@features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadChildren: () => import('@features/dashboard/dashboard.routes') },
      { path: 'settings', loadChildren: () => import('@features/settings/settings.routes') },
      {
        path: 'forbidden',
        title: 'Access denied',
        loadComponent: () => import('@features/forbidden/forbidden').then((m) => m.Forbidden),
      },
      {
        path: '**',
        title: 'Page not found',
        loadComponent: () => import('@features/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
