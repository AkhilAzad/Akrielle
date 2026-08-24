import type { DobValue, OnboardingData } from "@/types/onboarding";

/**
 * Shared constants for the onboarding flow. Kept in one place so copy,
 * limits, and the localStorage key stay consistent across the store,
 * the context, and the step UI.
 */

/** Versioned so a future schema change can invalidate old records cleanly. */
export const ONBOARDING_STORAGE_KEY = "alkline.onboarding.v1";

/** The empty starting record (also the SSR / pre-hydration default). */
export const EMPTY_ONBOARDING: OnboardingData = {
  completed: false,
  dob: null,
  profile: null,
  completedAt: null,
};

/** Minimum age to continue. A light floor, not a hard legal gate. */
export const MIN_AGE = 13;
/** Sanity ceiling used only to reject clearly-bogus dates. */
export const MAX_AGE = 110;

/** Full month names, indexed by month-1. */
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** How far back the year wheel goes, relative to the current year. */
export const YEAR_SPAN = MAX_AGE;

/** A neutral adult default so the wheels don't open on today's date. */
export const DEFAULT_DOB: DobValue = { day: 1, month: 1, year: 2000 };

/** Where a freshly-onboarded user lands if no `?next=` was provided. */
export const DEFAULT_ONBOARDING_NEXT = "/upload";

/** The collection steps, in order, for the progress indicator. */
export const ONBOARDING_STEPS = [
  { id: "signin", label: "Account" },
  { id: "dob", label: "About you" },
  { id: "profile", label: "Profile" },
] as const;

export type OnboardingStepId =
  | (typeof ONBOARDING_STEPS)[number]["id"]
  | "done";
