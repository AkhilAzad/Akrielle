/**
 * Shared contract between the /api/analyze route and the client.
 *
 * Every failure the endpoint can return carries a stable `code` so the UI
 * can decide how to respond — whether the user should simply retry (a
 * transient/server problem) or choose a different photo (something about
 * the image itself).
 */
export type AnalyzeErrorCode =
  | "no-image"
  | "invalid-type"
  | "too-large"
  | "empty-file"
  | "no-face"
  | "multiple-faces"
  | "low-quality"
  | "rate-limited"
  | "model-unreadable"
  | "model-invalid"
  | "analysis-failed";

export interface AnalyzeErrorBody {
  /** Human-readable, display-ready message. */
  error: string;
  /** Stable machine code the client switches on. */
  code: AnalyzeErrorCode;
  /** Present on rate-limit responses: seconds to wait before retrying. */
  retryAfter?: number;
}

/**
 * Codes that describe a problem with the uploaded photo itself. For these,
 * retrying the same image won't help — the user needs to choose another,
 * so the UI routes them back to the upload step.
 */
export const PHOTO_ERROR_CODES: readonly AnalyzeErrorCode[] = [
  "no-image",
  "invalid-type",
  "too-large",
  "empty-file",
  "no-face",
  "multiple-faces",
  "low-quality",
];

export function isPhotoErrorCode(code: AnalyzeErrorCode): boolean {
  return PHOTO_ERROR_CODES.includes(code);
}
