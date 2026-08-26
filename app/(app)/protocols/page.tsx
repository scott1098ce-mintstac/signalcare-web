'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '../../lib/auth';
import { canEditProtocols, canViewProtocols } from '../../lib/app-permissions';
import { AccessDeniedState } from '../../components/AccessDeniedState';
import {
  fetchClinicProtocols,
  fetchProtocolTemplates,
  filterClinicOwnedProtocols,
  formatCurrentVersion,
  formatProcedureType,
  formatProtocolDate,
  type ClinicProtocol,
  type ProtocolTemplate,
} from '../../lib/protocol-types';
import {
  ProtocolLibraryRow,
  ProtocolLibrarySection,
  UseTemplateButton,
} from '../../components/ProtocolLibrarySection';
import { UseTemplateModal } from '../../components/UseTemplateModal';
import styles from '../../components/protocol-library/protocol-library.module.css';

const MY_COLUMNS = [
  { key: 'name', label: 'Protocol name' },
  { key: 'procedure', label: 'Procedure type' },
  { key: 'version', label: 'Current version' },
  { key: 'updated', label: 'Updated' },
];

const TEMPLATE_COLUMNS = [
  { key: 'name', label: 'Template name' },
  { key: 'procedure', label: 'Procedure type' },
  { key: 'version', label: 'Version' },
  { key: 'steps', label: 'Step count' },
  { key: 'action', label: '' },
];

export default function ProtocolLibraryPage() {
  const router = useRouter();
  const { ready: authReady, session } = useRequireAuth();
  const canEdit = canEditProtocols(session?.role);
  const canView = canViewProtocols(session?.role);
  const [myProtocols, setMyProtocols] = useState<ClinicProtocol[]>([]);
  const [templates, setTemplates] = useState<ProtocolTemplate[]>([]);
  const [loadingMy, setLoadingMy] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [errMy, setErrMy] = useState<string | null>(null);
  const [errTemplates, setErrTemplates] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProtocolTemplate | null>(null);

  const loadMyProtocols = useCallback(async () => {
    setLoadingMy(true);
    setErrMy(null);
    try {
      const [protocolsResult, templatesResult] = await Promise.all([
        fetchClinicProtocols(),
        fetchProtocolTemplates(),
      ]);

      if (protocolsResult.status === 401 || templatesResult.status === 401) {
        router.replace('/auth/signin');
        return;
      }

      if (protocolsResult.status === 403 || templatesResult.status === 403) {
        setAccessDenied(true);
        setMyProtocols([]);
        setTemplates([]);
        return;
      }

      if (!protocolsResult.ok) {
        setErrMy(protocolsResult.error || 'Failed to load protocols');
        setMyProtocols([]);
        return;
      }

      if (!templatesResult.ok) {
        setErrTemplates(templatesResult.error || 'Failed to load templates');
        setTemplates([]);
      } else {
        setTemplates(templatesResult.templates);
      }

      const templateIds = new Set(
        (templatesResult.ok ? templatesResult.templates : []).map((t) => t.id),
      );
      setMyProtocols(filterClinicOwnedProtocols(protocolsResult.protocols, templateIds));
    } catch (e) {
      setErrMy(e instanceof Error ? e.message : 'Failed to load protocols');
      setMyProtocols([]);
    } finally {
      setLoadingMy(false);
    }
  }, [router, session?.clinic?.id]);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    setErrTemplates(null);
    try {
      const result = await fetchProtocolTemplates();
      if (result.status === 401) {
        router.replace('/auth/signin');
        return;
      }
      if (result.status === 403) {
        setAccessDenied(true);
        setTemplates([]);
        return;
      }
      if (!result.ok) {
        setErrTemplates(result.error || 'Failed to load templates');
        setTemplates([]);
        return;
      }
      setTemplates(result.templates);
    } catch (e) {
      setErrTemplates(e instanceof Error ? e.message : 'Failed to load templates');
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [router, session?.clinic?.id]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadMyProtocols(), loadTemplates()]);
  }, [loadMyProtocols, loadTemplates]);

  useEffect(() => {
    if (!authReady || !canView) return;
    void loadMyProtocols();
    void loadTemplates();
  }, [authReady, canView, loadMyProtocols, loadTemplates]);

  const sortedMyProtocols = useMemo(
    () =>
      [...myProtocols].sort((a, b) => {
        const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return tb - ta;
      }),
    [myProtocols],
  );

  const sortedTemplates = useMemo(
    () => [...templates].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [templates],
  );

  if ((authReady && !canView) || accessDenied) {
    return (
      <AccessDeniedState message="You do not have permission to view protocols." />
    );
  }

  return (
    <div className={styles.page} data-node-id="protocol-library-page">
      <p className={styles.pageIntro}>
        Manage clinic-owned monitoring protocols and create new ones from SignalCare templates.
      </p>

      <ProtocolLibrarySection
        title="My Clinic Protocols"
        description="Protocols owned by your clinic. These are used when enrolling patients for recovery monitoring."
        columns={MY_COLUMNS}
        emptyTitle="No clinic protocols yet"
        emptyDescription="Use a SignalCare template below to create your first protocol."
        loading={loadingMy}
        error={errMy}
        isEmpty={!loadingMy && !errMy && sortedMyProtocols.length === 0}
        dataNodeId="protocol-library-my-protocols"
      >
        {sortedMyProtocols.map((p) => (
          <ProtocolLibraryRow
            key={p.id}
            columns={MY_COLUMNS}
            href={`/protocols/${p.id}`}
            name={p.name ?? '—'}
            procedureType={formatProcedureType(p.procedure_type)}
            version={formatCurrentVersion(p)}
            meta={formatProtocolDate(p.updated_at)}
          />
        ))}
      </ProtocolLibrarySection>

      <ProtocolLibrarySection
        title="Starter Library"
        description="SignalCare starter protocols for your clinic type. Use a template to create a clinic-owned copy."
        columns={TEMPLATE_COLUMNS}
        emptyTitle="No starter protocols available"
        emptyDescription="Starter protocols appear here when SignalCare has published commercially ready content for your clinic type."
        loading={loadingTemplates}
        error={errTemplates}
        isEmpty={!loadingTemplates && !errTemplates && sortedTemplates.length === 0}
        dataNodeId="protocol-library-templates"
      >
        {sortedTemplates.map((t) => {
          const pub = t.latest_published_version;
          const versionLabel = pub?.version_number != null ? `v${pub.version_number}` : '—';
          const stepCount = pub?.step_count != null ? String(pub.step_count) : '—';
          const canUse = canEdit && Boolean(pub?.id) && (pub?.step_count ?? 0) > 0;

          return (
            <ProtocolLibraryRow
              key={t.id}
              columns={TEMPLATE_COLUMNS}
              name={t.name ?? '—'}
              procedureType={formatProcedureType(t.procedure_type)}
              version={versionLabel}
              meta={`${stepCount} step${stepCount === '1' ? '' : 's'}`}
              action={
                <UseTemplateButton
                  disabled={!canUse}
                  onClick={() => setSelectedTemplate(t)}
                />
              }
            />
          );
        })}
      </ProtocolLibrarySection>

      <UseTemplateModal
        key={selectedTemplate?.id ?? 'closed'}
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onSuccess={() => void refreshAll()}
      />
    </div>
  );
}
