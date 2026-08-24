"use client";

import { useEffect } from "react";

/**
 * Lumora smooth scroll, powered by Lenis.
 *
 * The npm registry is locked in this environment, so Lenis cannot be bundled.
 * Instead — exactly as the original Lumora page did — we load it as an ES
 * module from a CDN at runtime via an injected module <script>. This keeps the
 * bundler out of it entirely (no build-time resolution of the URL).
 *
 * Graceful fallback: if the CDN is unreachable or blocked, the script simply
 * fails and the page keeps native scrolling (globals.css sets
 * `scroll-behavior: smooth`). Under prefers-reduced-motion we don't load it.
 *
 * While active, `window.__lenis` holds the instance and a delegated click
 * handler turns in-page `#anchor` links into smooth Lenis scrolls.
 */
const LENIS_URL = "https://unpkg.com/lenis@1.3.23/dist/lenis.mjs";

export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    // Lenis' recommended CSS so its class-based scroll management behaves.
    const style = document.createElement("style");
    style.setAttribute("data-lenis", "");
    style.textContent = `
      html.lenis, html.lenis body { height: auto; }
      .lenis.lenis-smooth { scroll-behavior: auto !important; }
      .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
      .lenis.lenis-stopped { overflow: hidden; }
    `;
    document.head.appendChild(style);

    const script = document.createElement("script");
    script.type = "module";
    script.setAttribute("data-lenis", "");
    script.textContent = `
      try {
        const { default: Lenis } = await import(${JSON.stringify(LENIS_URL)});
        const lenis = new Lenis({
          duration: 1.1,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 1.6,
        });
        window.__lenis = lenis;
        let id;
        const raf = (time) => { lenis.raf(time); id = requestAnimationFrame(raf); };
        id = requestAnimationFrame(raf);
        window.__lenisRaf = () => cancelAnimationFrame(id);

        const onClick = (e) => {
          const a = e.target.closest && e.target.closest('a[href^="#"]');
          if (!a) return;
          const href = a.getAttribute('href');
          if (!href || href.length < 2) return;
          const el = document.querySelector(href);
          if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: 0 }); }
        };
        document.addEventListener('click', onClick);
        window.__lenisClick = onClick;
        window.dispatchEvent(new Event('lenis:ready'));
      } catch (err) {
        /* CDN blocked — native scrolling stays in effect. */
      }
    `;
    document.body.appendChild(script);

    return () => {
      const w = window as unknown as {
        __lenis?: { destroy?: () => void };
        __lenisRaf?: () => void;
        __lenisClick?: (e: MouseEvent) => void;
      };
      try {
        w.__lenisRaf?.();
        if (w.__lenisClick) document.removeEventListener("click", w.__lenisClick);
        w.__lenis?.destroy?.();
        w.__lenis = undefined;
      } catch {
        /* no-op */
      }
      style.remove();
      script.remove();
    };
  }, []);

  return null;
}
