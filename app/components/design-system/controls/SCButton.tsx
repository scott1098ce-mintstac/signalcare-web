import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import styles from './SCButton.module.css';

export type SCButtonVariant =
  | 'primary'
  | 'primarySm'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'text';

export type SCButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: SCButtonVariant;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  children: ReactNode;
};

const variantClass: Record<SCButtonVariant, string> = {
  primary: styles.primary,
  primarySm: styles.primarySm,
  outline: styles.outline,
  secondary: styles.secondary,
  ghost: styles.ghost,
  text: styles.text,
};

/** Figma Button Primary / Secondary / outline variants — presentation only. */
export function SCButton({
  variant = 'primary',
  icon,
  iconPosition = 'start',
  className,
  children,
  type = 'button',
  ...props
}: SCButtonProps) {
  return (
    <button type={type} className={cn(styles.button, variantClass[variant], className)} {...props}>
      {icon && iconPosition === 'start' ? <span className={styles.iconSlot}>{icon}</span> : null}
      {children}
      {icon && iconPosition === 'end' ? <span className={styles.iconSlot}>{icon}</span> : null}
    </button>
  );
}
