import { type Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Dashboard',
    loadComponent: () => import('./dashboard').then((m) => m.Dashboard),
  },
] satisfies Routes;
