import {
  EMPTY_ONBOARDING,
  ONBOARDING_STORAGE_KEY,
} from "@/constants/onboarding";
import type {
  DobValue,
  OnboardingData,
  OnboardingProfile,
} from "@/types/onboarding";

/**
 * Dependency-free, SSR-safe persistence for the onboarding record.
 *
 * Mirrors the app's existing "client-first, degrade quietly" posture: every
 * function is guarded against a missing `window`/`localStorage` and never
 * throws, so a private-mode browser or a disabled storage API simply behaves
 * like a first-time visitor rather than crashing the flow.
 */

function isFiniteInt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Narrow an unknown blob to a DobValue, or null if it isn't one. */
function coerceDob(raw: unknown): DobValue | null {
  if (!raw || typeof raw !== "object") return null;
  const { day, month, year } = raw as Record<string, unknown>;
  if (!isFiniteInt(day) || !isFiniteInt(month) || !isFiniteInt(year)) {
    return null;
  }
  return { day, month, year };
}

/** Narrow an unknown blob to an OnboardingProfile, or null. */
function coerceProfile(raw: unknown): OnboardingProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const { displayName } = raw as Record<string, unknown>;
  if (typeof displayName !== "string") return null;
  return { displayName };
}

/** Repair any stored value into a valid OnboardingData (never rejects). */
function coerceOnboarding(raw: unknown): OnboardingData {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ONBOARDING };
  const record = raw as Record<string, unknown>;
  return {
    completed: record.completed === true,
    dob: coerceDob(record.dob),
    profile: coerceProfile(record.profile),
    completedAt:
      typeof record.completedAt === "string" ? record.completedAt : null,
  };
}

/** Read the persisted onboarding record, or the empty default. */
export function loadOnboarding(): OnboardingData {
  if (typeof window === "undefined") return { ...EMPTY_ONBOARDING };
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return { ...EMPTY_ONBOARDING };
    return coerceOnboarding(JSON.parse(raw) as unknown);
  } catch {
    return { ...EMPTY_ONBOARDING };
  }
}

/** Persist the onboarding record. Silently no-ops if storage is unavailable. */
export function saveOnboarding(data: OnboardingData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch {
    // Storage full or blocked — the flow still works for this session.
  }
}

/** Remove the persisted record (used by reset). */
export function clearOnboarding(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
