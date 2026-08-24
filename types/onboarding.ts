/**
 * Onboarding types — the small, client-side profile a first-time visitor
 * builds before entering the main app: date of birth (from the three-wheel
 * picker) and a lightweight profile. Framework-agnostic so the localStorage
 * store and the context can share them.
 */

/** A calendar date of birth. `month` is 1–12 (not the JS 0–11 convention). */
export interface DobValue {
  day: number;
  month: number;
  year: number;
}

/** The bits of profile we collect during onboarding. Deliberately minimal —
 *  the app has no server-side profile table, so this stays client-only. */
export interface OnboardingProfile {
  /** What the user would like to be called. */
  displayName: string;
}

/** The full onboarding record persisted to localStorage. */
export interface OnboardingData {
  /** True once the user has finished (or skipped) onboarding. */
  completed: boolean;
  /** Chosen date of birth, or null if skipped. */
  dob: DobValue | null;
  /** Profile details, or null if skipped. */
  profile: OnboardingProfile | null;
  /** ISO timestamp of completion, or null. */
  completedAt: string | null;
}
