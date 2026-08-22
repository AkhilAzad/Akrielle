"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The scan's central visual. Deliberately distinct from the hero's
 * Beauty Intelligence Map (which annotates *results*): here nothing is
 * labeled yet — only a slow, single gold line "reading" the face, and
 * a breathing ring. No spinner, no percentage inside the visual itself.
 */
export function AnalysisVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto aspect-square w-full max-w-[220px]"
      role="img"
      aria-label="Alkline analyzing your photo"
    >
      <motion.div
        className="absolute inset-0 rounded-full border border-gold/25"
        animate={
          shouldReduceMotion
            ? {}
            : { scale: [1, 1.045, 1], opacity: [0.4, 0.75, 0.4] }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-[10%] rounded-full border border-gold/10"
        animate={
          shouldReduceMotion
            ? {}
            : { scale: [1, 1.03, 1], opacity: [0.3, 0.5, 0.3] }
        }
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />
      <div className="absolute inset-[14%] rounded-full border border-line" />

      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
        <svg viewBox="0 0 240 300" className="h-[58%] w-auto" fill="none" aria-hidden="true">
          <path
            d="M120 10C168 10 198 52 198 108C198 176 162 250 120 250C78 250 42 176 42 108C42 52 72 10 120 10Z"
            stroke="#111111"
            strokeOpacity={0.45}
            strokeWidth={1.1}
          />
        </svg>

        {!shouldReduceMotion && (
          <motion.div
            className="absolute inset-x-[20%] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, #B15F2C 50%, transparent)",
            }}
            initial={{ top: "16%", opacity: 0 }}
            animate={{ top: ["16%", "84%", "16%"], opacity: [0, 1, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </div>
    </motion.div>
  );
}
