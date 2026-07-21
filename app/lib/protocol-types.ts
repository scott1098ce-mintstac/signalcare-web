import { appApiFetch } from './api';

export type ProtocolVersionSummary = {
  id: string;
  version_number: number;
};

export type ClinicProtocol = {
  id: string;
  name: string;
  procedure_type: string;
  is_active: boolean;
  updated_at: string | null;
  latest_published_version: ProtocolVersionSummary | null;
  current_draft_version: ProtocolVersionSummary | null;
};

export type TemplatePublishedVersion = {
  id: string;
  version_number: number;
  published_at: string | null;
  step_count: number;
};

export type ProtocolTemplate = {
  id: string;
  name: string;
  procedure_type: string;
  clinic_type: string | null;
  updated_at: string | null;
  latest_published_version: TemplatePublishedVersion | null;
  already_cloned: boolean;
  clinic_copy_id: string | null;
};

export function formatProcedureType(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .split('_')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export function formatProtocolDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Relative "Last edited …" label for protocol metadata chips (presentation only). */
export function formatLastEditedLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const editedAt = new Date(iso);
  if (!Number.isFinite(editedAt.getTime())) return null;

  const diffMinutes = Math.floor((Date.now() - editedAt.getTime()) / 60_000);
  if (diffMinutes < 1) return 'Last edited just now';
  if (diffMinutes < 60) {
    return `Last edited ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Last edited ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  return `Last edited ${formatProtocolDate(iso)}`;
}

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;
const MINUTES_PER_WEEK = 10080;

function pluralUnit(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function formatDecimalHours(hours: number): string {
  const fixed = hours < 1 ? hours.toFixed(2) : hours.toFixed(1);
  return String(parseFloat(fixed));
}

/** Human-readable check-in timing from protocol_steps.offset_minutes (presentation only). */
export function formatProtocolTiming(offsetMinutes: number | null | undefined): string {
  if (offsetMinutes == null || !Number.isFinite(Number(offsetMinutes))) {
    return '—';
  }

  const minutes = Number(offsetMinutes);
  if (minutes < 0) return '—';

  const suffix = ' after treatment';

  if (minutes % MINUTES_PER_HOUR === 0 && minutes < MINUTES_PER_DAY) {
    const hours = minutes / MINUTES_PER_HOUR;
    return `${hours} ${pluralUnit(hours, 'hour', 'hours')}${suffix}`;
  }

  if (minutes % MINUTES_PER_DAY === 0) {
    const days = minutes / MINUTES_PER_DAY;
    return `${days} ${pluralUnit(days, 'day', 'days')}${suffix}`;
  }

  if (minutes % MINUTES_PER_WEEK === 0) {
    const weeks = minutes / MINUTES_PER_WEEK;
    return `${weeks} ${pluralUnit(weeks, 'week', 'weeks')}${suffix}`;
  }

  const hours = minutes / MINUTES_PER_HOUR;
  return `${formatDecimalHours(hours)} ${hours === 1 ? 'hour' : 'hours'}${suffix}`;
}

export function formatCurrentVersion(protocol: ClinicProtocol): string {
  if (protocol.latest_published_version?.version_number != null) {
    return `v${protocol.latest_published_version.version_number}`;
  }
  if (protocol.current_draft_version?.version_number != null) {
    return `Draft v${protocol.current_draft_version.version_number}`;
  }
  return '—';
}

export async function fetchClinicProtocols(): Promise<{
  ok: boolean;
  status: number;
  protocols: ClinicProtocol[];
  error?: string;
}> {
  const res = await appApiFetch('/app/protocols?limit=100');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      protocols: [],
      error: json.error || res.statusText,
    };
  }
  return { ok: true, status: res.status, protocols: json.protocols || [] };
}

export async function fetchProtocolTemplates(): Promise<{
  ok: boolean;
  status: number;
  templates: ProtocolTemplate[];
  error?: string;
}> {
  const res = await appApiFetch('/app/protocols/templates');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      templates: [],
      error: json.error || res.statusText,
    };
  }
  return { ok: true, status: res.status, templates: json.templates || [] };
}

export async function cloneProtocolTemplate(
  templateId: string,
  name: string,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const res = await appApiFetch(`/app/protocols/${templateId}/clone`, {
    method: 'POST',
    body: { name },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, error: json.error || res.statusText };
  }
  return { ok: true, status: res.status };
}

export function filterClinicOwnedProtocols(
  protocols: ClinicProtocol[],
  templateIds: Set<string>,
): ClinicProtocol[] {
  return protocols.filter((p) => !templateIds.has(p.id));
}

export function isEnrolmentEligibleProtocol(
  protocol: ClinicProtocol | undefined,
): protocol is ClinicProtocol {
  if (!protocol) return false;
  return protocol.is_active !== false && Boolean(protocol.latest_published_version);
}

/**
 * One enrolment option per template lineage: prefer clinic clone when published, else global template.
 */
export function buildEnrolmentProtocolOptions(
  templates: ProtocolTemplate[],
  protocols: ClinicProtocol[],
): ClinicProtocol[] {
  const byId = new Map(protocols.map((p) => [p.id, p]));
  const templateIds = new Set(templates.map((t) => t.id));
  const options: ClinicProtocol[] = [];
  const usedIds = new Set<string>();

  for (const template of templates) {
    const cloneId = template.clinic_copy_id;
    const clone = cloneId ? byId.get(cloneId) : undefined;
    if (isEnrolmentEligibleProtocol(clone)) {
      options.push(clone);
      usedIds.add(clone.id);
      continue;
    }
    const global = byId.get(template.id);
    if (isEnrolmentEligibleProtocol(global)) {
      options.push(global);
      usedIds.add(global.id);
    }
  }

  for (const p of protocols) {
    if (usedIds.has(p.id) || templateIds.has(p.id)) continue;
    if (isEnrolmentEligibleProtocol(p)) {
      options.push(p);
      usedIds.add(p.id);
    }
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}
