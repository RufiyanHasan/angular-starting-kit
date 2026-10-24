export interface NavItem {
  readonly label: string;
  readonly path: string;
}

/** Sidebar entries. Add one line here when you add a top-level feature route. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Settings', path: '/settings' },
];
