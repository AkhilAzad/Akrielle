"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { GlowUpPotentialData } from "@/types/results";
import { useMouseParallax } from "@/hooks/useMouseParallax";

interface GlowUpPotentialCardProps {
  data: GlowUpPotentialData;
}

const easing = [0.22, 1, 0.36, 1] as const;

export function GlowUpPotentialCard({ data }: GlowUpPotentialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  const { ref: tiltRef, x: tiltX, y: tiltY } = useMouseParallax<HTMLDivElement>({
    strength: 6,
    disabled: !!shouldReduceMotion,
  });
  const rotateX = useTransform(tiltY, (v) => -v * 0.5);
  const rotateY = useTransform(tiltX, (v) => v * 0.5);

  const currentCount = useMotionValue(0);
  const potentialCount = useMotionValue(0);
  const currentRounded = useTransform(currentCount, (v) => Math.round(v));
  const potentialRounded = useTransform(potentialCount, (v) => Math.round(v));

  const gap = Math.max(0, Math.round(data.potentialScore - data.currentAppearanceScore));

  useEffect(() => {
    if (!isInView) return;
    const c1 = animate(currentCount, data.currentAppearanceScore, {
      duration: 1.4,
      delay: 0.2,
      ease: easing,
    });
    const c2 = animate(potentialCount, data.potentialScore, {
      duration: 1.4,
      delay: 0.4,
      ease: easing,
    });
    return () => {
      c1.stop();
      c2.stop();
    };
  }, [isInView, data.currentAppearanceScore, data.potentialScore, currentCount, potentialCount]);

  return (
    <motion.div
      ref={(node) => {
        cardRef.current = node;
        tiltRef.current = node;
      }}
      style={shouldReduceMotion ? undefined : { rotateX, rotateY, transformPerspective: 1200 }}
      className="relative overflow-hidden rounded-card bg-charcoal px-8 py-12 text-ivory shadow-card md:px-14 md:py-16"
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] translate-x-1/3 -translate-y-1/3 rounded-full opacity-[0.22] blur-3xl"
        style={{ background: "radial-gradient(circle, #B15F2C 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-16">
        <div className="flex max-w-md flex-col gap-4">
          <span className="eyebrow eyebrow-on-dark">
            <span className="eyebrow-dot" aria-hidden="true" />
            Glow-Up Potential
          </span>
          <h3 className="text-3xl font-medium leading-tight tracking-tightest text-ivory md:text-4xl">
            You have room to grow — here&apos;s why.
          </h3>
          <p className="text-[0.95rem] leading-relaxed text-ivory-muted">{data.reason}</p>

          {gap > 0 && (
            <div className="mt-2 inline-flex w-fit items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-4 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-accent-from" strokeWidth={1.6} aria-hidden="true" />
              <span className="text-xs font-medium text-ivory">
                +{gap} point{gap === 1 ? "" : "s"} of realistic headroom
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-6 sm:gap-10">
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full border border-white/15"
              role="img"
              aria-label={`Current appearance score: ${data.currentAppearanceScore} out of 100`}
            >
              <motion.span className="text-4xl font-medium tracking-tightest text-ivory">
                {currentRounded}
              </motion.span>
            </div>
            <span className="eyebrow eyebrow-on-dark text-ivory-faint">Current</span>
          </div>

          <div className="flex flex-col items-center gap-1 text-ivory-faint" aria-hidden="true">
            <TrendingUp className="h-5 w-5" strokeWidth={1.4} />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div
              className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full border border-accent/50"
              role="img"
              aria-label={`Improvement potential score: ${data.potentialScore} out of 100`}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-full opacity-40 blur-md"
                style={{ background: "radial-gradient(circle, #B15F2C 0%, transparent 72%)" }}
                aria-hidden="true"
              />
              <motion.span className="relative text-4xl font-medium tracking-tightest text-accent-from">
                {potentialRounded}
              </motion.span>
            </div>
            <span className="eyebrow text-accent-from">Potential</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
