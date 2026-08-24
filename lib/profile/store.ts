import { EMPTY_PROFILE, PROFILE_STORAGE_KEY } from "@/constants/profile";
import type {
  AppPreferences,
  BeautyPreferences,
  ProfileAppearance,
  ProfileData,
  ProfilePersonal,
} from "@/types/profile";

/**
 * Dependency-free, SSR-safe persistence for the profile-dashboard record.
 *
 * Mirrors lib/onboarding/store.ts: every function is guarded against a missing
 * `window`/`localStorage` and never throws, so a private-mode browser or a
 * disabled storage API simply behaves like an empty profile rather than
 * crashing the page.
 */

/** Coerce an unknown value to a trimmed string, or "" as the "unset" default. */
function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Coerce an unknown value to a string[] (dropping non-string members). */
function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function coercePersonal(raw: unknown): ProfilePersonal {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { pronouns: str(r.pronouns), location: str(r.location) };
}

function coerceAppearance(raw: unknown): ProfileAppearance {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    hairColor: str(r.hairColor),
    eyeColor: str(r.eyeColor),
    skinType: str(r.skinType),
  };
}

function coerceBeauty(raw: unknown): BeautyPreferences {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    styleVibe: str(r.styleVibe),
    focusAreas: strArray(r.focusAreas),
    skinConcerns: strArray(r.skinConcerns),
  };
}

function coerceApp(raw: unknown): AppPreferences {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  // Default savePhotos to true (matches EMPTY_PROFILE) unless explicitly false.
  return { savePhotos: r.savePhotos !== false };
}

/** Repair any stored value into a valid ProfileData (never rejects). */
function coerceProfile(raw: unknown): ProfileData {
  if (!raw || typeof raw !== "object") return { ...EMPTY_PROFILE };
  const record = raw as Record<string, unknown>;
  return {
    personal: coercePersonal(record.personal),
    appearance: coerceAppearance(record.appearance),
    beauty: coerceBeauty(record.beauty),
    app: coerceApp(record.app),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : null,
  };
}

/** Read the persisted profile record, or the empty default. */
export function loadProfile(): ProfileData {
  if (typeof window === "undefined") return { ...EMPTY_PROFILE };
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...EMPTY_PROFILE };
    return coerceProfile(JSON.parse(raw) as unknown);
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

/** Persist the profile record. Silently no-ops if storage is unavailable. */
export function saveProfile(data: ProfileData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked — edits still apply for this session.
  }
}

/** Remove the persisted profile record (used by "clear all"). */
export function clearProfile(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
