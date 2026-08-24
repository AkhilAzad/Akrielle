import type { ProfileData } from "@/types/profile";

/**
 * Shared constants for the profile dashboard. Kept in one place so the
 * localStorage keys, limits, and the editable option lists stay consistent
 * across the stores, the contexts, and the section UI.
 */

/** Versioned keys so a future schema change can invalidate old records cleanly. */
export const PROFILE_STORAGE_KEY = "alkline.profile.v1";
export const PORTFOLIO_STORAGE_KEY = "alkline.portfolio.v1";

/** The empty starting record (also the SSR / pre-hydration default). */
export const EMPTY_PROFILE: ProfileData = {
  personal: { pronouns: "", location: "" },
  appearance: { hairColor: "", eyeColor: "", skinType: "" },
  beauty: { styleVibe: "", focusAreas: [], skinConcerns: [] },
  app: { savePhotos: true },
  updatedAt: null,
};

/** Most-recent photos kept in the local portfolio (localStorage-friendly). */
export const PORTFOLIO_MAX_ITEMS = 6;
/** Longest edge, in px, a stored portfolio thumbnail is downscaled to. */
export const PORTFOLIO_THUMB_MAX_PX = 640;
/** JPEG quality used when encoding a stored thumbnail. */
export const PORTFOLIO_THUMB_QUALITY = 0.82;

/**
 * Option lists for the editable selects and chips. A blank value ("") always
 * means "unset". Kept deliberately short and neutral.
 */
export const SKIN_TYPES = [
  "Normal",
  "Dry",
  "Oily",
  "Combination",
  "Sensitive",
] as const;

export const HAIR_COLORS = [
  "Black",
  "Brown",
  "Blonde",
  "Auburn",
  "Red",
  "Grey",
  "White",
  "Other",
] as const;

export const EYE_COLORS = [
  "Brown",
  "Hazel",
  "Green",
  "Blue",
  "Grey",
  "Amber",
  "Other",
] as const;

export const STYLE_VIBES = [
  "Natural",
  "Classic",
  "Minimal",
  "Bold",
  "Editorial",
] as const;

export const FOCUS_AREAS = [
  "Skincare",
  "Symmetry",
  "Color match",
  "Hairstyle",
  "Makeup",
  "Grooming",
] as const;

export const SKIN_CONCERNS = [
  "Dryness",
  "Redness",
  "Acne",
  "Dark circles",
  "Uneven tone",
  "Fine lines",
] as const;
