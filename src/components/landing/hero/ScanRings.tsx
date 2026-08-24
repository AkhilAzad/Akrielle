"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The concentric rings + sweeping scan line behind the face mesh.
 * Four layers, each doing one job, all continuous and each running
 * at its own speed so the instrument never reads as "finished":
 *  - a large outer ring, rotating almost imperceptibly slowly
 *  - a dashed ring inside it, rotating the other direction
 *  - a hairline ring rotating a third, faster direction
 *  - a soft horizontal scan line sweeping top-to-bottom on a loop,
 *    clipped to a circle so it reads as an instrument scan rather
 *    than a stripe crossing a square box
 * The whole assembly also breathes very slightly, so it feels alive
 * even before the cursor ever moves.
 */
export function ScanRings() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute inset-0"
      animate={shouldReduceMotion ? undefined : { scale: [1, 1.015, 1] }}
      transition={shouldReduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <motion.div
        className="absolute inset-[-4%] rounded-full border border-gold/10"
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={shouldReduceMotion ? undefined : { duration: 90, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border border-dashed border-gold/25"
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={shouldReduceMotion ? undefined : { duration: 46, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[7%] rounded-full border border-gold/15"
        animate={shouldReduceMotion ? undefined : { rotate: -360 }}
        transition={shouldReduceMotion ? undefined : { duration: 64, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[14%] rounded-full border border-ink/10"
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={shouldReduceMotion ? undefined : { duration: 34, repeat: Infinity, ease: "linear" }}
      />

      {/* Sweeping scan line, clipped to the innermost circle */}
      <div className="absolute inset-[14%] overflow-hidden rounded-full">
        {shouldReduceMotion ? (
          <div className="absolute inset-x-0 top-1/2 h-px bg-gold-bright/40" />
        ) : (
          <motion.div
            className="absolute inset-x-[-10%] h-24"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(207,128,71,0.35) 45%, rgba(207,128,71,0.55) 50%, rgba(207,128,71,0.35) 55%, transparent 100%)",
            }}
            initial={{ y: "-60%", opacity: 0 }}
            animate={{ y: "60%", opacity: [0, 0.9, 0.9, 0] }}
            transition={{
              duration: 4.2,
              repeat: Infinity,
              ease: [0.45, 0, 0.55, 1],
            }}
          />
        )}

        {/* Vertical scanning beam — a second axis crossing the
            horizontal sweep, so the instrument reads as scanning the
            face on both axes rather than just top-to-bottom. Runs on
            its own slower, offset loop so the two beams don't cross
            in lockstep every cycle. */}
        {!shouldReduceMotion && (
          <motion.div
            className="absolute inset-y-[-10%] w-20"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(177,95,44,0.28) 45%, rgba(207,128,71,0.5) 50%, rgba(177,95,44,0.28) 55%, transparent 100%)",
            }}
            initial={{ x: "-60%", opacity: 0 }}
            animate={{ x: "60%", opacity: [0, 0.8, 0.8, 0] }}
            transition={{
              duration: 5.4,
              repeat: Infinity,
              ease: [0.45, 0, 0.55, 1],
              delay: 1.6,
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
