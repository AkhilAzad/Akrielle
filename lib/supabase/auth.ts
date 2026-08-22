import { authBase, baseHeaders, authedHeaders } from "@/lib/supabase/config";
import {
  makeSession,
  makeSessionFromParts,
  type TokenResponse,
} from "@/lib/supabase/session";
import type {
  AuthSession,
  AuthUser,
  OAuthProvider,
  SignInResult,
  SignUpResult,
} from "@/types/account";

/**
 * Thin, dependency-free wrapper over Supabase's GoTrue auth REST API. Each
 * function performs a single fetch and returns typed results — no SDK, no
 * global client. Session storage and refresh scheduling live in the
 * AuthContext; these functions are stateless.
 */

interface GoTrueErrorBody {
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as GoTrueErrorBody;
    return (
      body.error_description ||
      body.msg ||
      body.message ||
      body.error ||
      fallback
    );
  } catch {
    return fallback;
  }
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    const res = await fetch(`${authBase()}/token?grant_type=password`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      return {
        ok: false,
        message: await errorMessage(res, "Incorrect email or password."),
      };
    }

    const session = makeSession((await res.json()) as TokenResponse);
    if (!session) {
      return { ok: false, message: "Sign-in failed. Please try again." };
    }
    return { ok: true, session };
  } catch {
    return {
      ok: false,
      message: "Couldn't reach the sign-in service. Check your connection.",
    };
  }
}

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<SignUpResult> {
  try {
    const res = await fetch(`${authBase()}/signup`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      return {
        ok: false,
        message: await errorMessage(res, "Couldn't create your account."),
      };
    }

    // If email confirmation is disabled, signup returns tokens right away.
    // If it's enabled, it returns just the user and no access token.
    const body = (await res.json()) as TokenResponse;
    const session = makeSession(body);
    if (session) {
      return { ok: true, session, needsConfirmation: false };
    }
    return { ok: true, session: null, needsConfirmation: true };
  } catch {
    return {
      ok: false,
      message: "Couldn't reach the sign-up service. Check your connection.",
    };
  }
}

/**
 * Outcome of a refresh attempt. We distinguish a genuinely dead refresh token
 * (`invalid` → the user must sign in again) from a transient failure
 * (`network` → the token may still be good; keep the session and retry later).
 */
export type RefreshOutcome =
  | { ok: true; session: AuthSession }
  | { ok: false; reason: "invalid" | "network" };

/** Exchange a refresh token for a fresh session. */
export async function refreshSession(
  refreshToken: string
): Promise<RefreshOutcome> {
  let res: Response;
  try {
    res = await fetch(`${authBase()}/token?grant_type=refresh_token`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Couldn't reach the server at all — transient, don't discard the token.
    return { ok: false, reason: "network" };
  }
  if (!res.ok) {
    // 4xx means the refresh token itself is invalid/expired → sign out.
    // 5xx (or anything else) is a transient server issue → keep + retry later.
    const invalid = res.status >= 400 && res.status < 500;
    return { ok: false, reason: invalid ? "invalid" : "network" };
  }
  const session = makeSession((await res.json()) as TokenResponse);
  if (!session) return { ok: false, reason: "invalid" };
  return { ok: true, session };
}

export async function getUser(accessToken: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${authBase()}/user`, {
      method: "GET",
      headers: authedHeaders(accessToken),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { id?: string; email?: string | null };
    if (!body.id) return null;
    return { id: body.id, email: body.email ?? null };
  } catch {
    return null;
  }
}

/** Best-effort revoke of the current session server-side. */
export async function signOut(accessToken: string): Promise<void> {
  try {
    await fetch(`${authBase()}/logout`, {
      method: "POST",
      headers: authedHeaders(accessToken),
    });
  } catch {
    // Ignore — the client clears its local session regardless.
  }
}

/**
 * Build a full session after an OAuth redirect: the hash only carries tokens,
 * so we fetch the user profile to complete it.
 */
export async function sessionFromOAuthTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<AuthSession | null> {
  const user = await getUser(accessToken);
  if (!user) return null;
  return makeSessionFromParts(accessToken, refreshToken, expiresIn, user);
}

/**
 * Full-page URL that kicks off an OAuth sign-in. The browser navigates here;
 * Supabase redirects to the provider and back to `redirectTo` with tokens in
 * the URL fragment.
 */
export function oauthAuthorizeUrl(
  provider: OAuthProvider,
  redirectTo: string
): string {
  const params = new URLSearchParams({
    provider,
    redirect_to: redirectTo,
  });
  return `${authBase()}/authorize?${params.toString()}`;
}
