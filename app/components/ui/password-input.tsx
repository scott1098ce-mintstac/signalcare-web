'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className = '', ...props }, ref) {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={[
            'w-full rounded-[var(--sc-radius-input)] border border-[var(--sc-border-input)] bg-white px-3 py-[11px] pr-10 text-[length:var(--sc-text-md)] text-[var(--sc-text-primary)] outline-none transition-colors placeholder:text-[var(--sc-text-placeholder)] focus:border-[var(--sc-brand)] focus:ring-1 focus:ring-[var(--sc-brand-focus-ring)]',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--sc-text-placeholder)] hover:text-[var(--sc-text-secondary)]"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <svg
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            {showPassword ? (
              <>
                <path d="M3 3l18 18" strokeLinecap="round" />
                <path
                  d="M10.58 10.58A2 2 0 0012 15a2 2 0 001.42-.58M9.88 5.1A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7.5a11.2 11.2 0 01-2.08 3.2M6.61 6.61A11.8 11.8 0 003 12.5c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.85"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : (
              <>
                <path
                  d="M2 12.5C3.73 8.11 7.99 5 13 5s9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S3.73 16.89 2 12.5Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="13" cy="12.5" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
    );
  },
);
