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
import type { BeautyScoreData } from "@/types/results";
import { useMouseParallax } from "@/hooks/useMouseParallax";

interface BeautyScoreCardProps {
  data: BeautyScoreData;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const easing = [0.22, 1, 0.36, 1] as const;

export function BeautyScoreCard({ data }: BeautyScoreCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  const { ref: tiltRef, x: tiltX, y: tiltY } = useMouseParallax<HTMLDivElement>({
    strength: 6,
    disabled: !!shouldReduceMotion,
  });
  const rotateX = useTransform(tiltY, (v) => -v * 0.5);
  const rotateY = useTransform(tiltX, (v) => v * 0.5);

  const count = useMotionValue(0);
  const roundedScore = useTransform(count, (latest) => Math.round(latest));
  const dashOffset = useTransform(count, (latest) => CIRCUMFERENCE * (1 - latest / 100));

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(count, data.score, {
      duration: 1.8,
      delay: 0.2,
      ease: easing,
    });
    return controls.stop;
  }, [isInView, data.score, count]);

  return (
    <motion.div
      ref={(node) => {
        cardRef.current = node;
        tiltRef.current = node;
      }}
      style={shouldReduceMotion ? undefined : { rotateX, rotateY, transformPerspective: 1200 }}
      className="relative overflow-hidden rounded-card border border-line bg-charcoal px-8 py-12 text-ivory shadow-card md:px-14 md:py-16"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.22] blur-3xl"
        style={{ background: "radial-gradient(circle, #DE1F35 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center gap-10 md:flex-row md:justify-between md:gap-16">
        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
          <span className="eyebrow eyebrow-on-dark">
            <span className="eyebrow-dot" aria-hidden="true" />
            {data.headline}
          </span>
          <h2 className="max-w-sm text-3xl font-medium leading-tight tracking-tightest text-ivory md:text-4xl">
            A profile built entirely around you.
          </h2>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-ivory-muted">
            {data.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-6 md:justify-start">
            {data.breakdown.map((item) => (
              <div key={item.id} className="flex flex-col gap-1.5">
                <span className="eyebrow eyebrow-on-dark text-ivory-faint">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full bg-accent"
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${item.value}%` } : { width: 0 }}
                      transition={{ duration: 1.2, delay: 0.3, ease: easing }}
                    />
                  </div>
                  <span className="text-sm tabular-nums text-ivory-muted">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="relative flex h-[180px] w-[180px] shrink-0 items-center justify-center"
          role="img"
          aria-label={`Beauty harmony score: ${data.score} out of 100`}
        >
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="4"
            />
            <motion.circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="#DE1F35"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ strokeDashoffset: dashOffset }}
            />
          </svg>
          <div className="absolute flex flex-col items-center" aria-hidden="true">
            <motion.span className="text-5xl font-medium tracking-tightest text-ivory">
              {roundedScore}
            </motion.span>
            <span className="text-xs text-ivory-faint">out of 100</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
