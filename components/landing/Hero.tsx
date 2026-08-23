"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { Clock } from "@/components/layout/Clock";
import { MagneticButton } from "@/components/landing/hero/MagneticButton";
import { LiquidReveal } from "@/components/landing/hero/LiquidReveal";
import { PRIMARY_CTA_LABEL, SECONDARY_CTA_LABEL, SITE } from "@/config/site";
import { SCAN_LANDMARKS } from "@/constants/landing";
import { easeSignature } from "@/components/animations/variants";
import { cn } from "@/lib/utils";

const HERO_LINES = ["Beauty,", "Understood by", "Intelligence."];

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * A small floating card over the hero visual that cycles through the kind of
 * readouts a scan produces (Face Shape, Undertone, Symmetry…). Lumora's
 * hero-card carousel, reframed as a live-analysis panel. Pointer-transparent
 * so it never blocks the liquid reveal underneath.
 */
function HeroMetricCard() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(
      () => setI((v) => (v + 1) % SCAN_LANDMARKS.length),
      2600
    );
    return () => window.clearInterval(id);
  }, [reduce]);

  const item = SCAN_LANDMARKS[i];

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 w-[13rem] rounded-card-sm border border-white/15 bg-black/55 p-4 text-ivory backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between text-[0.625rem] uppercase tracking-widest2 text-ivory-muted">
        <span>Live analysis</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          AI
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: easeSignature }}
        >
          <div className="text-[0.6875rem] uppercase tracking-widest2 text-ivory-muted">
            {item.label}
          </div>
          <div className="mt-1 text-2xl font-medium tracking-tightest">
            {item.value}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 flex gap-1.5">
        {SCAN_LANDMARKS.map((landmark, d) => (
          <span
            key={landmark.id}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-500",
              d === i ? "bg-accent" : "bg-white/15"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The hero, re-skinned to Lumora: a giant wordmark watermark, a masked
 * line-by-line headline, a burnt-orange primary CTA, and the liquid cursor-
 * reveal visual with a live-analysis card and capability chips. Entrance is
 * gated on the loader's intro event (see RevealObserver) via `data-intro`.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const visualScale = useTransform(scrollYProgress, [0, 1], [1, 1.04]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative isolate overflow-hidden bg-paper pt-36 pb-20 md:pt-44 md:pb-28"
    >
      {/* Soft neutral vignette (Lumora hero lighting, no colour cast). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 82% 0%, rgba(201,201,201,0.35) 0%, transparent 55%), radial-gradient(70% 60% at 5% 100%, rgba(227,226,223,0.5) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-multiply"
        style={{ backgroundImage: NOISE_BG }}
      />
      {/* Giant wordmark watermark, clipped by the bottom edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden"
      >
        <span className="watermark translate-y-[24%] text-[26vw] leading-none">
          {SITE.name}
        </span>
      </div>

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left column */}
          <div className="flex flex-col gap-7 lg:col-span-7">
            <span className="eyebrow reveal-up" data-intro data-delay="0">
              <span className="eyebrow-dot" aria-hidden="true" />
              AI Beauty Intelligence Platform
            </span>

            <h1 className="max-w-[16ch] text-[3rem] font-medium leading-[1.0] tracking-tightest text-ink sm:text-[4rem] lg:text-[5rem]">
              {HERO_LINES.map((line, i) => (
                <span
                  key={line}
                  className="line-wrap"
                  data-intro
                  data-delay={`${120 + i * 120}`}
                >
                  <span className="line-inner">{line}</span>
                </span>
              ))}
            </h1>

            <p
              className="reveal-up max-w-md text-[1.05rem] leading-relaxed text-ink-muted"
              data-intro
              data-delay="480"
            >
              One photo. AI-powered facial analysis with personalized beauty
              recommendations — delivered like a private consultation, not a
              catalogue.
            </p>

            <div
              className="reveal-up flex flex-col gap-4 pt-1 sm:flex-row sm:items-center"
              data-intro
              data-delay="600"
            >
              <MagneticButton>
                <Button href="/upload" size="lg" variant="gold" showArrow>
                  {PRIMARY_CTA_LABEL}
                </Button>
              </MagneticButton>
              <MagneticButton strength={10}>
                <Button href="#how-it-works" size="lg" variant="secondary">
                  {SECONDARY_CTA_LABEL}
                </Button>
              </MagneticButton>
            </div>

            <div
              className="reveal-up flex items-center gap-3 pt-3 text-[0.8125rem] text-ink-faint"
              data-intro
              data-delay="720"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              One photo · a private Beauty Profile in ~30 seconds · analyzed,
              never archived.
            </div>
          </div>

          {/* Right column — liquid-reveal visual */}
          <div className="reveal-up lg:col-span-5" data-intro data-delay="320">
            <motion.div
              style={reduce ? undefined : { y: visualY, scale: visualScale }}
              className="relative"
            >
              <LiquidReveal
                className="aspect-[4/5] w-full rounded-card border border-line"
                alt="Facial analysis preview"
                baseSrc="/assets/hero/hero-portrait.png"
                revealSrc="/assets/hero/hero-portrait.png"
              />
              <HeroMetricCard />
            </motion.div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["Facial Mapping", "Undertone", "Symmetry", "Skin Tone"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-control border border-line bg-surface/60 px-3 py-2 text-center text-[0.75rem] text-ink-muted"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="reveal-up mt-14 flex flex-col items-start justify-between gap-3 border-t border-line pt-5 text-[0.75rem] uppercase tracking-widest2 text-ink-faint sm:flex-row sm:items-center"
          data-intro
          data-delay="820"
        >
          <span className="inline-flex items-center gap-2">
            <span className="eyebrow-dot" aria-hidden="true" />
            Private by design
          </span>
          <span className="hidden sm:inline">
            Consultation-grade beauty intelligence
          </span>
          <Clock withLabel />
        </div>
      </Container>
    </section>
  );
}
