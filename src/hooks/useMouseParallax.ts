"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, type SpringOptions } from "framer-motion";

interface UseMouseParallaxOptions {
  /** Max travel distance in px at the edge of the element. */
  strength?: number;
  spring?: SpringOptions;
  disabled?: boolean;
}

/**
 * Tracks pointer position relative to an element's center and exposes
 * two spring-smoothed motion values (x, y) for subtle depth/parallax —
 * e.g. `style={{ x, y }}` on a decorative layer. Resets to center on
 * pointer leave. No-ops (stays at 0,0) when `disabled` (reduced motion)
 * or on touch-only devices, since there's no persistent pointer.
 */
export function useMouseParallax<T extends HTMLElement>({
  strength = 16,
  spring = { stiffness: 150, damping: 20, mass: 0.6 },
  disabled = false,
}: UseMouseParallaxOptions = {}) {
  const ref = useRef<T | null>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);

  useEffect(() => {
    const node = ref.current;
    if (!node || disabled) return;

    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return;

    const handleMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const relX = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const relY = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      rawX.set(Math.max(-1, Math.min(1, relX)) * strength);
      rawY.set(Math.max(-1, Math.min(1, relY)) * strength);
    };

    const handleLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    window.addEventListener("pointermove", handleMove);
    node.addEventListener("pointerleave", handleLeave);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      node.removeEventListener("pointerleave", handleLeave);
    };
  }, [disabled, rawX, rawY, strength]);

  return { ref, x, y };
}
