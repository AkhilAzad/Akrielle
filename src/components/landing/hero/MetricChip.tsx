"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { easeSignature } from "@/components/animations/variants";
import type { ScanLandmark } from "@/types/landing";

interface MetricChipProps {
  landmark: ScanLandmark;
  /** Used to vary float amplitude/duration and parallax depth per card. */
  index: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

/**
 * One floating readout — "FACE SHAPE / OVAL" — styled as a glass
 * instrument panel. Three motion layers, kept deliberately separate
 * so they never fight each other:
 *  1. an outer layer that parallaxes toward the cursor, at a depth
 *     that differs per card (closer cards move more)
 *  2. a middle layer that handles the one-time fade/rise entrance
 *  3. an inner layer that floats continuously forever, with its own
 *     amplitude and duration so five cards never move identically
 */
export function MetricChip({ landmark, index, mouseX, mouseY }: MetricChipProps) {
  const shouldReduceMotion = useReducedMotion();

  const depth = 0.4 + (index % 3) * 0.35;
  const parallaxX = useTransform(mouseX, (v) => v * depth * 0.6);
  const parallaxY = useTransform(mouseY, (v) => v * depth * 0.6);

  const amplitude = 5 + (index % 3) * 4; // 5, 9, 13, 5, 9
  const duration = 4.5 + index * 0.7;

  return (
    <motion.div
      className="absolute z-10"
      style={{
        left: `${landmark.x}%`,
        top: `${landmark.y}%`,
        x: shouldReduceMotion ? 0 : parallaxX,
        y: shouldReduceMotion ? 0 : parallaxY,
      }}
    >
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: 10, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: landmark.delay, ease: easeSignature }}
      >
        <motion.div
          className="glass-panel flex items-center gap-2.5 px-3.5 py-2"
          animate={shouldReduceMotion ? undefined : { y: [0, -amplitude, 0] }}
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: landmark.delay + index * 0.4,
                }
          }
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span
              className={
                shouldReduceMotion
                  ? "absolute inline-flex h-full w-full rounded-full bg-gold/60"
                  : "absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-gold/60"
              }
            />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-bright" />
          </span>
          <div className="whitespace-nowrap leading-tight">
            <div className="font-mono text-[9px] uppercase tracking-widest2 text-ink-muted">
              {landmark.label}
            </div>
            <div className="font-mono text-[13px] text-ink">{landmark.value}</div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
