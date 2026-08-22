"use client";

import { useEffect } from "react";

/**
 * Global reveal coordinator — the React-friendly port of Lumora's inline
 * IntersectionObserver reveal logic. It lets plain (even server-rendered)
 * markup animate on scroll just by adding a class, so sections don't each
 * need to become client components.
 *
 * Two modes:
 *  - Scroll reveals: any `.reveal-up` / `.line-wrap` / `.word` NOT marked
 *    `[data-intro]` gets `.in` when it scrolls into view.
 *  - Intro reveals: elements marked `[data-intro]` (the hero) wait for the
 *    loader's `lumora:intro` event, then reveal staggered by `data-delay`
 *    (ms). On client-side navigations (loader already gone) they reveal
 *    immediately. A timeout is a safety net if the loader never signals.
 *
 * A MutationObserver re-scans when route changes swap in new content.
 */
export function RevealObserver() {
  useEffect(() => {
    let introPlayed = false;

    const setDelay = (el: Element) => {
      const d = el.getAttribute("data-delay");
      if (d) (el as HTMLElement).style.transitionDelay = `${d}ms`;
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setDelay(entry.target);
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    const scrollSelector = ".reveal-up, .line-wrap, .word";

    const observeScrollReveals = () => {
      document.querySelectorAll(scrollSelector).forEach((el) => {
        if (el.classList.contains("in")) return;
        if (el.closest("[data-intro]")) return; // handled by intro path
        if (el.hasAttribute("data-observed")) return;
        el.setAttribute("data-observed", "");
        io.observe(el);
      });
    };

    const revealIntroEl = (el: Element) => {
      setDelay(el);
      el.classList.add("in");
    };

    const playIntro = () => {
      if (introPlayed) return;
      introPlayed = true;
      document.querySelectorAll("[data-intro]").forEach(revealIntroEl);
    };

    // Elements added after the intro already played (client navigation):
    // reveal them right away rather than leaving them hidden.
    const revealLateIntros = () => {
      if (!introPlayed) return;
      document
        .querySelectorAll("[data-intro]:not(.in)")
        .forEach(revealIntroEl);
    };

    const onIntro = () => playIntro();
    window.addEventListener("lumora:intro", onIntro);

    // Safety net: if the loader never fires the event, reveal anyway.
    const fallback = window.setTimeout(playIntro, 3000);

    observeScrollReveals();

    const mo = new MutationObserver(() => {
      window.requestAnimationFrame(() => {
        observeScrollReveals();
        revealLateIntros();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("lumora:intro", onIntro);
      window.clearTimeout(fallback);
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
