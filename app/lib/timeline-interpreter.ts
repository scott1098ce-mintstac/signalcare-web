export type TimelineItem = {
  type: 'message' | 'alert' | 'escalation' | string;
  created_at: string;
  data: Record<string, unknown>;
};

export type TimelineEventKind = 'message' | 'alert' | 'escalation' | 'unknown';
export type MessageDirection = 'inbound' | 'outbound' | 'internal' | 'other';

export type InterpretedTimelineLine = {
  text: string;
  subtle?: string;
  at?: string;
};

export type InterpretedTimelineRow = {
  headline: string;
  created_at: string;
  preview?: string;
  lines: InterpretedTimelineLine[];
  eventKind: TimelineEventKind;
  messageDirection?: MessageDirection;
};

export function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(String(iso));
  if (!Number.isFinite(d.getTime())) return String(iso);
  return d.toLocaleString();
}

/** Shorten UUID for subtle audit display (no PII). */
export function shortId(uuid: string): string {
  const s = String(uuid).trim();
  if (s.length >= 8) return `${s.slice(0, 8)}…`;
  return s || '—';
}

function strField(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return null;
}

function truncateText(text: string, max: number): string {
  const t = text.trim();
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/**
 * Frontend-only interpretation of `/app/enrolments/:id/timeline` items.
 * Does not change ordering: still one card per API row, chronological by `created_at` in the list.
 */
export function interpretTimelineItem(it: TimelineItem): InterpretedTimelineRow {
  const data = (it?.data && typeof it.data === 'object' ? it.data : {}) as Record<string, unknown>;
  const kind = String(it?.type ?? '').toLowerCase();

  if (kind === 'message') {
    const direction = String(data.direction ?? '').toLowerCase();
    const channel = String(data.channel ?? '').toLowerCase();
    const body = strField(data.body) ?? '';
    const bodyPreview = strField(data.body_preview);
    const previewSource = bodyPreview || body;
    const preview = previewSource ? truncateText(previewSource, 120) : undefined;

    if (direction === 'outbound') {
      const isSms = channel === 'sms' || channel === '';
      return {
        headline: isSms ? 'SMS sent' : `Outbound message${channel ? ` (${channel})` : ''}`,
        created_at: String(it.created_at),
        preview,
        lines: [],
        eventKind: 'message',
        messageDirection: 'outbound',
      };
    }

    if (direction === 'inbound') {
      const quoted = preview ? `"${truncateText(preview, 80)}"` : '';
      return {
        headline: quoted ? `Patient replied: ${quoted}` : 'Patient replied',
        created_at: String(it.created_at),
        lines: [],
        eventKind: 'message',
        messageDirection: 'inbound',
        preview,
      };
    }

    if (direction === 'internal') {
      return {
        headline: 'Internal message',
        created_at: String(it.created_at),
        preview,
        lines: [],
        eventKind: 'message',
        messageDirection: 'internal',
      };
    }

    return {
      headline: 'Message',
      created_at: String(it.created_at),
      preview,
      lines: [
        {
          text: `Direction: ${direction || 'unknown'}${channel ? ` · Channel: ${channel}` : ''}`,
        },
      ],
      eventKind: 'message',
      messageDirection: 'other',
    };
  }

  if (kind === 'alert') {
    const reason = strField(data.reason);
    const ackAt = strField(data.acknowledged_at);
    const resAt = strField(data.resolved_at);
    const ackBy = strField(data.acknowledged_by);

    const lines: InterpretedTimelineLine[] = [];
    if (reason) {
      lines.push({ text: `Reason: ${reason}` });
    }

    if (ackAt) {
      lines.push({
        at: ackAt,
        text: 'Alert acknowledged',
        subtle: ackBy ? `Acknowledged by user ${shortId(ackBy)}` : undefined,
      });
    }

    if (resAt) {
      lines.push({
        at: resAt,
        text: 'Alert resolved',
      });
    }

    return {
      headline: 'Alert opened',
      created_at: String(it.created_at),
      lines,
      eventKind: 'alert',
    };
  }

  if (kind === 'escalation') {
    const decision = strField(data.decision_reason);
    const level = strField(data.escalation_level);
    const action = strField(data.escalation_action);
    const score = strField(data.score);

    const lines: InterpretedTimelineLine[] = [];
    if (decision) lines.push({ text: decision });
    const meta: string[] = [];
    if (level) meta.push(`Level: ${level}`);
    if (action) meta.push(`Action: ${action}`);
    if (score) meta.push(`Score: ${score}`);
    if (meta.length) lines.push({ text: meta.join(' · ') });

    return {
      headline: 'Escalation event recorded',
      created_at: String(it.created_at),
      lines,
      eventKind: 'escalation',
    };
  }

  let fallback = '';
  try {
    fallback = truncateText(JSON.stringify(data), 160);
  } catch {
    fallback = String(it.type || 'event');
  }

  return {
    headline: 'Unknown event',
    created_at: String(it.created_at),
    lines: fallback ? [{ text: fallback }] : [],
    eventKind: 'unknown',
  };
}

export function timelineItemKey(it: TimelineItem, idx: number): string {
  const data = it?.data && typeof it.data === 'object' ? it.data : {};
  const id = (data as Record<string, unknown>).id;
  if (id != null && String(id)) return `${it.type}-${String(id)}`;
  return `${it.type}-${it.created_at}-${idx}`;
}

export type AuditTimelineItem = {
  ts: string;
  kind: string;
  subtype: string | null;
  id: string;
  data: Record<string, unknown>;
  alert_id?: string;
};

export type WorkspaceTimelineEntry = TimelineItem | AuditTimelineItem;

export function isAuditTimelineItem(item: WorkspaceTimelineEntry): item is AuditTimelineItem {
  return 'ts' in item && 'kind' in item;
}

function sanitizeReason(reason: string | null): string | null {
  if (!reason) return null;
  const trimmed = reason.trim();
  if (!trimmed || /^[a-z0-9_]+$/.test(trimmed)) return null;
  return trimmed;
}

/** Interpret audit-grade timeline items from GET /app/enrolments/:id/audit-timeline. */
export function interpretAuditTimelineItem(item: AuditTimelineItem): InterpretedTimelineRow {
  const data = item.data ?? {};
  const kind = String(item.kind ?? '').toLowerCase();
  const subtype = String(item.subtype ?? data.event_type ?? '').toLowerCase();

  if (kind === 'message_event') {
    const direction = String(data.direction ?? '').toLowerCase();
    const eventType = String(data.event_type ?? item.subtype ?? '').toLowerCase();
    const bodyPreview = strField(data.body_preview);
    const preview = bodyPreview ? truncateText(bodyPreview, 120) : undefined;

    if (eventType === 'enrolment_completed') {
      return {
        headline: 'Monitoring completed',
        created_at: item.ts,
        lines: [],
        eventKind: 'message',
        messageDirection: 'internal',
      };
    }

    if (eventType === 'checkin_sent') {
      return {
        headline: 'Check-in sent to patient',
        created_at: item.ts,
        lines: [],
        eventKind: 'message',
        messageDirection: 'outbound',
      };
    }

    if (eventType === 'checkin_reply' || direction === 'inbound') {
      const score = data.parsed_score;
      const scoreText =
        score != null && Number.isFinite(Number(score)) ? `Recovery score ${Number(score)}/5` : null;
      return {
        headline: scoreText ? `Patient replied · ${scoreText}` : 'Patient replied',
        created_at: item.ts,
        preview,
        lines: [],
        eventKind: 'message',
        messageDirection: 'inbound',
      };
    }

    if (direction === 'outbound') {
      return {
        headline: 'Check-in message sent',
        created_at: item.ts,
        preview,
        lines: [],
        eventKind: 'message',
        messageDirection: 'outbound',
      };
    }

    if (direction === 'internal') {
      return {
        headline: 'Internal monitoring note',
        created_at: item.ts,
        preview,
        lines: [],
        eventKind: 'message',
        messageDirection: 'internal',
      };
    }

    return {
      headline: 'Monitoring message',
      created_at: item.ts,
      preview,
      lines: [],
      eventKind: 'message',
      messageDirection: 'other',
    };
  }

  if (kind === 'signal') {
    const score = data.score;
    const scoreText =
      score != null && Number.isFinite(Number(score)) ? `${Number(score)}/5` : '—';
    return {
      headline: `Patient reported recovery score ${scoreText}`,
      created_at: item.ts,
      lines: [],
      eventKind: 'message',
      messageDirection: 'inbound',
    };
  }

  if (kind === 'review') {
    const note = strField(data.review_note);
    return {
      headline: 'Clinical review recorded',
      created_at: item.ts,
      preview: note ? truncateText(note, 120) : undefined,
      lines: note ? [{ text: note }] : [],
      eventKind: 'message',
      messageDirection: 'internal',
    };
  }

  if (kind === 'clinical_note') {
    const authorName = strField(data.author_name) || 'Clinician';
    const body = strField(data.body);
    const preview = body ? truncateText(body, 120) : undefined;
    const isEdit = item.subtype === 'note_edited';
    return {
      headline: isEdit
        ? `Clinical note edited · ${authorName}`
        : `Clinical note added · ${authorName}`,
      created_at: item.ts,
      preview,
      lines: [],
      eventKind: 'message',
      messageDirection: 'internal',
    };
  }

  if (kind === 'alert') {
    const reason = sanitizeReason(strField(data.reason));
    const severity = strField(data.severity);
    const lines: InterpretedTimelineLine[] = [];
    if (reason) lines.push({ text: reason });
    if (severity) lines.push({ text: `Severity: ${severity}` });

    return {
      headline: 'Alert opened',
      created_at: item.ts,
      lines,
      eventKind: 'alert',
    };
  }

  if (kind === 'alert_event') {
    const eventType = subtype || String(data.event_type ?? '').toLowerCase();
    if (eventType === 'acknowledged') {
      return {
        headline: 'Alert acknowledged',
        created_at: item.ts,
        lines: [],
        eventKind: 'alert',
      };
    }
    if (eventType === 'resolved') {
      const note = strField(data.resolution_note);
      return {
        headline: 'Alert resolved',
        created_at: item.ts,
        preview: note ? truncateText(note, 120) : undefined,
        lines: note ? [{ text: note }] : [],
        eventKind: 'alert',
      };
    }
    if (eventType === 'ownership_taken') {
      return {
        headline: 'Alert ownership assigned',
        created_at: item.ts,
        lines: [],
        eventKind: 'alert',
      };
    }
    return {
      headline: 'Alert updated',
      created_at: item.ts,
      lines: [],
      eventKind: 'alert',
    };
  }

  if (kind === 'consent') {
    return {
      headline: 'Patient consent updated',
      created_at: item.ts,
      lines: [],
      eventKind: 'message',
      messageDirection: 'internal',
    };
  }

  return {
    headline: 'Monitoring event',
    created_at: item.ts,
    lines: [],
    eventKind: 'unknown',
  };
}

export function interpretWorkspaceTimelineItem(item: WorkspaceTimelineEntry): InterpretedTimelineRow {
  if (isAuditTimelineItem(item)) {
    return interpretAuditTimelineItem(item);
  }
  return interpretTimelineItem(item);
}

export function workspaceTimelineItemKey(item: WorkspaceTimelineEntry, idx: number): string {
  if (isAuditTimelineItem(item)) {
    return `${item.kind}-${item.id}-${item.ts}-${idx}`;
  }
  return timelineItemKey(item, idx);
}
