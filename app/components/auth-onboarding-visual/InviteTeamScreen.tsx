'use client';

import { FormEvent } from 'react';
import { type StaffRow } from '../../lib/onboarding-state';
import { OnboardingHeader, OnboardingHelpFooter } from './OnboardingHeader';
import { OnboardingStepper } from './OnboardingStepper';
import onboardingStyles from './onboarding.module.css';

const ROLES: StaffRow['role'][] = ['Doctor', 'Nurse', 'Admin'];

export type InviteTeamScreenProps = {
  readOnly?: boolean;
  visual?: boolean;
  staff?: StaffRow[];
  loading?: boolean;
  errorMessage?: string | null;
  completeLabel?: string;
  onStaffChange?: (id: string, patch: Partial<StaffRow>) => void;
  onAddStaff?: () => void;
  onRemoveStaff?: (id: string) => void;
  onBack?: () => void;
  onSubmit?: () => void | Promise<void>;
};

const VISUAL_STAFF: StaffRow[] = [
  { id: 'visual-staff-1', name: '', email: '', role: 'Doctor' },
  { id: 'visual-staff-2', name: '', email: '', role: 'Doctor' },
];

function StaffRowFields({
  member,
  index,
  readOnly,
  showLabels,
  onStaffChange,
  onRemoveStaff,
}: {
  member: StaffRow;
  index: number;
  readOnly: boolean;
  showLabels?: boolean;
  onStaffChange?: (id: string, patch: Partial<StaffRow>) => void;
  onRemoveStaff?: (id: string) => void;
}) {
  return (
    <>
      {showLabels ? (
        <div className={onboardingStyles.staffHeader}>
          <span className={onboardingStyles.fieldLabel}>Full name</span>
          <span className={onboardingStyles.fieldLabel}>Work email</span>
          <span className={onboardingStyles.fieldLabel}>Role</span>
          <span />
        </div>
      ) : null}
      <div className={onboardingStyles.staffRow}>
        {readOnly ? (
          <>
            <div className={`${onboardingStyles.staticFieldValue} ${onboardingStyles.staticFieldPlaceholder}`}>
              Dr.Jane Smith
            </div>
            <div className={`${onboardingStyles.staticFieldValue} ${onboardingStyles.staticFieldPlaceholder}`}>
              email@hospital.org
            </div>
            <div className={onboardingStyles.roleDropdownStatic}>
              <span>Doctor</span>
              <img src="/images/ao/icon-chevron-down-filled-onboarding-figma.svg" alt="" aria-hidden width={20} height={20} />
            </div>
          </>
        ) : (
          <>
            <input
              className={onboardingStyles.textInput}
              value={member.name}
              onChange={(e) => onStaffChange?.(member.id, { name: e.target.value })}
              placeholder="Dr.Jane Smith"
            />
            <input
              className={onboardingStyles.textInput}
              type="email"
              value={member.email}
              onChange={(e) => onStaffChange?.(member.id, { email: e.target.value })}
              placeholder="email@hospital.org"
            />
            <div className={onboardingStyles.selectWrap}>
              <select
                className={`${onboardingStyles.selectInput} ${onboardingStyles.roleSelect}`}
                value={member.role}
                onChange={(e) => onStaffChange?.(member.id, { role: e.target.value as StaffRow['role'] })}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <img className={onboardingStyles.selectChevron} src="/images/ao/icon-chevron-down.svg" alt="" aria-hidden />
            </div>
          </>
        )}
        <button
          type="button"
          className={onboardingStyles.deleteBtn}
          onClick={readOnly ? undefined : () => onRemoveStaff?.(member.id)}
          aria-label={`Remove staff member ${index + 1}`}
          aria-hidden={readOnly}
          tabIndex={readOnly ? -1 : undefined}
        >
          <img className={onboardingStyles.deleteIcon} src="/images/ao/icon-delete.svg" alt="" />
        </button>
      </div>
    </>
  );
}

