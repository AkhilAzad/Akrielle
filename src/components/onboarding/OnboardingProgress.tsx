"use client";

import { cn } from "@/utils/utils";
import {
  ONBOARDING_STEPS,
  type OnboardingStepId,
} from "@/constants/onboarding";

/**
 * Slim three-segment progress indicator for the onboarding wizard. Filled
 * segments (accent) show completed + current steps; the label under the
 * current step is inked. The terminal "done" screen fills all segments.
 */
export function OnboardingProgress({ current }: { current: OnboardingStepId }) {
  const currentIndex =
    current === "done"
      ? ONBOARDING_STEPS.length
      : ONBOARDING_STEPS.findIndex((s) => s.id === current);

  return (
    <div className="mx-auto flex w-full max-w-[300px] items-start gap-2.5">
      {ONBOARDING_STEPS.map((step, i) => {
        const reached = i <= currentIndex;
        const active = i === currentIndex;
        return (
          <div
            key={step.id}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <span
              className={cn(
                "h-[3px] w-full rounded-full transition-colors duration-500 ease-signature",
                reached ? "bg-accent" : "bg-line"
              )}
            />
            <span
              className={cn(
                "text-[0.625rem] font-medium uppercase tracking-widest2 transition-colors duration-500",
                active ? "text-ink" : "text-ink-faint"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
