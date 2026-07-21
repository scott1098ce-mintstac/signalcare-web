'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { IconChevronDown } from '../icons';
import { cn } from '../../../lib/cn';
import styles from './SCDropdown.module.css';

export type SCDropdownOption = {
  value: string;
  label: string;
};

export type SCDropdownProps = {
  label: string;
  options: SCDropdownOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  width?: number | string;
  disabled?: boolean;
  'aria-label'?: string;
};

/** Figma 267:2579 — custom Drop Down (not native select). */
export function SCDropdown({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  className,
  width,
  disabled,
  'aria-label': ariaLabel,
}: SCDropdownProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? options[0]?.value ?? '');
  const [highlight, setHighlight] = useState(0);

  const current = value ?? internal;
  const selected = options.find((o) => o.value === current);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function select(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={cn(styles.root, className)}
      style={width !== undefined ? { width } : undefined}
    >
      <button
        type="button"
        className={cn(styles.trigger, open && styles.triggerOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.min(h + 1, options.length - 1));
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.max(h - 1, 0));
          }
          if (e.key === 'Enter' && open) {
            e.preventDefault();
            select(options[highlight]?.value ?? current);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        <span className={styles.label}>{selected?.label ?? label}</span>
        <IconChevronDown className={cn(styles.chevron, open && styles.chevronOpen)} />
      </button>
      {open ? (
        <ul id={listId} role="listbox" className={styles.menu} aria-label={label}>
          {options.map((opt, i) => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={opt.value === current}
                className={cn(
                  styles.option,
                  i === highlight && styles.optionHighlighted,
                  opt.value === current && styles.optionSelected,
                )}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => select(opt.value)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
