"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

interface ParallaxLayerProps {
  children: ReactNode;
  /** Positive = drifts down slower than scroll (background feel); negative = faster/opposite. */
  speed?: number;
  className?: string;
}

/**
 * Wraps decorative (non-content) elements — ambient blobs, ring motifs —
 * so they drift at a different rate than the page as it scrolls past
 * their section. Purely additive depth; never applied to text or
 * interactive elements.
 */
export function ParallaxLayer({ children, speed = 40, className }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-speed, speed]);

  return (
    <motion.div ref={ref} className={className} style={shouldReduceMotion ? undefined : { y }}>
      {children}
    </motion.div>
  );
}
