"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { coerceAnalysisResult } from "@/lib/analysis/schema";

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
   * True while the provider is restoring the result from sessionStorage.
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
 * The result is kept in React state for normal navigation and mirrored into
 * sessionStorage so it survives provider remounts and page refreshes within
 * the same browser session.
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

  /**
   * Restore the most recent analysis when the provider mounts.
   */
  useEffect(() => {
    try {
      const storedResult =
        sessionStorage.getItem(STORAGE_KEY);

      if (storedResult) {
        const parsed = JSON.parse(storedResult);

        const restoredResult =
          coerceAnalysisResult(parsed);

        /*
         * coerceAnalysisResult returns:
         *
         * {
         *   ok: true,
         *   data: AnalysisResult
         * }
         *
         * or:
         *
         * {
         *   ok: false
         * }
         *
         * We must check `ok` before accessing `data`.
         */
        if (restoredResult.ok) {
          setResultState(restoredResult.data);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }

      const storedPersisted =
        sessionStorage.getItem(PERSISTED_KEY);

      if (storedPersisted === "true") {
        setPersisted(true);
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
    } finally {
      setRestoring(false);
    }
  }, []);

  /**
   * Store a new analysis result.
   */
  const setResult = useCallback(
    (
      next: AnalysisResult | null,
      options?: SetResultOptions
    ) => {
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