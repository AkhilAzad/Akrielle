"use client";

import { useMemo } from "react";

import { Button } from "@/components/common/Button";
import { SectionHeading } from "@/components/common/SectionHeading";
import { DobPicker } from "@/components/onboarding/DobPicker";
import { validateDob } from "@/lib/onboarding/date";
import { MIN_AGE } from "@/constants/onboarding";
import type { DobValue } from "@/types/onboarding";

interface DobStepProps {
  value: DobValue;
  onChange: (value: DobValue) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

/**
 * Step 2 — date of birth via the three scroll wheels. The Continue button is
 * gated on a valid DOB; the helper line explains why when it isn't (too young,
 * a future date, etc.) and otherwise quietly confirms the computed age.
 */
export function DobStep({
  value,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: DobStepProps) {
  const validation = useMemo(() => validateDob(value), [value]);

  let helper: string;
  if (validation.reason === "future") {
    helper = "That date is in the future — pick your date of birth.";
  } else if (validation.reason === "too-young") {
    helper = `You need to be at least ${MIN_AGE} to continue.`;
  } else if (validation.reason === "too-old") {
    helper = "Please double-check the year.";
  } else if (validation.valid && validation.age !== null) {
    helper = `You're ${validation.age} — this tailors your analysis.`;
  } else {
    helper = "Set your date of birth to continue.";
  }

  return (
    <div className="flex flex-col items-center">
      <SectionHeading
        eyebrow="About you"
        title="When were you born?"
        description="Your age helps calibrate every reading to the right baseline."
        align="center"
        className="items-center"
      />

      <div className="mt-10 w-full">
        <DobPicker value={value} onChange={onChange} />

        <p
          className={`mt-4 text-center text-sm ${
            validation.valid ? "text-ink-muted" : "text-accent"
          }`}
          role="status"
          aria-live="polite"
        >
          {helper}
        </p>
      </div>

      <div className="mt-10 flex w-full items-center justify-between gap-4">
        <Button variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button
          size="lg"
          showArrow
          onClick={onContinue}
          disabled={!validation.valid}
        >
          Continue
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-6 text-sm font-medium text-ink-faint underline-offset-4 transition-colors hover:text-ink-muted hover:underline focus-visible:outline-none"
      >
        Skip for now
      </button>
    </div>
  );
}
