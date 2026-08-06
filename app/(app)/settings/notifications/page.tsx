'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '../../../components/ui';

/** Notifications prefs are out of launch scope — redirect away from the stub route. */
export default function NotificationsSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/account');
  }, [router]);

  return <LoadingState label="Opening account settings…" />;
}
