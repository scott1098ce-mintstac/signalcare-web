/**
 * Focused Command Queue commercial UI closeout checks.
 * Pure helpers only — no network, no SMS, no clinic writes.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mod = await import(pathToFileURL(path.join(root, 'app/lib/command-queue.ts')).href);
const { groupQueueRows, immediatePriorityRows, isOverloadedView } = mod;

function row(partial) {
  return {
    enrolment_id: partial.enrolment_id,
    patient_name: partial.patient_name ?? 'Patient',
    procedure: partial.procedure ?? 'Anti-Wrinkle',
    v2_status: partial.v2_status,
    risk_level: partial.risk_level ?? 'high',
    attention_reason: partial.attention_reason ?? 'Attention',
    recovery_day: 1,
    latest_score: partial.latest_score ?? 5,
    open_alert_id: partial.open_alert_id ?? null,
    open_alert_severity: partial.open_alert_severity ?? 'high',
    owned_by_user_id: null,
    acknowledged_by: null,
    acknowledged_at: null,
  };
}

const open = (id) =>
  row({ enrolment_id: id, v2_status: 'alert_open', open_alert_id: `a-${id}` });
const review = (id) => row({ enrolment_id: id, v2_status: 'review_required', risk_level: 'medium' });
const awaiting = (id) => row({ enrolment_id: id, v2_status: 'awaiting_response', risk_level: 'low' });
const stable = (id) => row({ enrolment_id: id, v2_status: 'stable', risk_level: 'none' });

const normal = [open('1'), review('2'), awaiting('3'), stable('4')];
assert.equal(isOverloadedView(normal), false);
assert.equal(immediatePriorityRows(normal).length, 1);

const overload = [open('1'), open('2'), open('3'), review('4'), awaiting('5'), stable('6')];
assert.equal(isOverloadedView(overload), true);
const immediate = immediatePriorityRows(overload);
assert.equal(immediate.length, 3);
assert.ok(immediate.every((r) => r.v2_status === 'alert_open'));

const groups = groupQueueRows(overload);
const attentionWithoutImmediate = groups.needsAttention.filter(
  (r) => !immediate.some((item) => item.enrolment_id === r.enrolment_id),
);
assert.equal(attentionWithoutImmediate.length, 1);
assert.equal(attentionWithoutImmediate[0].enrolment_id, '4');
assert.equal(groups.awaitingResponse.length, 1);
assert.equal(groups.stable.length, 1);

const allClear = [awaiting('a'), stable('s')];
assert.equal(groupQueueRows(allClear).needsAttention.length, 0);
assert.equal(isOverloadedView(allClear), false);

console.log('command-queue-commercial-ui-closeout: ok');
