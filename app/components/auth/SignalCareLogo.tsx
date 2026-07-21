type SignalCareLogoProps = {
  variant?: 'light' | 'dark';
  className?: string;
};

export function SignalCareLogo({ variant = 'light', className = '' }: SignalCareLogoProps) {
  const textClass = variant === 'light' ? 'text-white' : 'text-[#1a1a1a]';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white"
        aria-hidden
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 3.5c-3.2 0-5.8 2.1-6.8 5.2 1 3.1 3.6 5.2 6.8 5.2s5.8-2.1 6.8-5.2C15.8 5.6 13.2 3.5 10 3.5Z"
            stroke="#0d6e63"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="10" cy="8.7" r="1.5" fill="#0d6e63" />
        </svg>
      </div>
      <span className={`text-[1.125rem] font-semibold tracking-[-0.01em] ${textClass}`}>
        SignalCare
      </span>
    </div>
  );
}
