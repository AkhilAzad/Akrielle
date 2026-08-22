import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { PROCESS_STEPS } from "@/constants/landing";

/**
 * Lumora's "services" list, reframed as the analysis process. Each step is a
 * full-width row: an index, a title, a description, and a corner badge that
 * translates in on hover while an accent hairline sweeps across the row.
 * Entrance uses the scroll reveal system (a wrapper carries `.reveal-up` so the
 * row's own padding transition never fights the reveal's transform).
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-paper py-28 md:py-40">
      <Container>
        <SectionHeading
          eyebrow="The Process"
          title="A consultation, translated into intelligence."
          description="Four quiet steps between your photo and your personalized profile."
        />

        <div className="mt-14 border-t border-line md:mt-20">
          {PROCESS_STEPS.map((step, index) => (
            <div
              key={step.id}
              className="reveal-up"
              data-delay={`${index * 90}`}
            >
              <div className="group relative flex flex-col gap-4 border-b border-line py-8 transition-[padding] duration-500 ease-signature md:flex-row md:items-baseline md:gap-10 md:py-10 md:hover:pl-5">
                <div className="flex items-baseline gap-5 md:w-[30%]">
                  <span className="text-[0.8125rem] font-medium tabular-nums text-ink-faint transition-colors duration-500 ease-signature group-hover:text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-2xl font-medium tracking-tightest text-ink md:text-[1.875rem]">
                    {step.title}
                  </h3>
                </div>

                <p className="max-w-xl text-[0.975rem] leading-relaxed text-ink-muted md:flex-1">
                  {step.description}
                </p>

                <span
                  aria-hidden="true"
                  className="pill-badge hidden shrink-0 border border-line text-ink md:inline-flex md:-translate-x-2 md:opacity-0 md:transition-all md:duration-500 md:ease-signature md:group-hover:translate-x-0 md:group-hover:opacity-100"
                >
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.6} />
                </span>

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-px left-0 h-px w-0 bg-accent transition-all duration-700 ease-signature group-hover:w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
