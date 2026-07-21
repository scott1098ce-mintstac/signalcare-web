'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAppSession } from '../../../lib/clinic';
import { appApiFetch } from '../../../lib/api';
import { canEditProtocols, canPublishProtocols, canViewProtocols } from '../../../lib/app-permissions';
import { AccessDeniedState } from '../../../components/AccessDeniedState';
import { formatExpectedResponseType, formatScoringSnapshotDisplay } from '../../../lib/protocol-display';
import {
  formatLastEditedLabel,
  formatProcedureType,
  formatProtocolDate,
  formatProtocolTiming,
} from '../../../lib/protocol-types';
import { ProtocolEditorBanners } from '../../../components/protocol-editor/ProtocolEditorBanners';
import { ProtocolEditorStepDetail, ProtocolEditorStepEmpty } from '../../../components/protocol-editor/ProtocolEditorStepDetail';
import { ProtocolEditorStepList } from '../../../components/protocol-editor/ProtocolEditorStepList';
import { ProtocolEditorToolbar } from '../../../components/protocol-editor/ProtocolEditorToolbar';
import { ProtocolVersionHistorySection } from '../../../components/protocol-editor/ProtocolVersionHistorySection';
import { SCButton } from '../../../components/design-system';
import { Alert, LoadingState, Modal } from '../../../components/ui';
import styles from '../../../components/protocol-editor/protocol-editor.module.css';

type ProtocolDetail = {
  id: string;
  name: string;
  procedure_type: string;
  is_active: boolean;
  is_owned: boolean;
  updated_at: string | null;
  latest_published_version: { id: string; version_number: number } | null;
  current_draft_version: { id: string; version_number: number } | null;
};

type DraftVersion = {
  id: string;
  protocol_id?: string;
  version_number: number;
  status: string;
};

type ProtocolVersionHistoryRow = {
  id: string;
  version_number: number;
  status: string;
  published_at: string | null;
  archived_at: string | null;
  step_count: number;
  is_live: boolean;
  is_archived: boolean;
  label: string;
};

type StepStatusTone = 'dirty' | 'saved' | 'saving' | 'error' | null;

function getStepStatus(
  step: StepEditorState,
  dirty: boolean,
  validationError: string | null,
): { line: string | null; tone: StepStatusTone } {
  if (step.isSaving) return { line: 'Saving…', tone: 'saving' };
  if (step.saveError) return { line: step.saveError, tone: 'error' };
  if (validationError && dirty) return { line: validationError, tone: 'error' };
  if (step.saveSuccess && !dirty) return { line: 'Saved', tone: 'saved' };
  if (dirty) return { line: 'Unsaved', tone: 'dirty' };
  return { line: null, tone: null };
}

/** API row shape when loading steps */
type ApiStepRow = {
  id: string;
  offset_minutes: number | null;
  message_body_override: string | null;
  message_template_code: string | null;
  expected_response_type: string | null;
  step_order: number | null;
  is_active: boolean | null;
  scoring_snapshot?: unknown;
  step_label: string | null;
  response_window_minutes: number | null;
  expected_symptoms: string[] | null;
  escalation_weight: number | null;
};

type StepEditorState = {
  id: string;
  offset_minutes: number | null;
  expected_response_type: string | null;
  step_order: number | null;
  is_active: boolean | null;
  scoring_snapshot?: unknown;
  originalMessageBodyOverride: string;
  originalMessageTemplateCode: string;
  messageBodyOverride: string;
  messageTemplateCode: string;
  originalStepLabel: string;
  stepLabel: string;
  originalResponseWindowMinutes: string;
  responseWindowMinutes: string;
  originalExpectedSymptomsText: string;
  expectedSymptomsText: string;
  originalEscalationWeight: string;
  escalationWeight: string;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
};

type EditableStepField =
  | 'messageBodyOverride'
  | 'messageTemplateCode'
  | 'stepLabel'
  | 'responseWindowMinutes'
  | 'expectedSymptomsText'
  | 'escalationWeight';

