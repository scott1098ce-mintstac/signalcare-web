/** Frozen clock for visual-lock screenshots. Relative labels must not drift. */
export const VISUAL_LOCK_NOW_ISO = '2026-08-28T00:00:00.000Z';
export const VISUAL_LOCK_NOW_MS = Date.parse(VISUAL_LOCK_NOW_ISO);

export const VISUAL_LOCK_USER_ID = '00000000-0000-4000-8000-000000000001';
export const VISUAL_LOCK_CLINIC_ID = '00000000-0000-4000-8000-000000000010';
export const VISUAL_LOCK_CLINIC_NAME = 'Visual Lock Clinic';
export const VISUAL_LOCK_ORG_ID = '00000000-0000-4000-8000-000000000020';

export const VISUAL_LOCK_PRODUCTION_HOSTS = new Set([
  'app.signalcare.io',
  'www.app.signalcare.io',
]);
