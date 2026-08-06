'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { accessDeniedMessage, appApiFetch } from '../../lib/api';
import {
  buildEscalationPolicyPatch,
  DEFAULT_ESCALATION_THRESHOLDS,
  normalizeEscalationThresholdsForEditor,
  thresholdsEqual,
  validateEscalationThresholds,
  type EscalationThresholds,
} from '../../lib/escalation-policy';
import { PATIENT_RECOVERY_SCORE_NAME } from '../../lib/clinical-language';
import { useActionFeedback } from '../providers/ActionFeedbackProvider';
import { Alert } from '../ui/alert';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { LoadingState } from '../ui/spinner';
import { SCButton } from '../design-system/controls/SCButton';
import { Select } from '../ui/select';
import { SettingsBody } from './SettingsBody';
import { SettingsCard } from './SettingsCard';
import { SettingsFooter } from './SettingsFooter';
import { SettingsFormRow, SettingsFormStack } from './SettingsForm';
import { SettingsHeader } from './SettingsHeader';
import { SettingsNav } from './SettingsNav';
import { SettingsPage } from './SettingsPage';
import frameworkStyles from './settings-framework.module.css';

const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;

type LoadState = 'loading' | 'ready' | 'error';

function humanValidationMessage(code: string): string {
  if (code.includes('notify_at_or_below must be <= urgent')) {
    return 'Notify threshold must be less than or equal to Urgent threshold.';
  }
  if (code.includes('urgent_at_or_below must be <= always')) {
    return 'Urgent threshold must be less than or equal to Always urgent threshold.';
  }
  if (code.includes('must be an integer 1..5')) {
    return 'Each threshold must be a whole number from 1 to 5.';
  }
  return code;
}

/**
 * Escalation settings — wired to GET/PATCH clinic escalation policy APIs.
 */
