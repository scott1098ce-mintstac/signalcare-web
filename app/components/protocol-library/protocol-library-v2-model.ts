/**
 * Protocols V2 — library presentation model (specimen / derived display only).
 * Health overview values are placeholders until live protocol analytics exist.
 */

import type { ClinicProtocol } from '../../lib/protocol-types';
import { formatProtocolDate } from '../../lib/protocol-types';

export type ProtocolHealthLabel = 'Healthy' | 'Monitor' | 'Needs Review';

export type ProtocolLibraryHealthItem = {
  key: string;
  label: string;
  value: string;
  /** Quiet supporting line under the value. */
  context: string;
};

export type ProtocolLibraryRowPresentation = {
  status: string;
  currentVersion: string;
  draft: string;
  lastPublished: string;
  owner: string;
  health: ProtocolHealthLabel;
};

/** Presentation-only Protocol Health Overview (not wired to APIs). */
export const PROTOCOL_HEALTH_OVERVIEW_SPECIMEN: ProtocolLibraryHealthItem[] = [
  {
    key: 'active',
    label: 'Active Protocols',
    value: '6',
    context: 'Currently monitoring',
  },
  {
    key: 'patients',
    label: 'Patients Monitored',
    value: '42',
    context: 'Across active protocols',
  },
  {
    key: 'drafts',
    label: 'Drafts',
    value: '2',
    context: 'Ready to publish',
  },
  {
    key: 'review',
    label: 'Requiring Review',
    value: '1',
    context: 'Needs attention',
  },
];

const SPECIMEN_OWNERS = ['Clinic Admin', 'Dr. Chen', 'Practice Manager', 'Clinical Lead'] as const;

function stableIndex(id: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

/**
 * Row presentation for My Protocols.
 * Version/draft/status derive from existing protocol fields.
 * Owner/health remain specimen-only for visual fixtures — live library omits those columns.
 */
export function presentProtocolLibraryRow(protocol: ClinicProtocol): ProtocolLibraryRowPresentation {
  const published = protocol.latest_published_version;
  const draftVersion = protocol.current_draft_version;
  const hasPublished = published?.version_number != null;
  const hasDraft = draftVersion?.version_number != null;

  const status = protocol.is_active === false ? 'Inactive' : hasPublished ? 'Active' : 'Draft';
  const currentVersion = hasPublished ? `v${published!.version_number}` : '—';
  const draft = hasDraft ? `Draft v${draftVersion!.version_number}` : '—';
  const lastPublished = hasPublished ? formatProtocolDate(protocol.updated_at) : '—';

  // Specimen fields for visual fixtures only — do not render on live Protocols page.
  const owner = SPECIMEN_OWNERS[stableIndex(protocol.id, SPECIMEN_OWNERS.length)];
  let health: ProtocolHealthLabel = 'Healthy';
  if (hasDraft && hasPublished) {
    health = stableIndex(protocol.id, 2) === 0 ? 'Needs Review' : 'Monitor';
  } else if (!hasPublished) {
    health = 'Needs Review';
  }

  return {
    status,
    currentVersion,
    draft,
    lastPublished,
    owner,
    health,
  };
}

export const MY_PROTOCOLS_COLUMNS = [
  { key: 'name', label: 'Protocol' },
  { key: 'procedure', label: 'Procedure' },
  { key: 'status', label: 'Status' },
  { key: 'version', label: 'Current Version' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Last Published' },
  { key: 'owner', label: 'Owner' },
  { key: 'health', label: 'Health' },
] as const;

/** Desktop grid for operational My Protocols table. */
export const MY_PROTOCOLS_GRID =
  'minmax(11rem, 1.6fr) minmax(6.5rem, 1fr) minmax(4.5rem, 0.7fr) minmax(5rem, 0.75fr) minmax(5rem, 0.75fr) minmax(6rem, 0.9fr) minmax(6rem, 0.9fr) minmax(5.5rem, 0.85fr)';

export const TEMPLATE_COLUMNS = [
  { key: 'name', label: 'Template name' },
  { key: 'procedure', label: 'Procedure type' },
  { key: 'version', label: 'Version' },
  { key: 'steps', label: 'Step count' },
  { key: 'action', label: '' },
] as const;
