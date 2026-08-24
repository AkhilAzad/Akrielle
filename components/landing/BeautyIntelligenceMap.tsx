"use client";

import { motion, useReducedMotion, useTransform } from "framer-motion";
import { SCAN_LANDMARKS } from "@/constants/landing";
import { cn } from "@/lib/utils";
import { useMouseParallax } from "@/hooks/useMouseParallax";

/**
 * The Beauty Intelligence Map — AXL's signature visual.
 *
 * An abstracted, calm facial silhouette annotated the way a
 * consultant's notebook would be: thin burnt-orange guide lines, quiet
 * Onest labels, and a slow "reading" sequence rather than any
 * scanning/sci-fi motif. No neon, no grid overlays, no HUD framing.
 */
export function BeautyIntelligenceMap() {
  const shouldReduceMotion = useReducedMotion();
  const { ref, x, y } = useMouseParallax<HTMLDivElement>({
    strength: 8,
    disabled: !!shouldReduceMotion,
  });
  // Reads as a hair-thin 3D tilt toward the cursor — soft depth, not a gimmick.
  const rotateX = useTransform(y, (v) => -v * 0.6);
  const rotateY = useTransform(x, (v) => v * 0.6);

  return (
    <motion.div
      ref={ref}
      className="relative mx-auto aspect-[4/5] w-full max-w-[420px]"
      style={shouldReduceMotion ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      role="img"
      aria-label="Illustration of AXL's facial analysis identifying face shape, undertone, eye shape, and skin tone"
    >
      {/* Ambient rotating ring — the only "instrument" motif, kept extremely slow and quiet */}
      <motion.div
        className="absolute inset-0 rounded-full border border-gold/25"
        animate={shouldReduceMotion ? {} : { rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-[10%] rounded-full border border-line" />

      {/* Face silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 240 300"
          className="h-[62%] w-auto"
          fill="none"
          aria-hidden="true"
        >
          <motion.path
            d="M120 10C168 10 198 52 198 108C198 176 162 250 120 250C78 250 42 176 42 108C42 52 72 10 120 10Z"
            stroke="#111111"
            strokeOpacity={0.55}
            strokeWidth={1.1}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* quiet interior guide lines, evoking a consultant's sketch, not a HUD */}
          <motion.path
            d="M120 108C138 108 152 122 152 140"
            stroke="#B15F2C"
            strokeWidth={1}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 1.4, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.line
            x1="90"
            y1="96"
            x2="150"
            y2="96"
            stroke="#111111"
            strokeOpacity={0.25}
            strokeWidth={1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
      </div>

      {/* Landmark nodes + annotations */}
      {SCAN_LANDMARKS.map((landmark) => (
        <motion.div
          key={landmark.id}
          className="absolute flex items-center gap-2"
          style={{
            left: `${landmark.x}%`,
            top: `${landmark.y}%`,
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: landmark.delay, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full bg-gold/50",
                !shouldReduceMotion && "animate-pulse-ring"
              )}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-deep" />
          </span>
          <div className="whitespace-nowrap rounded-full border border-line bg-surface/90 px-3 py-1 shadow-subtle backdrop-blur-sm">
            <span className="eyebrow text-ink-faint">{landmark.label}</span>{" "}
            <span className="text-sm font-medium tracking-tightest text-ink">{landmark.value}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
