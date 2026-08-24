import { Fragment } from "react";
import { Container } from "@/components/common/Container";
import { DIFFERENTIATORS } from "@/constants/landing";

const STATEMENT = "Not another beauty app. A different discipline.";
const STATEMENT_WORDS = STATEMENT.split(" ");

/**
 * Lumora's "about" moment: a large statement that reveals word-by-word on
 * scroll (each `.word` picks up `.in` from the RevealObserver, staggered via
 * `data-delay`), paired with the differentiator rows. The left column is
 * sticky so the statement holds while the rows scroll past it.
 */
export function WhyAlkline() {
  return (
    <section id="why-alkline" className="bg-paper py-28 md:py-40">
      <Container className="grid gap-14 md:grid-cols-[0.85fr_1.15fr] md:gap-20">
        <div className="flex flex-col gap-7 md:sticky md:top-32 md:self-start">
          <span className="eyebrow reveal-up">
            <span className="eyebrow-dot" aria-hidden="true" />
            Why AXL
          </span>

          <h2 className="max-w-[14ch] text-3xl font-medium leading-[1.08] tracking-tightest text-ink md:text-[2.75rem]">
            {STATEMENT_WORDS.map((word, index) => (
              <Fragment key={`${word}-${index}`}>
                <span className="word" data-delay={`${index * 70}`}>
                  {word}
                </span>{" "}
              </Fragment>
            ))}
          </h2>

          <p
            className="reveal-up max-w-sm text-[0.975rem] leading-relaxed text-ink-muted"
            data-delay="120"
          >
            Three principles shape everything AXL does — and set it apart
            from the beauty tools you already know.
          </p>
        </div>

        <div>
          {DIFFERENTIATORS.map((item, index) => (
            <div
              key={item.id}
              className="reveal-up group border-b border-line py-8 first:pt-0 last:border-none"
              data-delay={`${index * 100}`}
            >
              <div className="flex items-baseline gap-5 transition-transform duration-500 ease-signature group-hover:translate-x-1.5">
                <span className="text-[0.8125rem] font-medium tabular-nums text-ink-faint transition-colors duration-500 ease-signature group-hover:text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl font-medium tracking-tightest text-ink md:text-2xl">
                    {item.title}
                  </h3>
                  <p className="max-w-lg text-[0.95rem] leading-relaxed text-ink-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
