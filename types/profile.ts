/**
 * Profile dashboard types — the richer, client-side profile a user manages on
 * the /profile page: self-reported personal + appearance details, beauty and
 * app preferences, and a small local photo portfolio.
 *
 * Display name and date of birth deliberately live in the onboarding record
 * (the single source captured at first run and edited in place on the profile
 * page), so they are NOT duplicated here — this keeps one source of truth per
 * field and avoids sync drift.
 */

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

/** The full profile record persisted to localStorage. */
export interface ProfileData {
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