export function EscalationSettingsContent() {
  const router = useRouter();
  const { showFeedback } = useActionFeedback();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<EscalationThresholds>({ ...DEFAULT_ESCALATION_THRESHOLDS });
  const [draft, setDraft] = useState<EscalationThresholds>({ ...DEFAULT_ESCALATION_THRESHOLDS });
  const [policyNote, setPolicyNote] = useState<string | null>(null);
  /** True when editor is showing defaults because the clinic had no valid stored pack. */
  const [needsInitialPersist, setNeedsInitialPersist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const dirty = useMemo(
    () => needsInitialPersist || !thresholdsEqual(baseline, draft),
    [baseline, draft, needsInitialPersist],
  );
  const clientValidationError = useMemo(() => validateEscalationThresholds(draft), [draft]);

  const applyLoadedPolicy = useCallback((rawPolicy: unknown, name: string | null) => {
    const { thresholds, note, usedDefaults } = normalizeEscalationThresholdsForEditor(rawPolicy);
    setClinicName(name);
    setBaseline(thresholds);
    setDraft(thresholds);
    setPolicyNote(usedDefaults || note !== 'stored_values_as_min_scores_1_5_scale' ? note : null);
    setNeedsInitialPersist(usedDefaults);
    setLoadState('ready');
    setLoadError(null);
    setFormError(null);
    setSaveSuccess(false);
  }, []);

  const loadSettings = useCallback(async () => {
    setLoadState('loading');
    setLoadError(null);
    setFormError(null);
    setSaveSuccess(false);
    try {
      const res = await appApiFetch('/app/clinic/settings');
      const body = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        setLoadState('error');
        setLoadError(accessDeniedMessage(body));
        return;
      }
      if (!res.ok) {
        setLoadState('error');
        setLoadError(
          typeof body?.error === 'string' ? body.error : 'Could not load escalation settings.',
        );
        return;
      }

      const clinic = body?.clinic;
      const name =
        clinic && typeof clinic.name === 'string' && clinic.name.trim() ? clinic.name.trim() : null;
      applyLoadedPolicy(body?.escalation_policy ?? null, name);
    } catch {
      setLoadState('error');
      setLoadError('Network error while loading escalation settings. Check your connection and retry.');
    }
  }, [applyLoadedPolicy]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSettings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSettings]);

  // Browser refresh / close — same pattern as Protocol Editor.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // In-app link navigation while dirty.
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      if (/^https?:\/\//i.test(href)) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
      setLeaveOpen(true);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [dirty]);

  function updateField(key: keyof EscalationThresholds, value: string) {
    const n = Number(value);
    setDraft((prev) => ({ ...prev, [key]: n }));
    setSaveSuccess(false);
    setFormError(null);
  }

  async function handleSave() {
    if (saving || !dirty) return;

    const validationError = validateEscalationThresholds(draft);
    if (validationError) {
      setFormError(humanValidationMessage(validationError));
      setSaveSuccess(false);
      return;
    }

    const patch = buildEscalationPolicyPatch(baseline, draft);
    const escalation_policy = needsInitialPersist
      ? {
          notify_at_or_below: draft.notify_at_or_below,
          urgent_at_or_below: draft.urgent_at_or_below,
          always_urgent_at: draft.always_urgent_at,
        }
      : patch;

    if (Object.keys(escalation_policy).length === 0) return;

    setSaving(true);
    setFormError(null);
    setSaveSuccess(false);

    try {
      const res = await appApiFetch('/app/clinic/settings/escalation-policy', {
        method: 'PATCH',
        body: { escalation_policy },
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 403) {
        setFormError(accessDeniedMessage(body));
        setSaving(false);
        return;
      }
      if (!res.ok) {
        const serverError =
          typeof body?.error === 'string' ? body.error : 'Could not save escalation policy.';
        setFormError(humanValidationMessage(serverError));
        setSaving(false);
        return;
      }

      // Server response is source of truth.
      const name =
        body?.clinic && typeof body.clinic.name === 'string' && body.clinic.name.trim()
          ? body.clinic.name.trim()
          : clinicName;
      applyLoadedPolicy(body?.escalation_policy ?? draft, name);
      setSaveSuccess(true);
      setSaving(false);
      showFeedback('Escalation policy updated.');
    } catch {
      setFormError('Network error while saving. Your changes were not saved.');
      setSaving(false);
    }
  }

  const footerNote = dirty
    ? 'You have unsaved changes.'
    : saveSuccess
      ? 'Saved.'
      : `Higher ${PATIENT_RECOVERY_SCORE_NAME} values mean higher clinical concern. Alerts escalate when the reply score is at or above each threshold.`;

  return (
    <SettingsPage dataNodeId="307:8308">
      <SettingsNav primaryActive="clinic" secondaryActive="escalation" dataNodeId="307:8309-nav" />

      <SettingsHeader
        title="Escalation"
        description="Clinical escalation thresholds that govern alert creation and asynchronous escalation."
        dataNodeId="307:8309"
      />

      <SettingsBody>
        {loadState === 'loading' ? <LoadingState label="Loading escalation policy…" /> : null}

        {loadState === 'error' ? (
          <SettingsCard title="Unable to load" dataNodeId="307:8315-error">
            <Alert variant="danger">{loadError || 'Could not load escalation settings.'}</Alert>
            <div className="mt-4">
              <SCButton variant="outline" type="button" onClick={() => void loadSettings()}>
                Retry
              </SCButton>
            </div>
          </SettingsCard>
        ) : null}

        {loadState === 'ready' ? (
          <SettingsCard
            title="Escalation policy"
            description={
              clinicName
                ? `Thresholds for ${clinicName}. ${PATIENT_RECOVERY_SCORE_NAME} ≥ threshold escalates (1 = Recovering Well, 5 = Immediate Attention).`
                : `${PATIENT_RECOVERY_SCORE_NAME} ≥ threshold escalates (1 = Recovering Well, 5 = Immediate Attention).`
            }
            dataNodeId="307:8315"
          >
            {policyNote === 'legacy_low_is_worse_pack_inverted_to_min_scores' ? (
              <Alert variant="info" className="mb-4">
                Stored policy used a legacy scale and is shown here in the current 1–5 concern scale.
                Saving will store the updated canonical thresholds.
              </Alert>
            ) : null}
            {policyNote &&
            (policyNote.includes('defaults') ||
              policyNote.includes('malformed') ||
              policyNote.includes('missing') ||
              policyNote.includes('legacy_non_1_5')) ? (
              <Alert variant="info" className="mb-4">
                No valid threshold pack was stored for this clinic. Showing SignalCare defaults (notify
                3, urgent 4, always urgent 5). Save to persist them.
              </Alert>
            ) : null}

            {formError ? (
              <Alert variant="danger" className="mb-4">
                {formError}
              </Alert>
            ) : null}
            {saveSuccess && !dirty ? (
              <Alert variant="success" className="mb-4">
                Escalation policy saved.
              </Alert>
            ) : null}
            {dirty && clientValidationError ? (
              <Alert variant="danger" className="mb-4">
                {humanValidationMessage(clientValidationError)}
              </Alert>
            ) : null}

            <SettingsFormStack>
              <SettingsFormRow
                label={<label htmlFor="escalation-notify">Notify threshold</label>}
                labelDescription="Minimum score that creates a concern-level alert and clinic notify escalation."
                control={
                  <div className={frameworkStyles.formControlWide}>
                    <Select
                      id="escalation-notify"
                      value={String(draft.notify_at_or_below)}
                      disabled={saving}
                      onChange={(e) => updateField('notify_at_or_below', e.target.value)}
                      aria-invalid={Boolean(
                        clientValidationError?.includes('notify') ||
                          clientValidationError?.includes('integer'),
                      )}
                    >
                      {SCORE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </div>
                }
              />
              <SettingsFormRow
                label={<label htmlFor="escalation-urgent">Urgent threshold</label>}
                labelDescription="Minimum score that escalates as urgent."
                control={
                  <div className={frameworkStyles.formControlWide}>
                    <Select
                      id="escalation-urgent"
                      value={String(draft.urgent_at_or_below)}
                      disabled={saving}
                      onChange={(e) => updateField('urgent_at_or_below', e.target.value)}
                      aria-invalid={Boolean(clientValidationError?.includes('urgent'))}
                    >
                      {SCORE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </div>
                }
              />
              <SettingsFormRow
                label={<label htmlFor="escalation-always">Always urgent threshold</label>}
                labelDescription="Minimum score that triggers immediate urgent escalation."
                control={
                  <div className={frameworkStyles.formControlWide}>
                    <Select
                      id="escalation-always"
                      value={String(draft.always_urgent_at)}
                      disabled={saving}
                      onChange={(e) => updateField('always_urgent_at', e.target.value)}
                      aria-invalid={Boolean(clientValidationError?.includes('always'))}
                    >
                      {SCORE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </div>
                }
              />
            </SettingsFormStack>
          </SettingsCard>
        ) : null}
      </SettingsBody>

      {loadState === 'ready' ? (
        <SettingsFooter note={footerNote}>
          <SCButton
            type="button"
            disabled={saving || !dirty || Boolean(clientValidationError)}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving…' : 'Save settings'}
          </SCButton>
        </SettingsFooter>
      ) : null}

      <ConfirmDialog
        open={leaveOpen}
        title="Leave without saving?"
        body="You have unsaved changes to the escalation policy. If you leave now, those changes will be lost."
        confirmLabel="Leave page"
        cancelLabel="Stay"
        destructive
        onCancel={() => {
          setLeaveOpen(false);
          setPendingHref(null);
        }}
        onConfirm={() => {
          const href = pendingHref;
          setLeaveOpen(false);
          setPendingHref(null);
          if (href) router.push(href);
        }}
      />
    </SettingsPage>
  );
}
