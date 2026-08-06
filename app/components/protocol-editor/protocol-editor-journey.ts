/**
 * Presentation helpers for Protocol Editor clinical journey UI.
 * Timing labels only — no API / data-model changes.
 */

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;

/** Short milestone title for journey nav / schedule (e.g. "Day 3", "2 Hours"). */
export function formatJourneyMilestone(offsetMinutes: number | null | undefined): string {
  if (offsetMinutes == null || !Number.isFinite(Number(offsetMinutes))) {
    return 'Check-in';
  }
  const minutes = Math.max(0, Number(offsetMinutes));

  if (minutes === 0) return 'Immediate';
  if (minutes < MINUTES_PER_DAY && minutes % MINUTES_PER_HOUR === 0) {
    const hours = minutes / MINUTES_PER_HOUR;
    return hours === 1 ? '1 Hour' : `${hours} Hours`;
  }
  if (minutes % MINUTES_PER_DAY === 0) {
    const days = minutes / MINUTES_PER_DAY;
    return days === 1 ? 'Day 1' : `Day ${days}`;
  }
  if (minutes < MINUTES_PER_DAY) {
    const hours = minutes / MINUTES_PER_HOUR;
    const rounded = hours < 1 ? Number(hours.toFixed(1)) : Math.round(hours);
    return `${rounded} Hours`;
  }
  const days = Math.round(minutes / MINUTES_PER_DAY);
  return `Day ${days}`;
}

/** Clinical purpose line under a milestone. */
export function formatJourneyPurpose(offsetMinutes: number | null | undefined): string {
  if (offsetMinutes == null || !Number.isFinite(Number(offsetMinutes))) {
    return 'Patient check-in';
  }
  const minutes = Math.max(0, Number(offsetMinutes));

  if (minutes === 0) return 'Immediate recovery';
  if (minutes < MINUTES_PER_DAY) return 'Immediate recovery';
  if (minutes <= MINUTES_PER_DAY) return 'Early review';
  if (minutes <= 3 * MINUTES_PER_DAY) return 'Inflammation check';
  if (minutes <= 7 * MINUTES_PER_DAY) return 'Healing review';
  if (minutes <= 14 * MINUTES_PER_DAY) return 'Final recovery';
  return 'Ongoing recovery';
}

/** Editor heading: "Day 3 Patient Check". */
export function formatJourneyCheckHeading(offsetMinutes: number | null | undefined): string {
  return `${formatJourneyMilestone(offsetMinutes)} Patient Check`;
}

/** Editor subheading describing when the message is sent. */
export function formatJourneyCheckSubheading(offsetMinutes: number | null | undefined): string {
  const milestone = formatJourneyMilestone(offsetMinutes).toLowerCase();
  if (offsetMinutes == null || !Number.isFinite(Number(offsetMinutes))) {
    return 'This message is automatically sent to patients during monitoring.';
  }
  if (Number(offsetMinutes) === 0) {
    return 'This message is automatically sent to every patient immediately after treatment.';
  }
  if (Number(offsetMinutes) < MINUTES_PER_DAY) {
    return `This message is automatically sent to every patient ${milestone.toLowerCase()} after treatment.`;
  }
  const days = Math.round(Number(offsetMinutes) / MINUTES_PER_DAY);
  if (days === 1) {
    return 'This message is automatically sent to every patient one day after treatment.';
  }
  return `This message is automatically sent to every patient ${days} days after treatment.`;
}

/** One-line protocol purpose from procedure type. */
export function formatProtocolPurpose(procedureTypeLabel: string): string {
  const cleaned = procedureTypeLabel.trim();
  if (!cleaned || cleaned === '—') {
    return 'Monitor every patient after treatment.';
  }
  return `Monitor every patient after ${cleaned} treatment.`;
}
