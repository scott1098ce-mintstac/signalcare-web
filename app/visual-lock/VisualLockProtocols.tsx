'use client';

import {
  ProtocolLibraryRow,
  ProtocolLibrarySection,
  UseTemplateButton,
} from '../components/ProtocolLibrarySection';
import {
  formatCurrentVersion,
  formatProcedureType,
  formatProtocolDate,
} from '../lib/protocol-types';
import {
  VISUAL_LOCK_CLINIC_PROTOCOLS,
  VISUAL_LOCK_PROTOCOL_TEMPLATES,
} from '../lib/visual-lock/fixtures';
import styles from '../components/protocol-library/protocol-library.module.css';

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

export function VisualLockProtocols() {
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
        loading={false}
        error={null}
        isEmpty={false}
        dataNodeId="protocol-library-my-protocols"
      >
        {VISUAL_LOCK_CLINIC_PROTOCOLS.map((p) => (
          <ProtocolLibraryRow
            key={p.id}
            columns={MY_COLUMNS}
            href={`/protocols/${p.id}`}
            name={p.name}
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
        loading={false}
        error={null}
        isEmpty={false}
        dataNodeId="protocol-library-templates"
      >
        {VISUAL_LOCK_PROTOCOL_TEMPLATES.map((t) => {
          const pub = t.latest_published_version;
          const versionLabel = pub?.version_number != null ? `v${pub.version_number}` : '—';
          const stepCount = pub?.step_count != null ? String(pub.step_count) : '—';
          return (
            <ProtocolLibraryRow
              key={t.id}
              columns={TEMPLATE_COLUMNS}
              name={t.name}
              procedureType={formatProcedureType(t.procedure_type)}
              version={versionLabel}
              meta={`${stepCount} step${stepCount === '1' ? '' : 's'}`}
              action={<UseTemplateButton disabled={!pub?.id} onClick={() => {}} />}
            />
          );
        })}
      </ProtocolLibrarySection>
    </div>
  );
}
