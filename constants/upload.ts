export const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const ACCEPTED_FILE_EXTENSIONS_LABEL = "JPG, PNG, or WEBP";

/** 10MB, expressed in bytes for validation against File.size */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const MAX_FILE_SIZE_LABEL = "10MB";

/**
 * Minimum accepted image dimension (px) on the shorter side. Rejects icons,
 * thumbnails, and corrupt files that pass the type/size checks but are too
 * small for a meaningful facial analysis.
 */
export const MIN_IMAGE_DIMENSION = 200;

export const PRIVACY_NOTICE =
  "Your image is analyzed securely and isn't stored unless you're signed in and choose to save it.";
