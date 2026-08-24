'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header, SCButton } from '../design-system';
import {
  IconNavProtocols,
  IconNavReports,
  IconNavSettings,
  IconQueue,
} from '../design-system/icons';
import { logout } from '../../lib/auth';

export type AppHeaderProps = {
  title: ReactNode;
};

const PATIENTS_HEADER_ICON = '/images/pw/icon-user-group-figma.png';

function PatientsHeaderIcon() {
  return (
    <img src={PATIENTS_HEADER_ICON} alt="" width={32} height={32} aria-hidden style={{ display: 'block' }} />
  );
}

function resolveHeaderIcon(pathname: string) {
  if (pathname.startsWith('/enrolments') || pathname === '/patients') return <PatientsHeaderIcon />;
  if (pathname.startsWith('/patient-workspace-visual') || pathname.startsWith('/patient-detail-visual')) {
    return <PatientsHeaderIcon />;
  }
  if (pathname.startsWith('/patients-visual')) return <PatientsHeaderIcon />;
  if (pathname === '/') return <IconQueue size={32} />;
  if (pathname.startsWith('/protocol-library-visual') || pathname.startsWith('/protocols')) {
    return <IconNavProtocols size={32} />;
  }
  if (pathname.startsWith('/reports')) return <IconNavReports size={32} />;
  if (pathname.startsWith('/settings')) return <IconNavSettings size={32} />;
  return <IconQueue size={32} />;
}

export function AppHeader({ title }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/auth/signin');
  }

  const aside = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <SCButton variant="outline" type="button" onClick={() => void handleLogout()}>
        Log out
      </SCButton>
    </div>
  );

  return <Header title={title} icon={resolveHeaderIcon(pathname)} aside={aside} />;
}
