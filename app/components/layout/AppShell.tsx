import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { AppShell as DSAppShell } from '../design-system';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

export type AppShellProps = {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AppShell({ title, children, className, contentClassName }: AppShellProps) {
  return (
    <DSAppShell
      className={cn(className)}
      contentClassName={contentClassName}
      sidebar={<AppSidebar />}
      header={<AppHeader title={title} />}
    >
      {children}
    </DSAppShell>
  );
}
