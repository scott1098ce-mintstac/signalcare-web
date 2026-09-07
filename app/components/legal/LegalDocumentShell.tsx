import Link from 'next/link';
import type { ReactNode } from 'react';

type LegalDocumentShellProps = {
  title: string;
  version: string;
  effectiveAt: string;
  children: ReactNode;
};

export function LegalDocumentShell({ title, version, effectiveAt, children }: LegalDocumentShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#111111]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/auth/signin" className="text-sm font-semibold tracking-tight text-black">
            SignalCare
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
            <Link href="/privacy" className="hover:text-black hover:underline">
              Privacy
            </Link>
            <Link href="/patient-privacy" className="hover:text-black hover:underline">
              Patient Privacy
            </Link>
            <Link href="/terms" className="hover:text-black hover:underline">
              Terms
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">SignalCare</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Version {version} · Effective {effectiveAt}
        </p>
        <div className="mt-10 space-y-8 text-[15px] leading-7 text-neutral-800">{children}</div>
        <footer className="mt-14 border-t border-black/10 pt-6 text-xs text-neutral-500">
          <p>
            Privacy contact:{' '}
            <a className="text-black underline" href="mailto:hello@signalcare.io">
              hello@signalcare.io
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

export function LegalSections({
  sections,
}: {
  sections: Array<{ heading: string; paragraphs: string[] }>;
}) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-lg font-semibold tracking-tight text-black">{section.heading}</h2>
          <div className="mt-3 space-y-3">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
