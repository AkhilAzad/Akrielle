import type { AnalysisResult } from "@/types/analysis";

/**
 * Account + persistence types shared across the Supabase REST layer, the
 * AuthContext, and the account/history UI. Kept framework-agnostic so the
 * pure lib functions in lib/supabase/* stay easy to test.
 */

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  /** Epoch milliseconds at which the access token expires. */
  expiresAt: number;
  user: AuthUser;
}

/** A persisted analysis row, as surfaced to the history UI. */
export interface SavedAnalysis {
  id: string;
  /** ISO timestamp. */
  createdAt: string;
  beautyScore: number;
  result: AnalysisResult;
}

export type SignInResult =
  | { ok: true; session: AuthSession }
  | { ok: false; message: string };

export type SignUpResult =
  | { ok: true; session: AuthSession | null; needsConfirmation: boolean }
  | { ok: false; message: string };

export type OAuthProvider = "google";
