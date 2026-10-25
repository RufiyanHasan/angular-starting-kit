import { type Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'titles.settings',
    loadComponent: () => import('./settings').then((m) => m.Settings),
  },
] satisfies Routes;
