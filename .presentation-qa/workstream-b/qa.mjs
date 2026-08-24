import { chromium, webkit } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const evidenceDir = path.join(root, '.presentation-qa', 'workstream-b')
const credentials = JSON.parse(
  await fs.readFile(path.join(root, '.patient-directory-e2e.json'), 'utf8'),
)

const clinicId = credentials.clinicId
const userId = '9ec049da-ded3-4233-9a14-407d879a8322'
const clinicianId = '11111111-1111-4111-8111-111111111111'

function row(overrides) {
  return {
    enrolment_id: 'enrolment-default',
    patient_id: 'patient-default',
    patient_name: 'Synthetic Patient',
    patient_mobile: '+61400000000',
    procedure: 'Anti-wrinkle recovery',
    protocol_id: 'protocol-a',
    recovery_day: 3,
    last_response_at: new Date().toISOString(),
    last_checkin_at: new Date().toISOString(),
    started_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    latest_score: 4,
    risk_level: 'high',
    attention_required: true,
    v2_status: 'alert_open',
    open_alert_id: 'alert-default',
    open_alert_severity: 'high',
    acknowledged_by: null,
    acknowledged_at: null,
    owned_by_user_id: null,
    owned_at: null,
    attention_reason: 'HIGH · Clinical review required',
    review_required: true,
    contact_requested: false,
    contact_request_label: null,
    ...overrides,
  }
}

const initialRows = [
  row({
    enrolment_id: 'enrolment-contact',
    patient_id: 'patient-contact',
    patient_name: 'Contact Request',
    open_alert_id: 'alert-contact',
    attention_reason: 'Patient requested contact · HIGH · Worsening symptoms',
    contact_requested: true,
    contact_request_label: 'Patient requested contact',
  }),
  row({
    enrolment_id: 'enrolment-critical',
    patient_id: 'patient-critical',
    patient_name: 'Critical Review',
    open_alert_id: 'alert-critical',
    open_alert_severity: 'urgent',
    latest_score: 5,
    attention_reason: 'CRITICAL · Immediate clinical attention',
    v2_status: 'alert_acknowledged',
    acknowledged_by: clinicianId,
    acknowledged_at: new Date().toISOString(),
    owned_by_user_id: clinicianId,
    owned_at: new Date().toISOString(),
  }),
  row({
    enrolment_id: 'enrolment-review',
    patient_id: 'patient-review',
    patient_name: 'Review Required',
    open_alert_id: null,
    open_alert_severity: null,
    latest_score: 3,
    risk_level: 'medium',
    attention_reason: 'MEDIUM · Review required',
    v2_status: 'review_required',
  }),
]