function formatReadonly(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

function symptomsToTextarea(value: string[] | null | undefined): string {
  if (!value?.length) return '';
  return value.join('\n');
}

function apiRowToEditor(s: ApiStepRow): StepEditorState {
  const ob = s.message_body_override ?? '';
  const tc = s.message_template_code ?? '';
  const label = s.step_label ?? '';
  const windowMinutes = s.response_window_minutes != null ? String(s.response_window_minutes) : '';
  const symptomsText = symptomsToTextarea(s.expected_symptoms);
  const weight = s.escalation_weight != null ? String(s.escalation_weight) : '';

  return {
    id: s.id,
    offset_minutes: s.offset_minutes,
    expected_response_type: s.expected_response_type,
    step_order: s.step_order,
    is_active: s.is_active,
    scoring_snapshot: s.scoring_snapshot,
    originalMessageBodyOverride: ob,
    originalMessageTemplateCode: tc,
    messageBodyOverride: ob,
    messageTemplateCode: tc,
    originalStepLabel: label,
    stepLabel: label,
    originalResponseWindowMinutes: windowMinutes,
    responseWindowMinutes: windowMinutes,
    originalExpectedSymptomsText: symptomsText,
    expectedSymptomsText: symptomsText,
    originalEscalationWeight: weight,
    escalationWeight: weight,
    isSaving: false,
    saveError: null,
    saveSuccess: false,
  };
}

function stepIsDirty(s: StepEditorState): boolean {
  return (
    s.messageBodyOverride !== s.originalMessageBodyOverride ||
    s.messageTemplateCode !== s.originalMessageTemplateCode ||
    s.stepLabel !== s.originalStepLabel ||
    s.responseWindowMinutes !== s.originalResponseWindowMinutes ||
    s.expectedSymptomsText !== s.originalExpectedSymptomsText ||
    s.escalationWeight !== s.originalEscalationWeight
  );
}

function trimOrNull(v: string | null | undefined) {
  if (v == null) return null;
  const t = String(v).trim();
  return t === '' ? null : t;
}

function parseSymptomsFromTextarea(text: string): string[] | null {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length === 0 ? null : lines;
}

function parseResponseWindowMinutes(
  value: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (trimmed === '') return { ok: true, value: null };
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: 'Response window must be blank or a number ≥ 0' };
  }
  return { ok: true, value: n };
}

function parseEscalationWeight(
  value: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (trimmed === '') return { ok: true, value: null };
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: 'Escalation weight must be blank or a number > 0' };
  }
  return { ok: true, value: n };
}

function getStepValidationError(step: StepEditorState): string | null {
  const windowResult = parseResponseWindowMinutes(step.responseWindowMinutes);
  if (!windowResult.ok) return windowResult.error;
  const weightResult = parseEscalationWeight(step.escalationWeight);
  if (!weightResult.ok) return weightResult.error;
  return null;
}

function getInvalidField(
  step: StepEditorState,
): 'responseWindowMinutes' | 'escalationWeight' | null {
  const windowResult = parseResponseWindowMinutes(step.responseWindowMinutes);
  if (!windowResult.ok) return 'responseWindowMinutes';
  const weightResult = parseEscalationWeight(step.escalationWeight);
  if (!weightResult.ok) return 'escalationWeight';
  return null;
}

function buildPatchBody(step: StepEditorState) {
  const windowResult = parseResponseWindowMinutes(step.responseWindowMinutes);
  const weightResult = parseEscalationWeight(step.escalationWeight);
  if (!windowResult.ok || !weightResult.ok) return null;

  return {
    message_body_override: trimOrNull(step.messageBodyOverride),
    message_template_code: trimOrNull(step.messageTemplateCode),
    step_label: trimOrNull(step.stepLabel),
    response_window_minutes: windowResult.value,
    expected_symptoms: parseSymptomsFromTextarea(step.expectedSymptomsText),
    escalation_weight: weightResult.value,
  };
}

