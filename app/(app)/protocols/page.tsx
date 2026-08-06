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
  formatProcedureType,
  type ClinicProtocol,
  type ProtocolTemplate,
} from '../../lib/protocol-types';
import {
  ProtocolLibraryOperationalRow,
  ProtocolLibraryRow,
  ProtocolLibrarySection,
  UseTemplateButton,
} from '../../components/ProtocolLibrarySection';
import { ProtocolLibraryHeader } from '../../components/protocol-library/ProtocolLibraryHeader';
import {
  MY_PROTOCOLS_COLUMNS,
  TEMPLATE_COLUMNS,
  presentProtocolLibraryRow,
} from '../../components/protocol-library/protocol-library-v2-model';
import { UseTemplateModal } from '../../components/UseTemplateModal';
import { humanizeError, logInternalError } from '../../lib/user-facing-errors';
import styles from '../../components/protocol-library/protocol-library.module.css';

const MY_COLUMNS = MY_PROTOCOLS_COLUMNS.filter(
  (column) => column.key !== 'owner' && column.key !== 'health',
);
const MY_GRID =
  'minmax(11rem, 1.6fr) minmax(6.5rem, 1fr) minmax(4.5rem, 0.7fr) minmax(5rem, 0.75fr) minmax(5rem, 0.75fr) minmax(6rem, 0.9fr)';
const TMPL_COLUMNS = [...TEMPLATE_COLUMNS];

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
        setErrMy(humanizeError(protocolsResult.error, 'We couldn’t load protocols. Please try again.'));
        setMyProtocols([]);
        return;
      }

      if (!templatesResult.ok) {
        setErrTemplates(
          humanizeError(templatesResult.error, 'We couldn’t load protocol templates. Please try again.'),
        );
        setTemplates([]);
      } else {
        setTemplates(templatesResult.templates);
      }

      const templateIds = new Set(
        (templatesResult.ok ? templatesResult.templates : []).map((t) => t.id),
      );
      setMyProtocols(filterClinicOwnedProtocols(protocolsResult.protocols, templateIds));
    } catch (e) {
      logInternalError('protocols.loadMyProtocols', e);
      setErrMy(humanizeError(e, 'We couldn’t load protocols. Please try again.'));
      setMyProtocols([]);
    } finally {
      setLoadingMy(false);
    }
  }, [router]);

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
        setErrTemplates(
          humanizeError(result.error, 'We couldn’t load protocol templates. Please try again.'),
        );
        setTemplates([]);
        return;
      }
      setTemplates(result.templates);
    } catch (e) {
      logInternalError('protocols.loadTemplates', e);
      setErrTemplates(humanizeError(e, 'We couldn’t load protocol templates. Please try again.'));
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [router]);

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
      <ProtocolLibraryHeader />

      <ProtocolLibrarySection
        title="My Protocols"
        description="Your clinic’s active monitoring protocols — open one to improve and publish."
        columns={MY_COLUMNS}
        gridTemplateColumns={MY_GRID}
        prominence="primary"
        emptyTitle="No clinic protocols yet"
        emptyDescription="Use a SignalCare template below to create your first protocol."
        loading={loadingMy}
        error={errMy}
        isEmpty={!loadingMy && !errMy && sortedMyProtocols.length === 0}
        dataNodeId="protocol-library-my-protocols"
      >
        {sortedMyProtocols.map((p) => {
          const row = presentProtocolLibraryRow(p);
          return (
            <ProtocolLibraryOperationalRow
              key={p.id}
              columns={MY_COLUMNS}
              gridTemplateColumns={MY_GRID}
              href={`/protocols/${p.id}`}
              name={p.name ?? '—'}
              procedureType={formatProcedureType(p.procedure_type)}
              status={row.status}
              currentVersion={row.currentVersion}
              draft={row.draft}
              lastPublished={row.lastPublished}
            />
          );
        })}
      </ProtocolLibrarySection>

      <ProtocolLibrarySection
        title="SignalCare Templates"
        description="Start from a SignalCare standard when adding a new clinic protocol."
        columns={TMPL_COLUMNS}
        prominence="secondary"
        emptyTitle="No templates available"
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
              columns={TMPL_COLUMNS}
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
