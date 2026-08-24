"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { EMPTY_ONBOARDING } from "@/constants/onboarding";
import {
  clearOnboarding,
  loadOnboarding,
  saveOnboarding,
} from "@/lib/onboarding/store";
import type {
  DobValue,
  OnboardingData,
  OnboardingProfile,
} from "@/types/onboarding";

/**
 * Client-side onboarding state.
 *
 * Like the auth/image/result contexts, this is anonymous-first and
 * dependency-free: it persists a small record to localStorage so a
 * returning visitor is never sent through onboarding twice, and so the
 * chosen display name can greet the user on the profile page.
 *
 * `hydrated` is false during SSR and the first client render, then flips
 * true once the persisted record has been read on mount. Consumers gate on
 * it to avoid a hydration mismatch (and to avoid flashing gated pages before
 * the first-run redirect decision is made).
 */
export interface OnboardingContextValue {
  data: OnboardingData;
  /** True once localStorage has been read on the client. */
  hydrated: boolean;
  /** Convenience mirror of `data.completed`. */
  hasCompleted: boolean;
  setDob: (dob: DobValue | null) => void;
  setProfile: (profile: OnboardingProfile | null) => void;
  /** Mark onboarding finished, optionally committing final dob/profile. */
  complete: (patch?: {
    dob?: DobValue | null;
    profile?: OnboardingProfile | null;
  }) => void;
  /** Clear everything (returns the user to first-run state). */
  reset: () => void;
}

export interface OnboardingProviderProps {
  children: React.ReactNode;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const [data, setData] = useState<OnboardingData>(EMPTY_ONBOARDING);
  const [hydrated, setHydrated] = useState(false);

  // Read any persisted record once, on the client, after mount.
  useEffect(() => {
    setData(loadOnboarding());
    setHydrated(true);
  }, []);

  /** Apply a partial update, persisting the result. */
  const patchData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      saveOnboarding(next);
      return next;
    });
  }, []);

  const setDob = useCallback(
    (dob: DobValue | null) => patchData({ dob }),
    [patchData]
  );

  const setProfile = useCallback(
    (profile: OnboardingProfile | null) => patchData({ profile }),
    [patchData]
  );

  const complete = useCallback(
    (patch?: {
      dob?: DobValue | null;
      profile?: OnboardingProfile | null;
    }) => {
      setData((prev) => {
        const next: OnboardingData = {
          ...prev,
          ...(patch?.dob !== undefined ? { dob: patch.dob } : {}),
          ...(patch?.profile !== undefined ? { profile: patch.profile } : {}),
          completed: true,
          completedAt: new Date().toISOString(),
        };
        saveOnboarding(next);
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    clearOnboarding();
    setData({ ...EMPTY_ONBOARDING });
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      data,
      hydrated,
      hasCompleted: data.completed,
      setDob,
      setProfile,
      complete,
      reset,
    }),
    [data, hydrated, setDob, setProfile, complete, reset]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

/**
 * Hook for accessing onboarding state and actions.
 * Must be used within an OnboardingProvider.
 */
export const useOnboarding = (): OnboardingContextValue => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

export default OnboardingContext;
