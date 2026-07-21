export function AuthSecurityFooter() {
  return (
    <p className="mt-6 text-center text-xs leading-relaxed text-[var(--sc-text-secondary)]">
      Protected by enterprise-grade security.{' '}
      <a
        href="#"
        className="text-[var(--sc-brand)] hover:underline"
        onClick={(e) => e.preventDefault()}
      >
        Privacy Policy
      </a>
      {' - '}
      <a
        href="#"
        className="text-[var(--sc-brand)] hover:underline"
        onClick={(e) => e.preventDefault()}
      >
        Terms of Service
      </a>
    </p>
  );
}
