import type { ReactNode } from "react";
import { PublicNav } from "@/components/layout/public-nav";
import { PublicFooter } from "@/components/layout/public-footer";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/constants/legal";

export function LegalPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F8FC] font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-10 space-y-3 border-b border-slate-200 pb-8 dark:border-white/10">
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
            Legal · Effective {LEGAL_EFFECTIVE_DATE}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </header>
        <article className="legal-prose space-y-8 text-[15px] leading-7 text-slate-700 dark:text-slate-300">
          {children}
        </article>
        <p className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          This document is drafted for operations in Singapore (including the PDPA) and should be
          reviewed by Singapore-qualified legal counsel before production use. Update company /
          DPO contact details in{" "}
          <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/50">lib/constants/legal.ts</code>{" "}
          as needed.
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-slate-400">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
