/**
 * Supabase connection config, read from public env vars.
 *
 * Both values are safe to expose to the browser: the anon key is designed
 * for client use and is protected by row-level security (RLS) policies on
 * the database. No service-role key is used anywhere in the app — every
 * read/write is scoped to the signed-in user via their access token + RLS.
 *
 * The app is anonymous-first: when these env vars are absent, the whole
 * accounts/history feature quietly disables itself (see isSupabaseConfigured)
 * and the core scan flow is completely unaffected.
 */

export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/+$/,
  ""
);

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True only when both env vars are present and the URL looks like a URL. */
export function isSupabaseConfigured(): boolean {
  return /^https?:\/\//.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 0;
}

export function authBase(): string {
  return `${SUPABASE_URL}/auth/v1`;
}

export function restBase(): string {
  return `${SUPABASE_URL}/rest/v1`;
}

/** Base headers every Supabase REST call needs (anon apikey + JSON). */
export function baseHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** Base headers plus a user's bearer token, for authenticated calls. */
export function authedHeaders(
  accessToken: string,
  extra?: Record<string, string>
): Record<string, string> {
  return baseHeaders({ Authorization: `Bearer ${accessToken}`, ...extra });
}
