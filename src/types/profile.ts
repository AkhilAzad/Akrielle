/**
 * Profile dashboard types — the richer profile a user manages on the /profile
 * page: display name, date of birth, self-reported personal + appearance
 * details, beauty and app preferences, and a small photo portfolio.
 *
 * This is the single source of truth for the PERMANENT profile. For a signed-in
 * user it is backed by the Supabase `profiles` row; for an anonymous visitor it
 * is kept in localStorage. Display name and date of birth live here too (they
 * are seeded from the onboarding record at first run, then owned here) so the
 * whole profile persists together with one source of truth per field.
 */

import type { DobValue } from "@/types/onboarding";

/** Free-text personal details the user can add beyond name / date of birth. */
export interface ProfilePersonal {
  pronouns: string;
  location: string;
}

/** Self-reported appearance attributes — distinct from AI-derived readings. */
export interface ProfileAppearance {
  hairColor: string;
  eyeColor: string;
  skinType: string;
}

/** Beauty & style preferences that personalize the experience. */
export interface BeautyPreferences {
  styleVibe: string;
  /** Areas the user wants to focus on (multi-select). */
  focusAreas: string[];
  /** Skin concerns the user has flagged (multi-select). */
  skinConcerns: string[];
}

/** App-level / privacy preferences. */
export interface AppPreferences {
  /** Whether uploaded photos may be saved to the local portfolio. */
  savePhotos: boolean;
}

/** The full profile record (Supabase `profiles` row when signed in). */
export interface ProfileData {
  /** What the user would like to be called. "" when unset. */
  displayName: string;
  /** Date of birth, or null if not set. */
  dob: DobValue | null;
  personal: ProfilePersonal;
  appearance: ProfileAppearance;
  beauty: BeautyPreferences;
  app: AppPreferences;
  /** ISO timestamp of the last edit, or null if never edited. */
  updatedAt: string | null;
}

/** One saved photo in the local portfolio (a downscaled JPEG data URL). */
export interface PortfolioItem {
  id: string;
  /** Downscaled JPEG data URL, kept small enough for localStorage. */
  dataUrl: string;
  /** ISO timestamp when it was added. */
  addedAt: string;
  /** Original file name, when known (may be empty). */
  name: string;
}
