'use client';

import { ClinicSiteProfileContent } from '../components/settings/ClinicSiteProfileContent';
import { VISUAL_LOCK_CLINIC_PROFILE } from '../lib/visual-lock/fixtures';

export function VisualLockSettings() {
  return <ClinicSiteProfileContent fixture={VISUAL_LOCK_CLINIC_PROFILE} />;
}
