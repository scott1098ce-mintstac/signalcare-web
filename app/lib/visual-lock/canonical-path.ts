/**
 * Map fixture-only /visual-lock/* routes onto the production pathnames
 * the authenticated shell uses for titles, header icons, and sidebar active state.
 */
export function canonicalAppPath(pathname: string): string {
  if (
    pathname === '/visual-lock/command-queue' ||
    pathname === '/visual-lock/command-queue-empty'
  ) {
    return '/';
  }
  if (pathname === '/visual-lock/patients') return '/patients';
  if (pathname === '/visual-lock/workspace') return '/enrolments/visual-lock';
  if (pathname === '/visual-lock/protocols') return '/protocols';
  if (pathname === '/visual-lock/reports') return '/reports';
  if (pathname === '/visual-lock/settings') return '/settings/clinic';
  return pathname;
}

export function resolveAuthenticatedTitle(pathname: string): string {
  const path = canonicalAppPath(pathname);
  if (path === '/') return 'Command Queue';
  if (path === '/patients') return 'Patients';
  if (path === '/protocols') return 'Protocol Library';
  if (path === '/reports') return 'Clinical Reports';
  if (path.startsWith('/protocols/')) return 'Protocol Editor';
  if (path.startsWith('/settings/organisation')) return 'Organisation';
  if (path.startsWith('/settings/clinic')) return 'Clinic site';
  if (path.startsWith('/settings/staff')) return 'Settings';
  if (path.startsWith('/settings')) return 'Settings';
  if (path.startsWith('/enrolments/')) return 'Patients';
  return 'SignalCare';
}
