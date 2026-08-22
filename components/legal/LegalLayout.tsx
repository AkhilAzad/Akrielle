import type { ReactNode } from "react";

import { FlowHeader } from "@/components/layout/FlowHeader";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/common/Container";

/**
 * Shared shell for the site's content/legal routes (Privacy, Terms, Contact).
 * Reuses the existing Lumora primitives — the flow header for back-navigation,
 * the same closing footer as the landing page, and the site's ink/paper type
 * system — so these pages read as part of Alkline rather than a bolted-on
 * template. No new visual language is introduced here.
 */
export function LegalLayout({
  eyebrow,
  title,
  intro,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <FlowHeader backHref="/" />
      <main className="py-16 md:py-24">
        <Container className="max-w-[720px]">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-medium leading-[1.05] tracking-tightest text-ink md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-[52ch] font-body text-[0.95rem] leading-relaxed text-ink-muted">
            {intro}
          </p>
          {lastUpdated && (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-widest2 text-ink-faint">
              Last updated · {lastUpdated}
            </p>
          )}
          <div className="mt-12 flex flex-col gap-10">{children}</div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

/**
 * A single titled block of body copy within a legal/content page.
 */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-medium tracking-tightest text-ink">{title}</h2>
      <div className="flex flex-col gap-3 font-body text-[0.95rem] leading-relaxed text-ink-muted [&_a]:text-accent [&_a]:transition-colors [&_a:hover]:text-ink [&_strong]:font-medium [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}