function workspacePayload(enrolmentId, owner = null) {
  const queueRow = initialRows.find((candidate) => candidate.enrolment_id === enrolmentId) ?? initialRows[0]
  return {
    ok: true,
    clinic_id: clinicId,
    enrolment_id: enrolmentId,
    as_of: new Date().toISOString(),
    monitoring_v2: {
      v2_status: queueRow.v2_status,
      attention_required: true,
      attention_reason: queueRow.attention_reason,
    },
    workspace_status: queueRow.v2_status,
    workspace_status_reason: queueRow.attention_reason,
    ownership: {
      owned_by_user_id: owner,
      owned_at: owner ? new Date().toISOString() : null,
      is_owned: Boolean(owner),
      is_owned_by_current_user: owner === userId,
    },
    alert: queueRow.open_alert_id
      ? {
          id: queueRow.open_alert_id,
          severity: queueRow.open_alert_severity,
          status: queueRow.v2_status === 'alert_acknowledged' ? 'acknowledged' : 'open',
          created_at: new Date().toISOString(),
          acknowledged_at: queueRow.acknowledged_at,
          acknowledged_by: queueRow.acknowledged_by,
          resolved_at: null,
          resolved_by: null,
          score: queueRow.latest_score,
          reason: queueRow.attention_reason,
        }
      : null,
    review: {
      required: queueRow.review_required,
      historical: false,
      trigger_outstanding: queueRow.review_required,
      taxonomy_review: queueRow.review_required,
      score_review: false,
      reason: queueRow.attention_reason,
      reply_type: 'recovery_conversation',
      raw_score: queueRow.latest_score,
      latest_signal_at: new Date().toISOString(),
    },
    latest_review: null,
    protocol: {
      protocol_id: 'protocol-a',
      protocol_version_id: 'version-a',
      protocol_name: queueRow.procedure,
      procedure_type: 'cosmetic',
    },
    recovery: { recovery_day: 3, recovery_phase: 'Effect developing' },
    current_step: {
      protocol_step_id: 'step-a',
      step_label: 'Effect developing',
      offset_minutes: 4320,
      expected_symptoms: [],
      response_window_minutes: 240,
    },
    interpretation: {
      severity: queueRow.risk_level,
      taxonomy: 'clinical_triage',
      clinical_summary: queueRow.attention_reason,
      recommended_action: 'Open SignalCare and review the patient workspace.',
      review_required: queueRow.review_required,
      taxonomy_review: queueRow.review_required,
      score_review: false,
    },
    summary: {
      patient_id: queueRow.patient_id,
      patient_name: queueRow.patient_name,
      patient_mobile: queueRow.patient_mobile,
      enrolment_status: 'completed',
      latest_score: queueRow.latest_score,
      risk_level: queueRow.risk_level,
      last_response_at: queueRow.last_response_at,
      last_checkin_at: queueRow.last_checkin_at,
      started_at: queueRow.started_at,
      open_alert_id: queueRow.open_alert_id,
      reply_type: 'recovery_conversation',
      urgent_red_flag_detected: queueRow.latest_score >= 4,
      operational_outcome: queueRow.v2_status,
      contact_requested: queueRow.contact_requested,
      contact_request_label: queueRow.contact_request_label,
    },
    evidence: {
      latest_score: queueRow.latest_score,
      recent_scores: [{ value: queueRow.latest_score, at: queueRow.last_response_at }],
      latest_reply: {
        reply_type: 'recovery_conversation',
        received_at: queueRow.last_response_at,
        text: 'Synthetic QA response',
      },
      latest_signal: { severity: queueRow.risk_level, created_at: queueRow.last_response_at },
      patient_media: [],
    },
    timeline_preview: [],
    actions: {
      can_take_ownership: Boolean(queueRow.open_alert_id && !owner),
      can_acknowledge_alert: queueRow.v2_status === 'alert_open',
      can_resolve_alert: Boolean(queueRow.open_alert_id),
      can_open_review: queueRow.v2_status === 'review_required',
      can_send_follow_up: false,
      can_complete_monitoring: false,
    },
  }
}

