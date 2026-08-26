'use client';

import { useCallback, useEffect, useState } from 'react';
import { SCDropdown } from '../design-system';
import { useAuth } from '../../lib/auth';
import { fetchAccessibleClinics, type AccessibleClinic } from '../../lib/organisation';
import { getClinicForUser, initAppSession, setCurrentClinicId } from '../../lib/clinic';
import { supabase } from '../../lib/supabase';
import styles from './SiteSwitcher.module.css';

export function SiteSwitcher() {
  const { session } = useAuth();
  const [clinics, setClinics] = useState<AccessibleClinic[]>([]);
  const [switching, setSwitching] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchAccessibleClinics();
    if (result.ok) setClinics(result.clinics);
  }, []);

  useEffect(() => {
    void load();
  }, [load, session?.clinic?.id, session?.user_id]);

  const currentId = session?.clinic?.id || '';
  const currentName = session?.clinic?.name || session?.organisation?.name || 'Select site';

  if (!session) return null;

  if (clinics.length <= 1) {
    return (
      <div className={styles.current} title={currentName}>
        {currentName}
      </div>
    );
  }

  return (
    <SCDropdown
      label="Site"
      aria-label="Switch clinic"
      className={styles.switcher}
      width={220}
      disabled={switching}
      value={currentId}
      options={clinics.map((clinic) => ({
        value: clinic.id,
        label: clinic.name || 'Clinic',
      }))}
      onValueChange={(next) => {
        if (!next || next === currentId) return;
        void (async () => {
          setSwitching(true);
          try {
            setCurrentClinicId(next);
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            if (!token) return;
            const me = await getClinicForUser(token, next);
            if (!me.ok || !me.user_id) return;
            initAppSession({
              user_id: me.user_id,
              role: me.role,
              clinic: me.clinic,
              clinic_id: me.clinic_id ?? undefined,
              organisation_role: me.organisation_role,
              organisation: me.organisation,
              access_token: token,
            });
          } finally {
            setSwitching(false);
          }
        })();
      }}
    />
  );
}
