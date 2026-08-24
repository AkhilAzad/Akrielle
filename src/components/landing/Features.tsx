import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { FEATURES } from "@/constants/landing";

/**
 * Lumora's dark "work" cards, reframed as capabilities. Each card is a charcoal
 * panel with a giant clipped index watermark, an icon tile, and a hover lift.
 * The reveal wrapper carries `.reveal-up` so the card's own hover translate
 * doesn't compete with the entrance transform.
 */
export function Features() {
  return (
    <section
      id="features"
      className="border-y border-line bg-surface py-28 md:py-40"
    >
      <Container>
        <SectionHeading
          eyebrow="Capabilities"
          title="An intelligence engine, built for beauty."
          description="Each capability exists to make one thing possible: recommendations that genuinely fit your features."
        />

        <div className="mt-14 grid gap-5 md:mt-20 md:grid-cols-2">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="reveal-up"
                data-delay={`${index * 100}`}
              >
                <article className="group relative h-full overflow-hidden rounded-card bg-charcoal p-8 text-ivory transition-transform duration-500 ease-signature hover:-translate-y-1.5 md:p-10">
                  <span
                    aria-hidden="true"
                    className="watermark watermark-light absolute right-3 top-1 text-[6.5rem] leading-none"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="relative flex h-full flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-control border border-white/15 bg-white/5 transition-colors duration-500 ease-signature group-hover:border-accent/60">
                        <Icon
                          className="h-5 w-5 text-accent-from"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="h-5 w-5 text-ivory-faint transition-all duration-500 ease-signature group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-from"
                      />
                    </div>

                    <h3 className="text-xl font-medium tracking-tightest text-ivory md:text-2xl">
                      {feature.title}
                    </h3>
                    <p className="text-[0.95rem] leading-relaxed text-ivory-muted">
                      {feature.description}
                    </p>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