async function run(browserType, name) {
  const browser = await browserType.launch()
  const context = await browser.newContext({ viewport: { width: 1512, height: 900 } })
  const page = await context.newPage()
  let monitoringRows = structuredClone(initialRows)
  let owner = null
  let settingsForbidden = false
  let preferences = {
    assignment_scope: 'assigned',
    sms_enabled: false,
    email_enabled: true,
    notify_high: true,
    notify_critical: true,
    notify_contact_request: true,
    notify_review_required: true,
    notify_assignment: true,
    notify_escalation: true,
  }
  const assertions = []

  await page.route('**/app/**', async (route) => {
    const url = new URL(route.request().url())
    const pathname = url.pathname
    const method = route.request().method()
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

    if (pathname === '/app/me') {
      return json({
        ok: true,
        user_id: userId,
        clinic_id: clinicId,
        role: 'admin',
        clinic: { id: clinicId, name: 'Synthetic QA Clinic' },
        user: { user_id: userId, clinic_id: clinicId, role: 'admin' },
      })
    }
    if (pathname === '/app/monitoring') {
      return json({ ok: true, count: monitoringRows.length, monitoring: monitoringRows })
    }
    if (pathname === '/app/analytics/operational-v1') {
      return json({
        ok: true,
        queue_now: { attention_now: monitoringRows.length, alert_open: 2, awaiting_response: 0, review_required: 1, active_enrolments: 3 },
        engagement: {},
        reviews: {},
        escalations: {},
      })
    }
    if (pathname === '/app/inbound/unlinked') return json({ ok: true, count: 0 })
    if (pathname === '/app/clinicians') {
      return json({
        ok: true,
        clinicians: [
          { user_id: userId, name: 'QA Admin', role: 'admin' },
          { user_id: clinicianId, name: 'QA Nurse', role: 'nurse' },
        ],
      })
    }
    if (pathname === '/app/notification-preferences') {
      if (settingsForbidden) return json({ error: 'forbidden' }, 403)
      if (method === 'PATCH') preferences = route.request().postDataJSON()
      return json({
        ok: true,
        preferences,
        contact: {
          email_available: true,
          sms_available: false,
          email_masked: 'q***@signalcare.test',
          mobile_last4: null,
        },
      })
    }
    const workspaceMatch = pathname.match(/^\/app\/workspace\/([^/]+)$/)
    if (workspaceMatch) return json(workspacePayload(workspaceMatch[1], owner))
    if (/^\/app\/enrolments\/[^/]+\/audit-timeline$/.test(pathname)) {
      return json({ ok: true, timeline: [] })
    }
    if (/^\/app\/enrolments\/[^/]+\/clinical-notes$/.test(pathname)) {
      return json({ ok: true, notes: [] })
    }
    if (/^\/app\/alerts\/[^/]+\/assign$/.test(pathname)) {
      owner = route.request().postDataJSON().user_id
      return json({ ok: true, owned_by_user_id: owner, owned_at: new Date().toISOString() })
    }
    if (/^\/app\/alerts\/[^/]+\/acknowledge$/.test(pathname)) {
      const alertId = pathname.split('/')[3]
      monitoringRows = monitoringRows.map((candidate) =>
        candidate.open_alert_id === alertId
          ? { ...candidate, v2_status: 'alert_acknowledged', owned_by_user_id: userId, acknowledged_by: userId }
          : candidate,
      )
      return json({ ok: true })
    }
    if (/^\/app\/alerts\/[^/]+\/resolve$/.test(pathname)) {
      const alertId = pathname.split('/')[3]
      monitoringRows = monitoringRows.filter((candidate) => candidate.open_alert_id !== alertId)
      return json({ ok: true })
    }
    return json({ ok: true })
  })
  await page.route('**/ops/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, stalled_checkins: { count: 0 } }),
    }),
  )

  await page.goto('http://127.0.0.1:3000/auth/signin')
  await page.getByLabel('Work email').fill(credentials.admin.email)
  await page.locator('#password').fill(credentials.password)
  await page.getByRole('button', { name: 'Log In' }).click()
  await page.waitForURL('**/')

  await page.goto('http://127.0.0.1:3000/')
  await page.getByText('Patient requested contact', { exact: false }).first().waitFor()
  assertions.push('contact_request_visible')
  await page.getByText('Critical Review', { exact: true }).waitFor()
  await page.getByText('Review Required', { exact: true }).waitFor()
  assertions.push('high_critical_review_required_visible')
  await page.getByText('Contact Request').first().click()
  await page.getByText('Clinical notes', { exact: true }).waitFor()
  assertions.push('clinical_notes_wired')
  if (await page.getByRole('button', { name: 'Complete monitoring', exact: true }).count()) {
    throw new Error('completed_open_work_must_not_offer_complete_monitoring')
  }
  assertions.push('completed_open_work_actionable')
  await page.getByRole('combobox', { name: 'Assign clinician' }).selectOption(clinicianId)
  await page.getByRole('button', { name: 'Assign', exact: true }).click()
  await page.getByRole('button', { name: 'Reassign', exact: true }).waitFor()
  assertions.push('assignment_and_reassignment')
  await page.screenshot({ path: path.join(evidenceDir, `${name}-queue-contact-assigned.png`), fullPage: true })

  await page.getByText('Critical Review', { exact: true }).first().click()
  page.once('dialog', (dialog) => dialog.accept('Synthetic QA resolution note'))
  await page.getByRole('button', { name: 'Resolve alert', exact: true }).click()
  await page
    .getByRole('button', { name: /Critical Review CRITICAL/ })
    .waitFor({ state: 'detached' })
  assertions.push('acknowledged_and_resolved')

  await page.goto('http://127.0.0.1:3000/settings/notifications')
  await page.getByText('Notification events').waitFor()
  await page.getByLabel('All patients in my clinic').check()
  await page.getByRole('button', { name: 'Save settings' }).click()
  await page.getByText('Notification preferences saved.').waitFor()
  assertions.push('preferences_save')
  await page.screenshot({ path: path.join(evidenceDir, `${name}-notification-settings.png`), fullPage: true })

  settingsForbidden = true
  await page.reload()
  await page.getByText('forbidden', { exact: true }).waitFor()
  assertions.push('permission_error')
  await page.screenshot({ path: path.join(evidenceDir, `${name}-notification-settings-forbidden.png`), fullPage: true })

  monitoringRows = []
  await page.getByRole('link', { name: 'Queue', exact: true }).click()
  await page.getByText('Your command center is ready.', { exact: true }).waitFor()
  assertions.push('empty_queue')
  await page.screenshot({ path: path.join(evidenceDir, `${name}-empty-queue.png`), fullPage: true })

  await browser.close()
  return { browser: name, assertions }
}

const results = []
for (const [browserType, name] of [
  [chromium, 'chromium'],
  [webkit, 'webkit'],
]) {
  results.push(await run(browserType, name))
}

await fs.writeFile(
  path.join(evidenceDir, 'report.json'),
  JSON.stringify({ status: 'PASS', generated_at: new Date().toISOString(), results }, null, 2),
)
console.log(JSON.stringify({ status: 'PASS', results }))

