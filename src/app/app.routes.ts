import { type Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';

/**
 * Every feature is lazy-loaded via `loadChildren` pointing at its own `*.routes.ts`.
 * To add one: create `features/<name>/<name>.routes.ts`, add an entry below and in `layout/nav-items.ts`.
 */
export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadChildren: () => import('@features/dashboard/dashboard.routes') },
      { path: 'settings', loadChildren: () => import('@features/settings/settings.routes') },
      {
        path: '**',
        title: 'Page not found',
        loadComponent: () => import('@features/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
