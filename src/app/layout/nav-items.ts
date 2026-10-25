export interface NavItem {
  /** Translation key. */
  readonly label: string;
  readonly path: string;
}

/** Sidebar entries. Add one line here when you add a top-level feature route. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'nav.dashboard', path: '/dashboard' },
  { label: 'nav.users', path: '/users' },
  { label: 'nav.settings', path: '/settings' },
];
