import type { AuthSession, AuthUser } from "@/types/account";

/**
 * Client-side session storage + helpers. The session (access token, refresh
 * token, expiry, user) is persisted to localStorage so it survives reloads,
 * mirroring what the Supabase SDK would normally manage for us. All storage
 * access is guarded for SSR (no window on the server).
 */

const STORAGE_KEY = "alkline.session";
/** Refresh a little before the token actually expires, to avoid races. */
const EXPIRY_SKEW_MS = 60_000;

export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user?.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore quota / privacy-mode errors — the user simply stays logged out.
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

export function isExpired(session: AuthSession): boolean {
  return Date.now() >= session.expiresAt - EXPIRY_SKEW_MS;
}

/** Shape of a GoTrue token response (password / refresh grants, signup). */
export interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  /** Epoch seconds; present on some responses. */
  expires_at?: number;
  user?: { id?: string; email?: string | null } | null;
}

function toExpiresAt(res: {
  expires_at?: number;
  expires_in?: number;
}): number {
  if (res.expires_at) return res.expires_at * 1000;
  return Date.now() + (res.expires_in ?? 3600) * 1000;
}

/** Build a session from a full GoTrue token response, or null if incomplete. */
export function makeSession(res: TokenResponse): AuthSession | null {
  if (!res.access_token || !res.refresh_token || !res.user?.id) return null;
  return {
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    expiresAt: toExpiresAt(res),
    user: { id: res.user.id, email: res.user.email ?? null },
  };
}

/** Build a session from explicit parts (used by the OAuth callback flow). */
export function makeSessionFromParts(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  user: AuthUser
): AuthSession {
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + (expiresIn || 3600) * 1000,
    user,
  };
}

export type ImplicitHashResult =
  | { ok: true; accessToken: string; refreshToken: string; expiresIn: number }
  | { ok: false; error: string };

/**
 * Parse the fragment Supabase appends after an OAuth redirect
 * (e.g. `#access_token=...&refresh_token=...&expires_in=3600`). The user
 * object isn't in the hash, so callers fetch it separately with getUser.
 */
export function parseImplicitHash(hash: string): ImplicitHashResult {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return { ok: false, error: "No authentication data was returned." };

  const params = new URLSearchParams(raw);

  const errorDescription =
    params.get("error_description") || params.get("error");
  if (errorDescription) {
    return { ok: false, error: errorDescription.replace(/\+/g, " ") };
  }

  const accessToken = params.get("access_token") ?? "";
  const refreshToken = params.get("refresh_token") ?? "";
  const expiresIn = Number(params.get("expires_in") ?? "3600");

  if (!accessToken || !refreshToken) {
    return { ok: false, error: "Sign-in didn't complete. Please try again." };
  }

  return { ok: true, accessToken, refreshToken, expiresIn };
}
