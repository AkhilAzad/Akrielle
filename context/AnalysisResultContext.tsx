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

import { coerceAnalysisResult } from "@/lib/analysis/schema";
import { useAuth } from "@/context/AuthContext";

/**
 * Shape of the recommendations block returned by /api/analyze.
 */
export interface AnalysisRecommendations {
  foundation: string;
  lipstick: string;
  blush: string;
  eyeshadow: string;
  highlighter: string;
  hairstyle: string;
  accessories: string;
  skincare: string;
}

/**
 * Priority level for a ranked improvement.
 */
export type ImprovementPriority = "High" | "Medium" | "Low";

/**
 * Current vs. potential appearance.
 */
export interface GlowUpPotential {
  currentAppearanceScore: number;
  potentialScore: number;
  reason: string;
}

/**
 * A single ranked, high-impact improvement area.
 */
export interface ImpactImprovement {
  area: string;
  priority: ImprovementPriority;
  explanation: string;
  expectedImprovement: string;
}

/**
 * A single feature reading from the expanded facial analysis.
 */
export interface FacialAnalysisFeature {
  feature: string;

  /** 0–100 */
  confidence: number;

  status: string;
  explanation: string;
}

/**
 * Shape of the full analysis result returned by /api/analyze.
 */
export interface AnalysisResult {
  beautyScore: number;
  faceShape: string;
  skinTone: string;
  undertone: string;
  eyeShape: string;
  lipShape: string;
  facialHarmony: string;
  confidence: number;
  recommendations: AnalysisRecommendations;
  glowUp: GlowUpPotential;
  impactImprovements: ImpactImprovement[];
  facialAnalysis: FacialAnalysisFeature[];
}

export interface SetResultOptions {
  /**
   * Mark this result as already saved to the signed-in user's history.
   */
  persisted?: boolean;
}

export interface AnalysisResultContextValue {
  /** The most recent analysis result, or null if none is available. */
  result: AnalysisResult | null;

  /**
   * True while the provider is restoring the result — from sessionStorage and,
   * for a signed-in user, from Supabase.
   *
   * Consumers must wait for this to become false before treating
   * result === null as "no analysis exists".
   */
  restoring: boolean;

  /**
   * Whether the current result has already been persisted.
   */
  persisted: boolean;

  /**
   * Store a new analysis result.
   */
  setResult: (
    result: AnalysisResult | null,
    options?: SetResultOptions
  ) => void;

  /**
   * Mark the current result as persisted.
   */
  markPersisted: () => void;

  /**
   * Clear the stored analysis result.
   */
  clearResult: () => void;
}

export interface AnalysisResultProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = "alkline-analysis-result";
const PERSISTED_KEY = "alkline-analysis-persisted";

const AnalysisResultContext = createContext<
  AnalysisResultContextValue | undefined
>(undefined);

/**
 * Provides application-wide state for the most recent /api/analyze result.
 *
 * Source of truth by audience:
 *  - within a browser session (normal navigation + refresh) the result is kept
 *    in React state and mirrored into sessionStorage, so an in-tab refresh is
 *    instant and works offline;
 *  - for a signed-in user the durable record lives in the Supabase `analyses`
 *    table (written by the results-page save banner). When the in-tab cache is
 *    empty — a new tab, or after the browser was closed and reopened — the most
 *    recent saved analysis is restored from Supabase so results are never lost
 *    by "leaving the website". It is restored already-persisted, so the banner
 *    never re-saves it (no duplicate rows).
 *
 * Anonymous visitors keep the sessionStorage-only behavior exactly as before.
 */
export const AnalysisResultProvider: React.FC<
  AnalysisResultProviderProps
