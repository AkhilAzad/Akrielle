/**
 * Small shared constants for the post-authentication redirect flow.
 *
 * When a user signs in to save a result, we want to return them to where
 * they were (e.g. /results). For password sign-in that target rides along as
 * a `?next=` query param; for the full-page OAuth round trip it's stashed in
 * sessionStorage under POST_AUTH_NEXT_KEY (survives the redirect in the same
 * tab) and read back by the callback page.
 */

export const POST_AUTH_NEXT_KEY = "alkline.postauth.next";
export const DEFAULT_POST_AUTH_PATH = "/account";

/**
 * Only ever redirect to an internal, absolute path. Rejects external URLs
 * and protocol-relative (`//host`) values to avoid open-redirect issues.
 */
export function sanitizeNext(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_POST_AUTH_PATH;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return DEFAULT_POST_AUTH_PATH;
}
