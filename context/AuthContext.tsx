"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  loadSession,
  saveSession,
  clearSession,
  isExpired,
  parseImplicitHash,
} from "@/lib/supabase/session";
import {
  signInWithPassword,
  signUpWithPassword,
  refreshSession,
  signOut as revokeSession,
  sessionFromOAuthTokens,
  oauthAuthorizeUrl,
} from "@/lib/supabase/auth";
import {
  saveAnalysis,
  listAnalyses,
  deleteAnalysis,
} from "@/lib/supabase/db";
import type { AnalysisResult } from "@/context/AnalysisResultContext";
import type {
  AuthSession,
  AuthUser,
  SavedAnalysis,
  SignInResult,
  SignUpResult,
} from "@/types/account";

/**
 * Client-side authentication + persistence provider.
 *
 * The app is anonymous-first: scanning is never gated. This context only
 * powers the optional "save & revisit your history" feature. When Supabase
 * isn't configured (env vars absent), every action degrades to a safe no-op
 * and `configured` is false, so the UI can hide account entry points without
 * any of the core flow breaking.
 *
 * Session lifecycle mirrors what the Supabase SDK would manage for us:
 *  - restore from localStorage on mount (refreshing if the token has expired),
 *  - silently refresh shortly before expiry via a scheduled timer,
 *  - persist every session change back to localStorage.
 */

/** `initializing` only appears during the first client tick while we restore. */
export type AuthStatus = "initializing" | "signed-in" | "signed-out";

export interface AuthContextValue {
  /** The signed-in user, or null when anonymous. */
  user: AuthUser | null;
  status: AuthStatus;
  /** Whether the accounts feature is available at all (Supabase configured). */
  configured: boolean;

  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  /** Full-page redirect into Google OAuth. No-op if not configured. */
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  /** Finish an OAuth redirect by parsing the URL hash and storing the session. */
  completeOAuth: (hash: string) => Promise<{ ok: boolean; message?: string }>;

  /**
   * Persist a completed analysis. Returns null if not signed in / on failure.
   * Pass `opts.imageBlob` to also store the scan photo (opt-in) — the user id
   * is supplied internally from the active session.
   */
  saveCurrentAnalysis: (
    result: AnalysisResult,
    opts?: { imageBlob?: Blob | null }
  ) => Promise<SavedAnalysis | null>;
  /** List the signed-in user's saved analyses, newest first. */
  listHistory: () => Promise<SavedAnalysis[]>;
  /** Delete one saved analysis. Returns false if not signed in / on failure. */
  removeHistory: (id: string) => Promise<boolean>;

  /**
   * Return a currently-valid access token (refreshing first if needed), or
   * null when signed out. Lets other providers (profile, portfolio) make their
   * own authenticated Supabase calls without duplicating session management.
   */
  getToken: () => Promise<string | null>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

const UNAVAILABLE_MESSAGE = "Accounts aren't available right now.";
/** Refresh a bit before expiry; never schedule sooner than this floor. */
const MIN_REFRESH_DELAY_MS = 5_000;
const REFRESH_LEAD_MS = 60_000;
/** After a transient refresh failure, wait this long before trying again. */
const RETRY_REFRESH_DELAY_MS = 15_000;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("initializing");

  // Async callbacks and the refresh timer read the live session through refs,
  // so they never operate on a stale closure of React state.
  const sessionRef = useRef<AuthSession | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applySessionRef = useRef<(session: AuthSession) => void>(() => {});
  const refreshNowRef = useRef<() => void>(() => {});

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearLocal = useCallback(() => {
    clearTimer();
    sessionRef.current = null;
    setUser(null);
    setStatus("signed-out");
    clearSession();
  }, [clearTimer]);