> = ({ children }) => {
  const [result, setResultState] =
    useState<AnalysisResult | null>(null);

  const [persisted, setPersisted] = useState(false);

  /**
   * IMPORTANT:
   *
   * Start in "restoring" state.
   *
   * On a fresh document load, sessionStorage can only be read after the
   * browser has mounted the provider. Without this flag, /results can render
   * "No analysis available" before the stored result has been restored.
   */
  const [restoring, setRestoring] = useState(true);

  // Accounts feature — lets us restore a signed-in user's latest saved
  // analysis from Supabase when the in-tab cache is empty.
  const { configured, status, listHistory } = useAuth();

  // The initial restore runs exactly once; this guards the async cloud path
  // from re-running when auth state settles.
  const initializedRef = useRef(false);
  // Flipped true once a result has been set explicitly in this tab (a fresh
  // analysis, or a re-open from history), so an in-flight cloud restore can't
  // clobber a newer result the user just produced.
  const resultSetLocallyRef = useRef(false);

  /**
   * Restore the most recent analysis when the provider mounts.
   *
   * Order of preference:
   *  1. the in-tab sessionStorage cache (freshest — survives a refresh, and the
   *     only source for anonymous visitors),
   *  2. for a signed-in user with an empty cache, the latest row in the Supabase
   *     `analyses` table (survives browser close/reopen and new tabs),
   *  3. otherwise nothing (anonymous, or no saved analyses yet).
   */
  useEffect(() => {
    // Wait for the session to finish restoring before choosing a source.
    if (configured && status === "initializing") return;
    if (initializedRef.current) return;

    let cancelled = false;

    // 1) In-tab cache.
    let cachedResult: AnalysisResult | null = null;
    let cachedPersisted = false;
    try {
      const storedResult = sessionStorage.getItem(STORAGE_KEY);
      if (storedResult) {
        const restored = coerceAnalysisResult(JSON.parse(storedResult));
        if (restored.ok) {
          cachedResult = restored.data;
          cachedPersisted = sessionStorage.getItem(PERSISTED_KEY) === "true";
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(PERSISTED_KEY);
        }
      }
    } catch (error) {
      console.error(
        "Failed to restore analysis result from sessionStorage:",
        error
      );
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(PERSISTED_KEY);
      } catch {
        // Ignore storage cleanup errors.
      }
    }

    if (cachedResult) {
      setResultState(cachedResult);
      setPersisted(cachedPersisted);
      initializedRef.current = true;
      setRestoring(false);
      return () => {
        cancelled = true;
      };
    }

    // 2) Signed-in with an empty cache → restore the latest saved analysis from
    //    Supabase so results survive a browser close/reopen or a new tab.
    if (configured && status === "signed-in") {
      initializedRef.current = true;
      void (async () => {
        const history = await listHistory();
        if (cancelled) return;
        const latest = history[0];
        // Don't overwrite a result the user produced while this was in flight.
        if (latest && !resultSetLocallyRef.current) {
          setResultState(latest.result);
          setPersisted(true); // already in the DB — the banner won't re-save it.
          // Repopulate the in-tab cache so a subsequent refresh is instant.
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(latest.result));
            sessionStorage.setItem(PERSISTED_KEY, "true");
          } catch {
            // A cache write failure is non-fatal; Supabase stays the source.
          }
        }
        setRestoring(false);
      })();
      return () => {
        cancelled = true;
      };
    }

    // 3) Anonymous / not configured / nothing to restore.
    initializedRef.current = true;
    setRestoring(false);
    return () => {
      cancelled = true;
    };
  }, [configured, status, listHistory]);

  /**
   * Store a new analysis result.
   */
  const setResult = useCallback(
    (
      next: AnalysisResult | null,
      options?: SetResultOptions
    ) => {
      // A result set explicitly in this tab takes precedence over any pending
      // cloud restore (see the mount effect's in-flight guard).
      resultSetLocallyRef.current = next !== null;

      setResultState(next);

      const nextPersisted = next
        ? options?.persisted ?? false
        : false;

      setPersisted(nextPersisted);

      try {
        if (next) {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(next)
          );

          sessionStorage.setItem(
            PERSISTED_KEY,
            String(nextPersisted)
          );
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(PERSISTED_KEY);
        }
      } catch (error) {
        console.error(
          "Failed to save analysis result to sessionStorage:",
          error
        );
      }
    },
    []
  );

  /**
   * Mark the current result as persisted.
   */
  const markPersisted = useCallback(() => {
    setPersisted(true);

    try {
      sessionStorage.setItem(
        PERSISTED_KEY,
        "true"
      );
    } catch (error) {
      console.error(
        "Failed to save persisted state:",
        error
      );
    }
  }, []);

  /**
   * Clear the current analysis result.
   */
  const clearResult = useCallback(() => {
    setResultState(null);
    setPersisted(false);

    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(PERSISTED_KEY);
    } catch (error) {
      console.error(
        "Failed to clear analysis result:",
        error
      );
    }
  }, []);

  const value = useMemo<AnalysisResultContextValue>(
    () => ({
      result,
      restoring,
      persisted,
      setResult,
      markPersisted,
      clearResult,
    }),
    [
      result,
      restoring,
      persisted,
      setResult,
      markPersisted,
      clearResult,
    ]
  );

  return (
    <AnalysisResultContext.Provider value={value}>
      {children}
    </AnalysisResultContext.Provider>
  );
};

/**
 * Hook for accessing the analysis result state and actions.
 */
export const useAnalysisResult =
  (): AnalysisResultContextValue => {
    const context = useContext(
      AnalysisResultContext
    );

    if (context === undefined) {
      throw new Error(
        "useAnalysisResult must be used within an AnalysisResultProvider"
      );
    }

    return context;
  };

export default AnalysisResultContext;