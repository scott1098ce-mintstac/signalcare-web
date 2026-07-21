type AccessDeniedStateProps = {
  title?: string;
  message?: string;
};

/** Minimal access-denied state for permission failures (403). */
export function AccessDeniedState({
  title = 'Access denied',
  message = 'You do not have permission to view this content.',
}: AccessDeniedStateProps) {
  return (
    <div
      role="alert"
      style={{
        margin: '24px auto',
        maxWidth: 480,
        padding: '20px 24px',
        borderRadius: 12,
        border: '1px solid #fecaca',
        background: '#fef2f2',
        color: '#991b1b',
        fontFamily: 'inherit',
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{title}</p>
      <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.45, color: '#7f1d1d' }}>{message}</p>
    </div>
  );
}
