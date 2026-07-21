import { SignalCareLogo } from './SignalCareLogo';

export function AuthBrandingPanel() {
  return (
    <aside
      className="relative flex min-h-[280px] w-full flex-col justify-between overflow-hidden px-8 py-10 text-white sm:px-10 sm:py-12 lg:min-h-screen lg:w-1/2 lg:px-14 lg:py-14 xl:px-16"
      style={{
        background: 'var(--sc-brand-gradient)',
      }}
    >
      <div
        className="pointer-events-none absolute left-[18%] top-[32%] h-64 w-64 rounded-full bg-teal-400/25 blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-black/20 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10">
        <SignalCareLogo variant="light" />
      </div>

      <div className="relative z-10 mt-12 max-w-[520px] lg:mt-0 lg:pb-6">
        <h1 className="text-[1.75rem] font-bold leading-[1.2] tracking-[-0.02em] sm:text-[2rem] lg:text-[2.125rem]">
          Real-time patient monitoring for better outcomes
        </h1>
        <p className="mt-4 max-w-[480px] text-[0.9375rem] font-normal leading-relaxed text-white/85 sm:text-base">
          Advanced clinical decision support powered by continuous monitoring and intelligent
          alerts.
        </p>
      </div>
    </aside>
  );
}
