import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { MagneticButton } from "@/components/landing/hero/MagneticButton";
import { PRIMARY_CTA_LABEL } from "@/config/site";

const CTA_LINES = ["Discover what", "truly suits you."];

/**
 * Pre-footer invitation. A calm surface band with a soft accent bloom, a
 * masked line-by-line headline (revealed on scroll via `.line-wrap`), and the
 * primary CTA. Kept lighter than the dark footer CTA so the two don't compete.
 */
export function CTA() {
  return (
    <section className="relative overflow-hidden bg-surface py-28 text-ink md:py-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
      />

      <Container className="relative flex flex-col items-center gap-8 text-center">
        <span className="eyebrow reveal-up">
          <span className="eyebrow-dot" aria-hidden="true" />
          Your Beauty Profile, Awaiting
        </span>

        <h2 className="max-w-2xl text-4xl font-medium leading-[1.02] tracking-tightest text-ink md:text-6xl">
          {CTA_LINES.map((line, index) => (
            <span
              key={line}
              className="line-wrap reveal-up"
              data-delay={`${index * 120}`}
            >
              <span className="line-inner">{line}</span>
            </span>
          ))}
        </h2>

        <p
          className="reveal-up max-w-md text-[1rem] leading-relaxed text-ink-muted"
          data-delay="240"
        >
          One photo. A few quiet moments of analysis. A beauty profile built
          entirely around your features.
        </p>

        <div className="reveal-up" data-delay="320">
          <MagneticButton>
            <Button href="/upload" size="lg" variant="gold" showArrow>
              {PRIMARY_CTA_LABEL}
            </Button>
          </MagneticButton>
        </div>
      </Container>
    </section>
  );
}
