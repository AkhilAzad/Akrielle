import type { Transition, Variants } from "framer-motion";

/**
 * Alkline Motion System
 * ------------------------------------------------------------------
 * A single shared vocabulary for easing, timing, and choreography so
 * every section, card, and control moves with the same "hand." Values
 * are additive to the existing design system — no colors, spacing, or
 * layout live here, only motion.
 */

/** Apple-style deceleration curve — used for anything entering the screen. */
export const easeSignature = [0.22, 1, 0.36, 1] as const;
/** Slightly snappier curve for micro-interactions (hover/tap/press). */
export const easeMicro = [0.32, 0.72, 0, 1] as const;
/** Gentle curve for exits — quicker than entrances, never abrupt. */
export const easeExit = [0.4, 0, 1, 1] as const;

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 30,
  mass: 0.7,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 24,
  mass: 0.9,
};

/** Fade + rise — the workhorse entrance used across headings and copy. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeSignature },
  },
};

/** Same as fadeUp but with a whisper of blur for a softer, cinematic arrival. */
export const fadeUpBlur: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: easeSignature },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: easeSignature } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: easeSignature },
  },
};

/**
 * Parent container that staggers its direct motion children. Pair with
 * `staggerItem` (or `fadeUp`) on each child instead of hand-rolling
 * `index * delay` math — keeps large grids reading as one choreographed
 * reveal rather than a flurry of independent timers.
 */
export const staggerContainer = (
  staggerChildren = 0.09,
  delayChildren = 0
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeSignature },
  },
};

/** Default viewport settings so "once" scroll reveals feel consistent. */
export const viewportOnce = { once: true, margin: "-80px" } as const;
export const viewportOnceTight = { once: true, margin: "-40px" } as const;

/** Shared hover/tap physics for interactive elements (buttons, chips, icons). */
export const pressable = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.975 },
  transition: springSnappy,
};

/** Subtle lift used on hoverable cards — depth, not distortion. */
export const liftHover = {
  whileHover: { y: -4 },
  transition: springSoft,
};