  const refreshNow = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    const outcome = await refreshSession(current.refreshToken);
    if (outcome.ok) {
      applySessionRef.current(outcome.session);
    } else if (outcome.reason === "invalid") {
      // The refresh token is genuinely dead — sign out.
      clearLocal();
    } else {
      // Transient network/server issue — keep the session and retry shortly
      // instead of signing a still-valid user out on a momentary blip.
      clearTimer();
      timerRef.current = setTimeout(() => {
        void refreshNowRef.current();
      }, RETRY_REFRESH_DELAY_MS);
    }
  }, [clearLocal, clearTimer]);

  // Keep the ref pointing at the latest refreshNow for the retry timer's use.
  useEffect(() => {
    refreshNowRef.current = refreshNow;
  }, [refreshNow]);

  const scheduleRefresh = useCallback(() => {
    clearTimer();
    const current = sessionRef.current;
    if (!current) return;
    const delay = Math.max(
      current.expiresAt - Date.now() - REFRESH_LEAD_MS,
      MIN_REFRESH_DELAY_MS
    );
    timerRef.current = setTimeout(() => {
      void refreshNow();
    }, delay);
  }, [clearTimer, refreshNow]);

  const applySession = useCallback(
    (session: AuthSession) => {
      sessionRef.current = session;
      setUser(session.user);
      setStatus("signed-in");
      saveSession(session);
      scheduleRefresh();
    },
    [scheduleRefresh]
  );

  // Keep the ref pointing at the latest applySession for refreshNow's use.
  useEffect(() => {
    applySessionRef.current = applySession;
  }, [applySession]);

  // Restore any persisted session on mount (client only).
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus("signed-out");
      return;
    }
    const stored = loadSession();
    if (!stored) {
      setStatus("signed-out");
      return;
    }
    if (isExpired(stored)) {
      // Keep the refresh token available, then swap for a fresh session.
      sessionRef.current = stored;
      void refreshSession(stored.refreshToken).then((outcome) => {
        if (outcome.ok) applySession(outcome.session);
        else if (outcome.reason === "invalid") clearLocal();
        // Transient failure on restore: optimistically keep the stored session
        // so the user stays signed in; applySession schedules a near-term
        // refresh retry that will recover once connectivity returns.
        else applySession(stored);
      });
    } else {
      applySession(stored);
    }
    return () => clearTimer();
  }, [applySession, clearLocal, clearTimer]);

  /** Return a valid access token, refreshing first if the current one expired. */
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;
    if (!current) return null;
    if (!isExpired(current)) return current.accessToken;
    const outcome = await refreshSession(current.refreshToken);
    if (outcome.ok) {
      applySession(outcome.session);
      return outcome.session.accessToken;
    }
    // Only sign out on a definitively invalid token; a transient failure keeps
    // the session so a later request (or the scheduled retry) can recover it.
    if (outcome.reason === "invalid") clearLocal();
    return null;
  }, [applySession, clearLocal]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      if (!isSupabaseConfigured()) {
        return { ok: false, message: UNAVAILABLE_MESSAGE };
      }
      const res = await signInWithPassword(email, password);
      if (res.ok) applySession(res.session);
      return res;
    },
    [applySession]
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<SignUpResult> => {
      if (!isSupabaseConfigured()) {
        return { ok: false, message: UNAVAILABLE_MESSAGE };
      }
      const res = await signUpWithPassword(email, password);
      // If confirmation is disabled, a session is returned immediately.
      if (res.ok && res.session) applySession(res.session);
      return res;
    },
    [applySession]
  );

  const signInWithGoogle = useCallback(() => {
  if (!isSupabaseConfigured() || typeof window === "undefined") return;

  const redirectTo =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${window.location.origin}/auth/callback`;

  window.location.assign(oauthAuthorizeUrl("google", redirectTo));
}, []);

  const signOut = useCallback(async () => {
    const current = sessionRef.current;
    // Clear locally first so the UI updates instantly; revoke is best-effort.
    clearLocal();
    if (current) await revokeSession(current.accessToken);
  }, [clearLocal]);

  const completeOAuth = useCallback(
    async (hash: string): Promise<{ ok: boolean; message?: string }> => {
      if (!isSupabaseConfigured()) {
        return { ok: false, message: UNAVAILABLE_MESSAGE };
      }
      const parsed = parseImplicitHash(hash);
      if (!parsed.ok) return { ok: false, message: parsed.error };
      const session = await sessionFromOAuthTokens(
        parsed.accessToken,
        parsed.refreshToken,
        parsed.expiresIn
      );
      if (!session) {
        return {
          ok: false,
          message: "Couldn't complete sign-in. Please try again.",
        };
      }
      applySession(session);
      return { ok: true };
    },
    [applySession]
  );

  const saveCurrentAnalysis = useCallback(
    async (
      result: AnalysisResult,
      opts?: { imageBlob?: Blob | null }
    ): Promise<SavedAnalysis | null> => {
      const token = await getValidToken();
      if (!token) return null;
      return saveAnalysis(token, result, {
        imageBlob: opts?.imageBlob ?? null,
        userId: sessionRef.current?.user.id ?? null,
      });
    },
    [getValidToken]
  );

  const listHistory = useCallback(async (): Promise<SavedAnalysis[]> => {
    const token = await getValidToken();
    if (!token) return [];
    return listAnalyses(token);
  }, [getValidToken]);

  const removeHistory = useCallback(
    async (id: string): Promise<boolean> => {
      const token = await getValidToken();
      if (!token) return false;
      return deleteAnalysis(token, id);
    },
    [getValidToken]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      configured: isSupabaseConfigured(),
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      completeOAuth,
      saveCurrentAnalysis,
      listHistory,
      removeHistory,
      getToken: getValidToken,
    }),
    [
      user,
      status,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      completeOAuth,
      saveCurrentAnalysis,
      listHistory,
      removeHistory,
      getValidToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook for accessing auth state and actions.
 * Must be used within an AuthProvider.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
