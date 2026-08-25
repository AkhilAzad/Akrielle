"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/utils/utils";

interface MagneticButtonProps {
  children: React.ReactNode;
  /** Max pull distance in px at the edge of the wrapper. */
  strength?: number;
  className?: string;
}

/**
 * Wraps a CTA (unchanged) with a magnetic hover pull and a soft glow.
 * Deliberately a wrapper rather than a Button variant: the button's
 * own colors, sizing, and hover scale stay exactly as they are —
 * this only adds a spring-driven position offset and a glow layer
 * around it.
 */
export function MagneticButton({ children, strength = 14, className }: MagneticButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 200, damping: 16, mass: 0.4 });
  const springY = useSpring(rawY, { stiffness: 200, damping: 16, mass: 0.4 });

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    rawX.set(Math.max(-1, Math.min(1, relX)) * strength);
    rawY.set(Math.max(-1, Math.min(1, relY)) * strength);
  };

  const handleLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ x: shouldReduceMotion ? 0 : springX, y: shouldReduceMotion ? 0 : springY }}
      className={cn("relative inline-flex", className)}
    >
      {!shouldReduceMotion && (
        <motion.span
          className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-xl"
          style={{ background: "radial-gradient(circle, rgba(222,31,53,0.5), transparent 70%)" }}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.85 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      )}
      {children}
    </motion.div>
  );
}
