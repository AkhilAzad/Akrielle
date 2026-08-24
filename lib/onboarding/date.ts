import { MAX_AGE, MIN_AGE } from "@/constants/onboarding";
import type { DobValue } from "@/types/onboarding";

/**
 * Pure date helpers for the DOB picker. Kept free of React so the day-count,
 * clamping, and age logic can be reasoned about (and tested) in isolation.
 * `month` is always 1–12 here, not the JS 0–11 convention.
 */

/** Number of days in a given month/year (handles leap Februaries). */
export function daysInMonth(month: number, year: number): number {
  // Day 0 of the *next* month is the last day of this month.
  return new Date(year, month, 0).getDate();
}

/** Clamp the day down if it exceeds the days available in its month/year. */
export function clampDob(dob: DobValue): DobValue {
  const max = daysInMonth(dob.month, dob.year);
  return dob.day > max ? { ...dob, day: max } : dob;
}

/** Build a local Date at midnight for the given DOB. */
export function dobToDate(dob: DobValue): Date {
  return new Date(dob.year, dob.month - 1, dob.day);
}

/** Whole years old as of `now`. */
export function computeAge(dob: DobValue, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.year;
  const monthDiff = now.getMonth() + 1 - dob.month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.day)) {
    age -= 1;
  }
  return age;
}

export type DobRejection = "future" | "too-young" | "too-old";

export interface DobValidation {
  valid: boolean;
  age: number | null;
  reason: DobRejection | null;
}

/** Validate a DOB: real past date, and within [MIN_AGE, MAX_AGE]. */
export function validateDob(
  dob: DobValue,
  now: Date = new Date()
): DobValidation {
  const date = dobToDate(dob);
  if (Number.isNaN(date.getTime())) {
    return { valid: false, age: null, reason: null };
  }
  // Compare date-only (strip today's time) so a birthday today still counts.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date.getTime() > today.getTime()) {
    return { valid: false, age: null, reason: "future" };
  }
  const age = computeAge(dob, now);
  if (age < MIN_AGE) return { valid: false, age, reason: "too-young" };
  if (age > MAX_AGE) return { valid: false, age, reason: "too-old" };
  return { valid: true, age, reason: null };
}
