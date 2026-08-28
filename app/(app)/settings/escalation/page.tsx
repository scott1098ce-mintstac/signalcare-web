import { redirect } from 'next/navigation';

/** Legacy Figma stub. Do not render fake escalation controls in production. */
export default function EscalationSettingsPage() {
  redirect('/settings/staff');
}
