import { type Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Settings',
    loadComponent: () => import('./settings').then((m) => m.Settings),
  },
] satisfies Routes;
