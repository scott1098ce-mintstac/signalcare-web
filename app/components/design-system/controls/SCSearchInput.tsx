'use client';

import { useState } from 'react';
import { IconClear, IconSearch } from '../icons';
import { cn } from '../../../lib/cn';
import styles from './SCSearchInput.module.css';

export type SCSearchInputProps = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  className?: string;
  name?: string;
  id?: string;
  'aria-label'?: string;
};

/** Figma 68:11238 — Search bar (Default / Active / Value+Clear). */
export function SCSearchInput({
  value,
  defaultValue = '',
  placeholder = 'Search...',
  onValueChange,
  onClear,
  className,
  name,
  id,
  'aria-label': ariaLabel = 'Search',
}: SCSearchInputProps) {
  const [internal, setInternal] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const current = value ?? internal;
  const hasValue = current.length > 0;

  function update(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <div className={cn(styles.root, focused && styles.rootFocused, className)}>
      <IconSearch className={cn(styles.icon, (focused || hasValue) && styles.iconActive)} />
      <input
        id={id}
        name={name}
        type="search"
        className={styles.input}
        placeholder={placeholder}
        value={current}
        aria-label={ariaLabel}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => update(e.target.value)}
      />
      {hasValue ? (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear search"
          onClick={() => {
            update('');
            onClear?.();
          }}
        >
          <IconClear />
        </button>
      ) : null}
    </div>
  );
}
