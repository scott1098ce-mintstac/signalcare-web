/**
 * Phase 6E web static checks: public legal routes content + COPY-001 + no placeholders.
 * Run: node scripts/test-phase-6e-legal-pages.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

test('public legal page routes exist', () => {
  for (const p of ['app/privacy/page.tsx', 'app/patient-privacy/page.tsx', 'app/terms/page.tsx']) {
    assert.ok(fs.existsSync(path.join(root, p)), p);
  }
});

test('patient notice COPY-001 and no drafting artefacts', () => {
  const t = read('app/lib/legal-content/patient-privacy-notice.ts');
  assert.ok(!t.includes('\u2014'));
  assert.ok(!t.includes('\u2013'));
  assert.ok(!/\[SIGNALCARE|TODO|TBC|TBA|COUNSEL|placeholder/i.test(t));
});

test('privacy and terms have no public drafting artefacts', () => {
  for (const p of [
    'app/lib/legal-content/privacy-policy.ts',
    'app/lib/legal-content/clinic-terms.ts',
  ]) {
    const t = read(p);
    assert.ok(!/\[SIGNALCARE|TODO|TBC|TBA|COUNSEL|placeholder/i.test(t), p);
  }
});

test('legal registry versions align', () => {
  const reg = read('app/lib/legal-document-registry.ts');
  const privacy = read('app/lib/legal-content/privacy-policy.ts');
  assert.ok(privacy.includes("VERSION = '2026-09-07.1'"));
  assert.ok(reg.includes('https://app.signalcare.io/privacy'));
  assert.ok(reg.includes('https://app.signalcare.io/patient-privacy'));
  assert.ok(reg.includes('https://app.signalcare.io/terms'));
  assert.ok(reg.includes('CURRENT_PATIENT_PRIVACY_NOTICE_VERSION'));
  assert.ok(reg.includes('CURRENT_CLINIC_TERMS_VERSION'));
});

test('legal document urls default to first-party routes', () => {
  const urls = read('app/lib/legal-document-urls.ts');
  assert.ok(urls.includes("'/privacy'"));
  assert.ok(urls.includes("'/patient-privacy'"));
  assert.ok(urls.includes("'/terms'"));
});

test('auth footer always links Privacy and Terms', () => {
  const footer = read('app/components/auth/AuthSecurityFooter.tsx');
  assert.ok(footer.includes('Privacy'));
  assert.ok(footer.includes('Terms'));
  assert.ok(footer.includes('Patient Privacy'));
});

if (!process.exitCode) {
  console.log('All Phase 6E legal page static tests passed.');
}
