import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import styles from './settings-framework.module.css';

export type SettingsFormStackProps = {
  children: ReactNode;
  className?: string;
};

/** Vertical stack with standard form field spacing. */
export function SettingsFormStack({ children, className }: SettingsFormStackProps) {
  return <div className={cn(styles.formStack, className)}>{children}</div>;
}

export type SettingsFormRowProps = {
  label: ReactNode;
  labelDescription?: string;
  control: ReactNode;
  alignTop?: boolean;
  className?: string;
};

/** Label left, control right — standard settings field row. */
export function SettingsFormRow({
  label,
  labelDescription,
  control,
  alignTop = false,
  className,
}: SettingsFormRowProps) {
  return (
    <div className={cn(styles.formRow, alignTop && styles.formRowTop, className)}>
      <div className={styles.formLabel}>
        {label}
        {labelDescription ? (
          <span className={styles.formLabelDescription}>{labelDescription}</span>
        ) : null}
      </div>
      <div className={styles.formControl}>{control}</div>
    </div>
  );
}

export type SettingsOptionListProps = {
  children: ReactNode;
  className?: string;
};

export function SettingsOptionList({ children, className }: SettingsOptionListProps) {
  return <div className={cn(styles.optionList, className)}>{children}</div>;
}

export function SettingsOptionRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.optionRow, className)}>{children}</div>;
}

export type SettingsRadioRowProps = {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  className?: string;
};

/** Radio option row — Figma 322:6896. */
export function SettingsRadioRow({
  id,
  name,
  label,
  checked,
  onChange,
  className,
}: SettingsRadioRowProps) {
  return (
    <SettingsOptionRow className={className}>
      <label htmlFor={id} className={styles.radioLabel}>
        <input
          id={id}
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className={styles.radioInput}
        />
        {label}
      </label>
    </SettingsOptionRow>
  );
}

export type SettingsToggleRowProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/** Toggle row with label left, switch right — Figma 307:9664. */
export function SettingsToggleRow({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  className,
}: SettingsToggleRowProps) {
  return (
    <div className={cn(styles.toggleRow, className)}>
      <label htmlFor={id} className={styles.toggleLabel}>
        {label}
      </label>
      <label className={styles.toggle}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className={styles.toggleInput}
        />
        <span className={styles.toggleTrack} aria-hidden />
        <span className={styles.toggleThumb} aria-hidden />
      </label>
    </div>
  );
}
