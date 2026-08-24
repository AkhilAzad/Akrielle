"use client";

import { Button } from "@/components/common/Button";
import { SectionHeading } from "@/components/common/SectionHeading";
import type { OnboardingProfile } from "@/types/onboarding";

interface ProfileStepProps {
  value: OnboardingProfile;
  onChange: (value: OnboardingProfile) => void;
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
  /** Prefill hint (e.g. the signed-in email's local part), if any. */
  emailHint?: string | null;
}

const fieldClass =
  "w-full rounded-control border border-line bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint transition-colors duration-300 focus:border-accent focus-visible:outline-none";

/**
 * Step 3 — profile. A single display-name field is enough to personalize the
 * app; it's optional, so an empty name simply falls back downstream. Submitting
 * the tiny form (Enter) is equivalent to pressing Continue.
 */
export function ProfileStep({
  value,
  onChange,
  onComplete,
  onBack,
  onSkip,
  emailHint,
}: ProfileStepProps) {
  const displayName = value.displayName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete();
  };

  return (
    <div className="flex flex-col items-center">
      <SectionHeading
        eyebrow="Profile"
        title="What should we call you?"
        description="This is how AXL will greet you. You can change it anytime."
        align="center"
        className="items-center"
      />

      <form onSubmit={handleSubmit} className="mt-10 w-full">
        <label
          htmlFor="onboarding-display-name"
          className="mb-2 block text-[0.6875rem] font-medium uppercase tracking-widest2 text-ink-muted"
        >
          Display name
        </label>
        <input
          id="onboarding-display-name"
          type="text"
          value={displayName}
          onChange={(e) => onChange({ ...value, displayName: e.target.value })}
          placeholder={emailHint ? emailHint : "Your name"}
          autoComplete="given-name"
          maxLength={60}
          className={fieldClass}
        />

        <div className="mt-10 flex w-full items-center justify-between gap-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onBack}
          >
            Back
          </Button>
          <Button type="submit" size="lg" showArrow>
            {displayName.trim() ? "Finish setup" : "Continue"}
          </Button>
        </div>
      </form>

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
