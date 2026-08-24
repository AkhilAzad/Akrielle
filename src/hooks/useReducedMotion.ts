"use client";

import { useEffect, useState } from "react";

/**
 * Returns true if the user's OS/browser requests reduced motion.
 * Used by handcrafted SVG/CSS animations that fall outside
 * Framer Motion's own `useReducedMotion` (e.g. the hero visualization).
 */
export function useReducedMotionPreference(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(query.matches);

    const listener = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return prefersReduced;
}