export default function ProtocolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const protocolId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  const [protocolMeta, setProtocolMeta] = useState<ProtocolDetail | null>(null);
  const [draftVersion, setDraftVersion] = useState<DraftVersion | null>(null);
  const [stepEditors, setStepEditors] = useState<StepEditorState[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [createDraftError, setCreateDraftError] = useState<string | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<ProtocolVersionHistoryRow[]>([]);
  const [versionHistoryLoading, setVersionHistoryLoading] = useState(true);
  const [versionHistoryError, setVersionHistoryError] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const anyDirty = stepEditors.some(stepIsDirty);
  const anySaving = stepEditors.some((s) => s.isSaving);
  const anyValidationError = stepEditors.some((s) => getStepValidationError(s) != null);
  const activeStepCount = stepEditors.filter((s) => s.is_active !== false).length;

  const fetchProtocolDetail = useCallback(async () => {
    const detailOut = await appApiFetch(`/app/protocols/${protocolId}`);
    if (detailOut.status === 401) {
      router.replace('/auth/signin');
      return null;
    }
    if (!detailOut.ok) return null;
    const dj = await detailOut.json();
    const row = (dj.protocol as ProtocolDetail | undefined) ?? null;
    setProtocolMeta(row);
    return row;
  }, [protocolId, router]);

  const loadStepsForVersion = useCallback(
    async (versionId: string) => {
      const stepsRes = await appApiFetch(`/app/protocols/${protocolId}/versions/${versionId}/steps`);
      if (stepsRes.status === 401) {
        router.replace('/auth/signin');
        return false;
      }
      if (stepsRes.status === 403) {
        setAccessDenied(true);
        setStepEditors([]);
        return false;
      }
      if (!stepsRes.ok) {
        const sj = await stepsRes.json().catch(() => ({}));
        setErr(typeof sj.error === 'string' ? sj.error : stepsRes.statusText);
        setStepEditors([]);
        return false;
      }
      const sj = await stepsRes.json();
      const rows = (sj.steps || []) as ApiStepRow[];
      setStepEditors(rows.map(apiRowToEditor));
      return true;
    },
    [protocolId, router],
  );

  const fetchVersionHistory = useCallback(async () => {
    setVersionHistoryLoading(true);
    setVersionHistoryError(null);
    try {
      const res = await appApiFetch(`/app/protocols/${protocolId}/versions`);
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setVersionHistory([]);
        setVersionHistoryError(
          typeof json.error === 'string' ? json.error : 'Could not load version history.',
        );
        return;
      }
      const json = await res.json();
      setVersionHistory((json.versions || []) as ProtocolVersionHistoryRow[]);
    } catch {
      setVersionHistory([]);
      setVersionHistoryError('Could not load version history.');
    } finally {
      setVersionHistoryLoading(false);
    }
  }, [protocolId, router]);

  const refreshAfterPublish = useCallback(
    async (published: DraftVersion) => {
      setDraftVersion(null);
      setPublishSuccess(`Published as version ${published.version_number}.`);
      setPublishError(null);
      await fetchProtocolDetail();
      await loadStepsForVersion(published.id);
      await fetchVersionHistory();
    },
    [fetchProtocolDetail, loadStepsForVersion, fetchVersionHistory],
  );

  const load = useCallback(async () => {
    if (!protocolId) {
      setErr('invalid_protocol');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    setPublishError(null);
    setCreateDraftError(null);
    try {
      const session = getAppSession();
      if (!session) {
        router.replace('/auth/signin');
        return;
      }

      if (!canViewProtocols(session.role)) {
        setAccessDenied(true);
        return;
      }

      const [detailOut] = await Promise.all([
        appApiFetch(`/app/protocols/${protocolId}`),
        fetchVersionHistory(),
      ]);
      if (detailOut.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      if (detailOut.status === 403) {
        setAccessDenied(true);
        setProtocolMeta(null);
        setDraftVersion(null);
        setStepEditors([]);
        return;
      }
      if (!detailOut.ok) {
        const dj = await detailOut.json().catch(() => ({}));
        setErr(typeof dj.error === 'string' ? dj.error : detailOut.statusText);
        setProtocolMeta(null);
        setDraftVersion(null);
        setStepEditors([]);
        return;
      }

      const dj = await detailOut.json();
      const protocol = dj.protocol as ProtocolDetail | undefined;
      if (!protocol?.id) {
        setErr('protocol_not_found');
        setProtocolMeta(null);
        setDraftVersion(null);
        setStepEditors([]);
        return;
      }
      setProtocolMeta(protocol);

      if (protocol.current_draft_version?.id) {
        setDraftVersion({
          id: protocol.current_draft_version.id,
          version_number: protocol.current_draft_version.version_number,
          status: 'draft',
        });
        const stepsOk = await loadStepsForVersion(protocol.current_draft_version.id);
        if (!stepsOk) return;
        return;
      }

      setDraftVersion(null);
      if (protocol.latest_published_version?.id) {
        const stepsOk = await loadStepsForVersion(protocol.latest_published_version.id);
        if (!stepsOk) return;
        return;
      }

      setStepEditors([]);
      setErr('no_published_version');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load');
      setStepEditors([]);
    } finally {
      setLoading(false);
    }
  }, [protocolId, router, loadStepsForVersion, fetchVersionHistory]);

  async function createDraft() {
    if (!protocolId || draftVersion || creatingDraft) return;

    setCreatingDraft(true);
    setCreateDraftError(null);
    setPublishSuccess(null);

    try {
      const res = await appApiFetch(`/app/protocols/${protocolId}/versions/draft`, { method: 'POST' });
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateDraftError(typeof json.error === 'string' ? json.error : 'Could not create draft.');
        return;
      }

      const version = json.version as DraftVersion | undefined;
      if (!version?.id) {
        setCreateDraftError('Could not create draft.');
        return;
      }

      setDraftVersion(version);
      await fetchProtocolDetail();
      await fetchVersionHistory();
      const stepsOk = await loadStepsForVersion(version.id);
      if (!stepsOk) return;
    } catch {
      setCreateDraftError('Could not create draft.');
    } finally {
      setCreatingDraft(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  async function confirmPublishDraft() {
    if (!protocolId || !draftVersion?.id) return;

    setPublishing(true);
    setPublishError(null);

    try {
      const res = await appApiFetch(
        `/app/protocols/${protocolId}/versions/${draftVersion.id}/publish`,
        { method: 'POST' },
      );
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiError = typeof json.error === 'string' ? json.error : '';
        if (apiError === 'version_not_draft') {
          setPublishError('This version is no longer a draft.');
        } else if (apiError === 'at_least_one_active_step_required') {
          setPublishError('A protocol must have at least one active step before publishing.');
        } else {
          setPublishError('Could not publish draft.');
        }
        return;
      }

      const published = json.version as DraftVersion | undefined;
      if (!published?.id) {
        setPublishError('Could not publish draft.');
        return;
      }

      setPublishModalOpen(false);
      await refreshAfterPublish(published);
    } catch {
      setPublishError('Could not publish draft.');
    } finally {
      setPublishing(false);
    }
  }

  useEffect(() => {
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [anyDirty]);

  useEffect(() => {
    if (stepEditors.length === 0) {
      setSelectedStepId(null);
      return;
    }
    setSelectedStepId((current) =>
      current && stepEditors.some((step) => step.id === current)
        ? current
        : stepEditors[0]?.id ?? null,
    );
  }, [stepEditors]);

  function updateStepField(id: string, field: EditableStepField, value: string) {
    setStepEditors((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              [field]: value,
              saveError: null,
              saveSuccess: false,
            }
          : s,
      ),
    );
  }

  async function saveStep(step: StepEditorState) {
    if (!protocolId || !draftVersion?.id) return;
    if (!stepIsDirty(step)) return;

    const validationError = getStepValidationError(step);
    if (validationError) {
      setStepEditors((prev) =>
        prev.map((s) => (s.id === step.id ? { ...s, saveError: validationError } : s)),
      );
      return;
    }

    const body = buildPatchBody(step);
    if (!body) return;

    setStepEditors((prev) =>
      prev.map((s) => (s.id === step.id ? { ...s, isSaving: true, saveError: null } : s)),
    );

    try {
      const res = await appApiFetch(
        `/app/protocols/${protocolId}/versions/${draftVersion.id}/steps/${step.id}`,
        { method: 'PATCH', body },
      );
      if (res.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStepEditors((prev) =>
          prev.map((s) =>
            s.id === step.id
              ? {
                  ...s,
                  isSaving: false,
                  saveError: 'Could not save changes',
                }
              : s,
          ),
        );
        return;
      }

      const saved = json.step as ApiStepRow | undefined;
      if (!saved?.id) {
        setStepEditors((prev) =>
          prev.map((s) =>
            s.id === step.id
              ? {
                  ...s,
                  isSaving: false,
                  saveError: 'Could not save changes',
                }
              : s,
          ),
        );
        return;
      }

      setStepEditors((prev) =>
        prev.map((s) => (s.id === step.id ? { ...apiRowToEditor(saved), saveSuccess: true } : s)),
      );
    } catch {
      setStepEditors((prev) =>
        prev.map((s) =>
          s.id === step.id
            ? {
                ...s,
                isSaving: false,
                saveError: 'Could not save changes',
              }
            : s,
        ),
      );
    }
  }

  async function saveAllDirtySteps() {
    if (!draftVersion?.id) return;
    const dirtySteps = stepEditors.filter(stepIsDirty);
    for (const step of dirtySteps) {
      await saveStep(step);
    }
  }

  if (!protocolId) {
    return (
      <div className={styles.page}>
        <Alert variant="danger">Invalid protocol.</Alert>
        <Link href="/protocols" className={styles.backLink}>
          ← Protocol Library
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <LoadingState label="Loading protocol…" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <AccessDeniedState message="You do not have permission to view this protocol." />
    );
  }

  const title = protocolMeta?.name?.trim() || `Protocol ${protocolId.slice(0, 8)}…`;
  const liveVersionNumber = protocolMeta?.latest_published_version?.version_number ?? null;
  const role = getAppSession()?.role;
  const roleCanEdit = canEditProtocols(role);
  const roleCanPublish = canPublishProtocols(role);
  const isReadOnly = !draftVersion || !roleCanEdit;
  const canCreateDraft = roleCanEdit && !draftVersion && !creatingDraft && !loading;
  const canPublish =
    roleCanPublish &&
    Boolean(draftVersion?.id) &&
    !anyDirty &&
    !anySaving &&
    activeStepCount > 0 &&
    !publishing;

  const canSaveDraft =
    roleCanEdit &&
    Boolean(draftVersion?.id) &&
    anyDirty &&
    !anySaving &&
    !anyValidationError;

  const publishDisabledReason = !draftVersion
    ? null
    : !roleCanPublish
      ? 'Only clinic administrators can publish protocol versions.'
      : anyDirty
        ? 'Save all changes before publishing.'
        : anySaving
          ? 'Wait for saves to finish before publishing.'
          : activeStepCount === 0
            ? 'A protocol must have at least one active step before publishing.'
            : null;

  const versionLabel = draftVersion
    ? `Draft v${draftVersion.version_number}`
    : liveVersionNumber != null
      ? `Published v${liveVersionNumber}`
      : 'No published version';

  const stepListItems = stepEditors.map((step) => {
    const dirty = stepIsDirty(step);
    const validationError = getStepValidationError(step);
    const status = getStepStatus(step, dirty, validationError);

    return {
      id: step.id,
      stepOrder: formatReadonly(step.step_order),
      label: step.stepLabel.trim() || `Step ${formatReadonly(step.step_order)}`,
      timing: formatProtocolTiming(step.offset_minutes),
      statusLine: status.line,
      statusTone: status.tone,
    };
  });

  const selectedStep = stepEditors.find((step) => step.id === selectedStepId) ?? null;
  const selectedDirty = selectedStep ? stepIsDirty(selectedStep) : false;
  const selectedValidationError = selectedStep ? getStepValidationError(selectedStep) : null;
  const selectedStatus = selectedStep
    ? getStepStatus(selectedStep, selectedDirty, selectedValidationError)
    : { line: null, tone: null as StepStatusTone };
  const selectedCanSave =
    roleCanEdit &&
    Boolean(draftVersion) &&
    Boolean(selectedStep) &&
    selectedDirty &&
    !selectedStep?.isSaving &&
    !selectedValidationError;

  const selectedInvalidField = selectedStep ? getInvalidField(selectedStep) : null;

  return (
    <div className={styles.page}>
      <ProtocolEditorToolbar
        title={title}
        procedureType={formatProcedureType(protocolMeta?.procedure_type)}
        versionLabel={versionLabel}
        stepCount={stepEditors.length}
        lastEditedLabel={formatLastEditedLabel(protocolMeta?.updated_at) ?? undefined}
        isReadOnly={isReadOnly}
        draftVersion={draftVersion}
        liveVersionNumber={liveVersionNumber}
        canCreateDraft={canCreateDraft}
        canPublish={canPublish}
        canSaveDraft={canSaveDraft}
        creatingDraft={creatingDraft}
        publishDisabledReason={publishDisabledReason}
        createDraftError={createDraftError}
        onCreateDraft={() => void createDraft()}
        onSaveDraft={() => void saveAllDirtySteps()}
        onPublishClick={() => {
          setPublishError(null);
          setPublishModalOpen(true);
        }}
      />

      <ProtocolEditorBanners
        isReadOnly={isReadOnly}
        liveVersionNumber={liveVersionNumber}
        publishSuccess={publishSuccess && !draftVersion ? publishSuccess : null}
        publishError={publishError}
        publishModalOpen={publishModalOpen}
      />

      {err ? (
        <Alert variant="danger">
          {err === 'no_published_version' ? 'This protocol has no published version yet.' : err}
        </Alert>
      ) : (
        <div className={styles.editorSplit}>
          <ProtocolEditorStepList
            steps={stepListItems}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
          />
          <div className={styles.stepEditorPane}>
            {selectedStep ? (
              <ProtocolEditorStepDetail
                stepOrder={formatReadonly(selectedStep.step_order)}
                timing={formatProtocolTiming(selectedStep.offset_minutes)}
                responseType={formatExpectedResponseType(selectedStep.expected_response_type)}
                scoringLines={formatScoringSnapshotDisplay(selectedStep.scoring_snapshot)}
                isReadOnly={isReadOnly}
                stepLabel={selectedStep.stepLabel}
                responseWindowMinutes={selectedStep.responseWindowMinutes}
                expectedSymptomsText={selectedStep.expectedSymptomsText}
                escalationWeight={selectedStep.escalationWeight}
                messageBodyOverride={selectedStep.messageBodyOverride}
                messageTemplateCode={selectedStep.messageTemplateCode}
                statusLine={selectedStatus.line}
                statusTone={selectedStatus.tone}
                invalidField={selectedInvalidField}
                canSave={selectedCanSave}
                onFieldChange={(field, value) => updateStepField(selectedStep.id, field, value)}
                onSave={() => void saveStep(selectedStep)}
              />
            ) : (
              <ProtocolEditorStepEmpty />
            )}
          </div>
        </div>
      )}

      <ProtocolVersionHistorySection
        loading={versionHistoryLoading}
        error={versionHistoryError}
        rows={versionHistory}
        formatDate={formatProtocolDate}
      />

      <Modal
        open={publishModalOpen}
        onClose={() => {
          if (!publishing) setPublishModalOpen(false);
        }}
        title="Publish Protocol Version?"
        size="sm"
        footer={
          <>
            <SCButton
              variant="secondary"
              disabled={publishing}
              onClick={() => setPublishModalOpen(false)}
              className="!w-auto"
            >
              Cancel
            </SCButton>
            <SCButton
              variant="primary"
              disabled={publishing}
              onClick={() => void confirmPublishDraft()}
              className="!w-auto"
            >
              {publishing ? 'Publishing…' : 'Publish Version'}
            </SCButton>
          </>
        }
      >
        <p className="m-0 text-[length:var(--sc-text-base)] leading-[var(--sc-line-body)] text-[var(--sc-text-primary)]">
          Version {draftVersion?.version_number ?? '—'} will become the active protocol for all
          future patient enrolments.
        </p>
        <p className="mt-3 mb-0 text-[length:var(--sc-text-base)] leading-[var(--sc-line-body)] text-[var(--sc-text-secondary)]">
          Existing patients will continue using their current protocol version.
        </p>
        {publishError ? (
          <div className="mt-4">
            <Alert variant="danger">{publishError}</Alert>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
