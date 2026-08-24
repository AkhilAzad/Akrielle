"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { EMPTY_PROFILE } from "@/constants/profile";
import { clearProfile, loadProfile, saveProfile } from "@/lib/profile/store";
import type {
  AppPreferences,
  BeautyPreferences,
  ProfileAppearance,
  ProfileData,
  ProfilePersonal,
} from "@/types/profile";

/**
 * Client-side profile-dashboard state.
 *
 * Like the onboarding/auth/image/result contexts, this is anonymous-first and
 * dependency-free: it persists the richer profile record (personal details,
 * appearance, beauty & app preferences) to localStorage. Display name and date
 * of birth are deliberately NOT held here — they stay in the onboarding record
 * so each field has a single source of truth.
 *
 * `hydrated` is false during SSR and the first client render, then flips true
 * once the persisted record has been read on mount. Consumers gate on it to
 * avoid a hydration mismatch.
 */
export interface ProfileContextValue {
  data: ProfileData;
  /** True once localStorage has been read on the client. */
  hydrated: boolean;
  updatePersonal: (patch: Partial<ProfilePersonal>) => void;
  updateAppearance: (patch: Partial<ProfileAppearance>) => void;
  updateBeauty: (patch: Partial<BeautyPreferences>) => void;
  updateApp: (patch: Partial<AppPreferences>) => void;
  /** Reset the profile record back to empty. */
  clearAll: () => void;
}

export interface ProfileProviderProps {
  children: React.ReactNode;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined
);

export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  children,
}) => {
  const [data, setData] = useState<ProfileData>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  // Read any persisted record once, on the client, after mount.
  useEffect(() => {
    setData(loadProfile());
    setHydrated(true);
  }, []);

  const updatePersonal = useCallback(
    (patch: Partial<ProfilePersonal>) =>
      setData((prev) => {
        const next: ProfileData = {
          ...prev,
          personal: { ...prev.personal, ...patch },
          updatedAt: new Date().toISOString(),
        };
        saveProfile(next);
        return next;
      }),
    []
  );

  const updateAppearance = useCallback(
    (patch: Partial<ProfileAppearance>) =>
      setData((prev) => {
        const next: ProfileData = {
          ...prev,
          appearance: { ...prev.appearance, ...patch },
          updatedAt: new Date().toISOString(),
        };
        saveProfile(next);
        return next;
      }),
    []
  );

  const updateBeauty = useCallback(
    (patch: Partial<BeautyPreferences>) =>
      setData((prev) => {
        const next: ProfileData = {
          ...prev,
          beauty: { ...prev.beauty, ...patch },
          updatedAt: new Date().toISOString(),
        };
        saveProfile(next);
        return next;
      }),
    []
  );

  const updateApp = useCallback(
    (patch: Partial<AppPreferences>) =>
      setData((prev) => {
        const next: ProfileData = {
          ...prev,
          app: { ...prev.app, ...patch },
          updatedAt: new Date().toISOString(),
        };
        saveProfile(next);
        return next;
      }),
    []
  );

  const clearAll = useCallback(() => {
    clearProfile();
    setData({ ...EMPTY_PROFILE });
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      data,
      hydrated,
      updatePersonal,
      updateAppearance,
      updateBeauty,
      updateApp,
      clearAll,
    }),
    [
      data,
      hydrated,
      updatePersonal,
      updateAppearance,
      updateBeauty,
      updateApp,
      clearAll,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

/**
 * Hook for accessing profile state and actions.
 * Must be used within a ProfileProvider.
 */
export const useProfile = (): ProfileContextValue => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export default ProfileContext;