export function InviteTeamScreen({
  readOnly = false,
  visual = false,
  staff = VISUAL_STAFF,
  loading = false,
  errorMessage = null,
  completeLabel = 'Compleate',
  onStaffChange,
  onAddStaff,
  onRemoveStaff,
  onBack,
  onSubmit,
}: InviteTeamScreenProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly || !onSubmit) return;
    await onSubmit();
  }

  const pageClassName = [onboardingStyles.page, visual ? onboardingStyles.visualPage : ''].filter(Boolean).join(' ');

  return (
    <div className={pageClassName} data-node-id="230:13707" data-name="Page/Onboarding/invite-team">
      <OnboardingHeader readOnly={readOnly} />

      <main className={`${onboardingStyles.main} ${onboardingStyles.mainInviteTeam}`}>
        <form
          className={`${onboardingStyles.card} ${onboardingStyles.cardRounded10}`}
          data-name="Invite Team Card"
          onSubmit={handleSubmit}
        >
          <OnboardingStepper currentStep={3} />

          <div className={onboardingStyles.contentInviteTeam}>
            <div className={onboardingStyles.contentHeader}>
              <h1 className={onboardingStyles.contentTitle}>Invite your clinical team.</h1>
              <p className={onboardingStyles.contentDescriptionSm}>
                Add your colleagues and assign their access levels to start monitoring patients.
              </p>

              <div className={onboardingStyles.rolesBox}>
                <div className={onboardingStyles.rolesIconWrap}>
                  <img className={onboardingStyles.rolesIcon} src="/images/ao/icon-info-warning.svg" alt="" aria-hidden />
                </div>
                <p className={onboardingStyles.rolesText}>
                  <span className={onboardingStyles.rolesTextStrong}>Admins</span>
                  <span className={onboardingStyles.rolesTextMuted}> manage settings, </span>
                  <span className={onboardingStyles.rolesTextStrong}>Doctors</span>
                  <span className={onboardingStyles.rolesTextMuted}> handle interventions, </span>
                  <span className={onboardingStyles.rolesTextStrong}>Nurses</span>
                  <span className={onboardingStyles.rolesTextMuted}> focus on monitoring.</span>
                </p>
              </div>
            </div>

            <div className={onboardingStyles.staffSection}>
              {errorMessage ? (
                <div
                  role="alert"
                  style={{
                    marginBottom: '16px',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    background: '#fef2f2',
                    color: '#991b1b',
                    padding: '12px 14px',
                    fontSize: '14px',
                    lineHeight: '20px',
                  }}
                >
                  {errorMessage}
                </div>
              ) : null}
              {staff.map((member, index) => (
                <StaffRowFields
                  key={member.id}
                  member={member}
                  index={index}
                  readOnly={readOnly}
                  showLabels={index === 0}
                  onStaffChange={onStaffChange}
                  onRemoveStaff={onRemoveStaff}
                />
              ))}
            </div>

            <button
              type="button"
              className={onboardingStyles.addButton}
              onClick={readOnly ? undefined : onAddStaff}
              aria-hidden={readOnly}
              tabIndex={readOnly ? -1 : undefined}
            >
              <img className={onboardingStyles.addIcon} src="/images/ao/icon-plus-ward.svg" alt="" aria-hidden />
              Add more staff
            </button>
          </div>

          <div className={onboardingStyles.cardFooterSplit}>
            <div className={onboardingStyles.cardFooterActions}>
              <button
                type="button"
                className={onboardingStyles.ghostButton}
                onClick={readOnly ? undefined : onBack}
                aria-hidden={readOnly}
                tabIndex={readOnly ? -1 : undefined}
              >
                <img className={onboardingStyles.buttonIcon} src="/images/ao/icon-arrow-left-onboarding-figma.svg" alt="" aria-hidden />
                Back
              </button>
              <button type="submit" className={onboardingStyles.primaryButton} disabled={!readOnly && loading}>
                {loading ? 'Completing…' : completeLabel}
              </button>
            </div>
          </div>
        </form>

        <OnboardingHelpFooter readOnly={readOnly} />
      </main>
    </div>
  );
}
