"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/config/site";

/**
 * Lumora's intro loader. A dark full-screen overlay with the wordmark, the
 * tagline, and a progress bar that fills 0 → 100% (eased) over ~1.3s, then
 * slides up out of view. When it starts sliding it dispatches `lumora:intro`,
 * which <RevealObserver> uses to play the hero's staggered entrance.
 *
 * Shows once per hard page load. Because the root layout doesn't remount on
 * client-side navigation, it naturally won't reappear when moving between
 * routes. Skipped entirely under prefers-reduced-motion (intro fires at once).
 */
const FILL_MS = 1300;
const HOLD_MS = 640;
const EXIT_MS = 900;

// Guards against a second run (e.g. React strict-mode double effect in dev).
let hasShown = false;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Phase = "fill" | "exit" | "done";

export function Loader() {
  const [phase, setPhase] = useState<Phase>("fill");
  const [progress, setProgress] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const fireIntro = () =>
      window.dispatchEvent(new Event("lumora:intro"));

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (hasShown || reduce) {
      setPhase("done");
      fireIntro();
      return;
    }
    hasShown = true;

    document.body.style.overflow = "hidden";

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / FILL_MS);
      setProgress(Math.round(easeInOutCubic(t) * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        const hold = window.setTimeout(() => {
          setPhase("exit");
          document.body.style.overflow = "";
          fireIntro();
          const done = window.setTimeout(() => setPhase("done"), EXIT_MS);
          timers.current.push(done);
        }, HOLD_MS);
        timers.current.push(hold);
      }
    };
    raf = requestAnimationFrame(tick);

    const captured = timers.current;
    return () => {
      cancelAnimationFrame(raf);
      captured.forEach(clearTimeout);
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-surface-2 px-6 py-8 text-ivory transition-transform duration-[900ms] ease-signature sm:px-10 sm:py-12"
      style={{ transform: phase === "exit" ? "translateY(-100%)" : "none" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tightest">
          {SITE.name}
        </span>
        <span className="text-[0.6875rem] font-medium uppercase tracking-widest2 text-ivory-muted">
          Beauty Intelligence
        </span>
      </div>

      <div className="mx-auto w-full max-w-[42rem]">
        <p className="mb-6 max-w-[26rem] text-sm leading-relaxed text-ivory-muted">
          {SITE.tagline}
        </p>
        <div className="flex items-end justify-between gap-6">
          <div className="h-px w-full overflow-hidden bg-white/12">
            <div
              className="h-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="min-w-[3ch] text-right text-sm tabular-nums text-ivory">
            {progress}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[0.6875rem] uppercase tracking-widest2 text-ivory-faint">
        <span>Loading</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}
