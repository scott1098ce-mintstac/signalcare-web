import type { ImgHTMLAttributes, SVGProps } from 'react';

type FigmaIconProps = ImgHTMLAttributes<HTMLImageElement> & { size?: number };
type SvgIconProps = SVGProps<SVGSVGElement> & { size?: number };

function figmaIcon(src: string, size: number, props: FigmaIconProps) {
  const { style, ...rest } = props;
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden
      {...rest}
      style={{ display: 'block', ...style, width: size, height: size }}
    />
  );
}

/** Figma 68:11301 — Filled Dropdown Chevron */
export function IconChevronDown({ size = 20, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-chevron-down-filled.svg', size, props);
}

/** Figma 277:17866 — Search Icon */
export function IconSearch({ size = 20, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props} style={{ display: 'block', width: size, height: size, ...props.style }}>
      <circle cx="8.5" cy="8.5" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Figma 277:18872 — Clear Icon */
export function IconClear({ size = 20, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props} style={{ display: 'block', width: size, height: size, ...props.style }}>
      <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Figma 284:3774 — Danger Alert Icon */
export function IconAlertDanger({ size = 20, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-alert-danger.svg', size, props);
}

/** Figma 284:4305 — Warning alert icon */
export function IconAlertWarning({ size = 20, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-alert-warning.svg', size, props);
}

/** Figma 284:4413 — Neutral alert icon */
export function IconAlertNeutral({ size = 20, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-alert-neutral.svg', size, props);
}

/** Figma 284:4333 — Assignee Icon */
export function IconAssignee({ size = 16, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-assignee.svg', size, props);
}

/** Figma 277:18897 — Add Icon */
export function IconAdd({ size = 20, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props} style={{ display: 'block', width: size, height: size, ...props.style }}>
      <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Lock icon — system configuration read-only indicator */
export function IconLock({ size = 16, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden {...props} style={{ display: 'block', width: size, height: size, ...props.style }}>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M5.5 7V5.25a2.5 2.5 0 0 1 5 0V7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Figma 243:4369 — Empty State Status Icon */
export function IconStatusCheck({ size = 40, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden {...props} style={{ display: 'block', width: size, height: size, ...props.style }}>
      <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2" />
      <path
        d="M13 20.5L17.5 25L27 15.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Figma 249:4491 — Timeline check */
export function IconCheck({ size = 24, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props} style={{ display: 'block', width: size, height: size, ...props.style }}>
      <path
        d="M7 12.5L10.5 16L17 9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Figma 111:15001 — Command Queue header icon */
export function IconQueue({ size = 32, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-command-queue.svg', size, props);
}

/** Figma 243:4687 — Menu icon */
export function IconMenu({ size = 24, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-menu.svg', size, props);
}

/** Figma 241:20677 — nav Queue 24×24 */
export function IconNavQueue({ size = 24, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-nav-queue.svg', size, props);
}

/** Figma nav Protocols */
export function IconNavProtocols({ size = 24, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-nav-protocols.svg', size, props);
}

/** Figma nav Patients — Button/Patients */
export function IconNavPatients({ size = 24, ...props }: FigmaIconProps) {
  return figmaIcon('/images/pw/icon-nav-patients-figma.svg', size, props);
}

/** Figma nav Reports */
export function IconNavReports({ size = 24, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-nav-reports.svg', size, props);
}

/** Figma nav Settings */
export function IconNavSettings({ size = 24, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-nav-settings.svg', size, props);
}

/** Download icon — secondary export actions */
export function IconDownload({ size = 20, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props} style={{ display: 'block', width: size, height: size, ...props.style }}>
      <path
        d="M10 3V12M10 12L6.5 8.5M10 12L13.5 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 14V15.5C4 16.3284 4.67157 17 5.5 17H14.5C15.3284 17 16 16.3284 16 15.5V14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Figma 277:18119 — Document / notes icon */
export function IconDocument({ size = 24, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props} style={{ display: 'block', width: size, height: size, ...props.style }}>
      <path
        d="M8 3H14.5L19 7.5V19C19 20.1046 18.1046 21 17 21H8C6.89543 21 6 20.1046 6 19V5C6 3.89543 6.89543 3 8 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 3V8H19" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 13H16M9 16H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Figma 277:19185 — Arrow right */
export function IconArrowRight({ size = 20, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden {...props} style={{ display: 'block', width: size, height: size, ...props.style }}>
      <path
        d="M4 10H16M16 10L11 5M16 10L11 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Figma 267:26933 — Success check */
export function IconCheckCircle({ size = 16, ...props }: SvgIconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden {...props} style={{ display: 'block', width: size, height: size, ...props.style }}>
      <path
        d="M4 8.5L6.5 11L12 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconNavProfile({ size = 24, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-nav-profile.svg', size, props);
}

/** Figma 284:3779 — row meta separator dot */
export function IconMetaDot({ size = 3, ...props }: FigmaIconProps) {
  return figmaIcon('/images/cq/icon-meta-dot.svg', size, props);
}
