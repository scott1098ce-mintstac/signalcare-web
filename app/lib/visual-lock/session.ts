import type { AppSession } from '../auth/session';
import {
  VISUAL_LOCK_CLINIC_ID,
  VISUAL_LOCK_CLINIC_NAME,
  VISUAL_LOCK_ORG_ID,
  VISUAL_LOCK_USER_ID,
} from './constants';

/** Frozen admin session — visual-lock pages never call Supabase. */
export const VISUAL_LOCK_SESSION: AppSession = {
  user_id: VISUAL_LOCK_USER_ID,
  role: 'admin',
  clinic: { id: VISUAL_LOCK_CLINIC_ID, name: VISUAL_LOCK_CLINIC_NAME },
  clinic_id: VISUAL_LOCK_CLINIC_ID,
  organisation_role: 'owner',
  organisation: {
    id: VISUAL_LOCK_ORG_ID,
    name: VISUAL_LOCK_CLINIC_NAME,
    slug: 'visual-lock-clinic',
    role: 'owner',
  },
  access_token: 'visual-lock-fixture-token',
};
