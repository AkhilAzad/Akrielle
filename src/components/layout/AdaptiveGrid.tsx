"use client";

import { useEffect } from "react";

/**
 * Lumora's adaptive grid, JS half.
 *
 * The CSS in globals.css handles every width up to 1920px via viewport-unit
 * root font-sizes. Above 1920px there is no media query, so this scales the
 * root font-size up linearly with the viewport — keeping the layout's
 * proportions intact on very large monitors exactly as the original did.
 *
 *   size = 16 - (16 * ((1920 - w) / 1920) * 100 * 0.6666) / 100
 *
 * For w > 1920 the correction term is negative, so size grows past 16px.
 * For w <= 1920 we clear the inline style and let the CSS media queries win.
 */
const FONT_BASE = 16;
const BASE_WIDTH = 1920;
const COEF = 0.6666;

export function AdaptiveGrid() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const w = window.innerWidth;
      const size =
        FONT_BASE -
        (FONT_BASE * (((BASE_WIDTH - w) / BASE_WIDTH) * 100) * COEF) / 100;

      if (w > BASE_WIDTH && size > FONT_BASE) {
        root.style.fontSize = `${size}px`;
      } else {
        root.style.removeProperty("font-size");
      }
    };

    apply();
    window.addEventListener("resize", apply, { passive: true });
    return () => {
      window.removeEventListener("resize", apply);
      root.style.removeProperty("font-size");
    };
  }, []);

  return null;
}
