'use client';

import { useState } from 'react';

const PLACEHOLDER_CONTACTS = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Clinical lead',
    phone: '+61 400 000 001',
    email: 's.chen@clinic.example',
  },
  {
    name: 'Alex Morgan',
    role: 'Duty nurse',
    phone: '+61 400 000 002',
    email: 'a.morgan@clinic.example',
  },
];

export default function EscalationSettingsPage() {
  const [smsEscalation, setSmsEscalation] = useState(true);
  const [emailEscalation, setEmailEscalation] = useState(false);
  const [escalateScoreGte, setEscalateScoreGte] = useState('4');
  const [escalateUrgentPhrases, setEscalateUrgentPhrases] = useState(true);
  const [escalationTiming, setEscalationTiming] = useState('immediate');
  const [businessHoursOnly, setBusinessHoursOnly] = useState(false);

  return (
    <div className="max-w-3xl mx-auto p-6 font-sans text-gray-900">
      <div className="mb-6">
        <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
          ← Back
        </a>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Escalation settings
        </h1>

        <p className="text-sm text-gray-600 m-0">
          Configure how SignalCare escalates high-risk recovery events.
        </p>
      </header>

      <section className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Escalation channels
        </h2>

        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={smsEscalation}
              onChange={(e) => setSmsEscalation(e.target.checked)}
              className="h-4 w-4"
            />
            SMS escalation
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={emailEscalation}
              onChange={(e) => setEmailEscalation(e.target.checked)}
              className="h-4 w-4"
            />
            Email escalation
          </label>
        </div>
      </section>

      <section className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Escalation thresholds
        </h2>

        <div className="flex flex-col gap-4">
          <label className="block text-sm text-gray-800">
            <span className="block font-medium mb-1">
              Escalate scores ≥
            </span>

            <input
              type="number"
              min={1}
              max={5}
              value={escalateScoreGte}
              onChange={(e) => setEscalateScoreGte(e.target.value)}
              className="w-24 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={escalateUrgentPhrases}
              onChange={(e) => setEscalateUrgentPhrases(e.target.checked)}
              className="h-4 w-4"
            />
            Escalate urgent red-flag phrases immediately
          </label>
        </div>
      </section>

      <section className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 m-0">
            Escalation contacts
          </h2>

          <button
            type="button"
            disabled
            className="text-sm px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-400 cursor-not-allowed"
          >
            Add contact
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded bg-white">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100 text-gray-700">
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Role</th>
                <th className="px-3 py-2 font-semibold">Phone</th>
                <th className="px-3 py-2 font-semibold">Email</th>
              </tr>
            </thead>

            <tbody>
              {PLACEHOLDER_CONTACTS.map((c) => (
                <tr
                  key={c.email}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-3 py-2 text-gray-900">{c.name}</td>
                  <td className="px-3 py-2 text-gray-700">{c.role}</td>
                  <td className="px-3 py-2 text-gray-700">{c.phone}</td>
                  <td className="px-3 py-2 text-gray-700">{c.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Escalation timing
        </h2>

        <div className="flex flex-col gap-4">
          <label className="block text-sm text-gray-800">
            <span className="block font-medium mb-1">
              Delay before escalation
            </span>

            <select
              value={escalationTiming}
              onChange={(e) => setEscalationTiming(e.target.value)}
              className="w-full max-w-xs border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            >
              <option value="immediate">Immediate</option>
              <option value="5">5 minutes</option>
              <option value="15">15 minutes</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={businessHoursOnly}
              onChange={(e) => setBusinessHoursOnly(e.target.checked)}
              className="h-4 w-4"
            />
            Business hours only
          </label>
        </div>
      </section>

      <footer className="border-t border-gray-200 pt-6">
        <button
          type="button"
          disabled
          className="px-4 py-2 text-sm font-semibold rounded bg-gray-800 text-white opacity-50 cursor-not-allowed"
        >
          Save settings
        </button>

        <p className="text-xs text-gray-500 mt-3 m-0">
          Persistence wiring not implemented yet.
        </p>
      </footer>
    </div>
  );
}
