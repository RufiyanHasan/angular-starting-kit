import { type Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'titles.dashboard',
    loadComponent: () => import('./dashboard').then((m) => m.Dashboard),
  },
] satisfies Routes;
