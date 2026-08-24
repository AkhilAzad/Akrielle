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

import { EMPTY_PROFILE } from "@/constants/profile";
import { clearProfile, loadProfile, saveProfile } from "@/lib/profile/store";
import { loadOnboarding } from "@/lib/onboarding/store";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchProfileRow,
  profileDataToWritable,
  rowToProfileData,
  upsertProfileRow,
} from "@/database/supabase/profileDb";
import { createSignedUrl } from "@/database/supabase/storage";
import type {
  AppPreferences,
  BeautyPreferences,
  ProfileAppearance,
  ProfileData,
  ProfilePersonal,
} from "@/types/profile";
import type { DobValue } from "@/types/onboarding";

/**
 * Client-side profile-dashboard state — the single source of truth for the
 * user's PERMANENT profile (display name, date of birth, personal + appearance
 * details, and beauty / app preferences).
 *
 * It is backend-aware but keeps one stable API:
 *  - signed in  → the Supabase `profiles` row (per-user, RLS-protected). On the
 *    first sign-in with no cloud row, the local record (and any name/DOB from
 *    onboarding) is migrated up; if a cloud row already exists it always wins.
 *  - anonymous  → localStorage, exactly as before (accounts stay optional).
 *
 * `hydrated` is false during SSR / the first client render and while auth is
 * still initializing, then flips true once the active backend has been read.
 * Consumers gate on it to avoid a hydration mismatch.
 */
export interface ProfileContextValue {
  data: ProfileData;
  /** True once the active backend (cloud or local) has been read on the client. */
  hydrated: boolean;
  updatePersonal: (patch: Partial<ProfilePersonal>) => void;
  updateAppearance: (patch: Partial<ProfileAppearance>) => void;
  updateBeauty: (patch: Partial<BeautyPreferences>) => void;
  updateApp: (patch: Partial<AppPreferences>) => void;
  /** Update display name and/or date of birth (owned here, seeded at onboarding). */
  updateIdentity: (patch: { displayName?: string; dob?: DobValue | null }) => void;
  /** Reset the profile record back to empty (clears the cloud row when signed in). */
  clearAll: () => void;
  /** A short-lived signed URL for the user's avatar image, or null. Cloud only. */
  avatarUrl: string | null;
  /**
   * Point the profile avatar at an already-uploaded Storage object (called by
   * the portfolio when a signed-in user saves a photo). No-op when anonymous.
   */
  setAvatarFromPath: (path: string) => void;
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
  const { configured, status, user, getToken } = useAuth();

  const [data, setData] = useState<ProfileData>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Which backend the updaters should write to. A ref so the async updaters
  // always see the current mode without being re-created on every change.
  const modeRef = useRef<"local" | "cloud">("local");

  // Load (and, if needed, migrate) the profile whenever auth state settles.
  useEffect(() => {
    let cancelled = false;
    setHydrated(false);

    const signedIn = configured && status === "signed-in" && Boolean(user);

    async function load() {
      // Wait for the session to finish restoring before deciding on a backend.
      if (configured && status === "initializing") return;

      if (signedIn) {
        modeRef.current = "cloud";
        const token = await getToken();
        if (!token) {
          // Momentarily can't reach the cloud (a transient token-refresh blip).
          // Supabase is the source of truth for a signed-in user, so we do NOT
          // fall back to the localStorage profile blob — we show the empty
          // in-memory record and let a later render reconcile from the cloud.
          if (!cancelled) {
            setData({ ...EMPTY_PROFILE });
            setAvatarUrl(null);
            setHydrated(true);
          }
          return;
        }

        const row = await fetchProfileRow(token);
        if (cancelled) return;

        if (row) {
          // Cloud wins.
          setData(rowToProfileData(row));
          if (row.avatar_path) {
            const url = await createSignedUrl(token, row.avatar_path);
            if (!cancelled) setAvatarUrl(url);
          } else if (!cancelled) {
            setAvatarUrl(null);
          }
        } else {
          // No cloud row yet — initialize an EMPTY profile record for this
          // user id, carrying only the display name / DOB they entered during
          // onboarding (the app's own first-run capture, not localStorage
          // profile storage). The localStorage profile blob is intentionally
          // NOT read for a signed-in user: Supabase is the source of truth.
          const onboarding = loadOnboarding();
          const seeded: ProfileData = {
            ...EMPTY_PROFILE,
            displayName: onboarding.profile?.displayName ?? "",
            dob: onboarding.dob ?? null,
            updatedAt: new Date().toISOString(),
          };
          const savedRow = await upsertProfileRow(
            token,
            profileDataToWritable(seeded)
          );
          if (cancelled) return;
          setData(savedRow ? rowToProfileData(savedRow) : seeded);
          setAvatarUrl(null);
        }
        if (!cancelled) setHydrated(true);
        return;
      }

      // Anonymous (or accounts not configured) — localStorage.
      modeRef.current = "local";
      const local = loadProfile();
      // Bridge: a brand-new profile (never edited) adopts any name/DOB the user
      // gave during onboarding, so the dashboard reflects what they entered.
      const bridged =
        local.updatedAt === null
          ? ((): ProfileData => {
              const onboarding = loadOnboarding();
              return {
                ...local,
                displayName:
                  local.displayName || onboarding.profile?.displayName || "",
                dob: local.dob ?? onboarding.dob ?? null,
              };
            })()
          : local;
      if (!cancelled) {
        setData(bridged);
        setAvatarUrl(null);
        setHydrated(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [configured, status, user, getToken]);

  // Persist a freshly-computed record to whichever backend is active.
  const persist = useCallback(
    (next: ProfileData) => {
      if (modeRef.current === "cloud") {
        void (async () => {
          const token = await getToken();
          if (token) await upsertProfileRow(token, profileDataToWritable(next));
        })();
      } else {
        saveProfile(next);
      }
    },
    [getToken]
  );

  const updatePersonal = useCallback(
    (patch: Partial<ProfilePersonal>) =>
      setData((prev) => {
        const next: ProfileData = {
          ...prev,
          personal: { ...prev.personal, ...patch },
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      }),
    [persist]
  );

  const updateAppearance = useCallback(
    (patch: Partial<ProfileAppearance>) =>
      setData((prev) => {
        const next: ProfileData = {
          ...prev,
          appearance: { ...prev.appearance, ...patch },
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      }),
    [persist]
  );

  const updateBeauty = useCallback(
    (patch: Partial<BeautyPreferences>) =>
      setData((prev) => {
        const next: ProfileData = {
          ...prev,
          beauty: { ...prev.beauty, ...patch },
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      }),
    [persist]
  );

  const updateApp = useCallback(
    (patch: Partial<AppPreferences>) =>
      setData((prev) => {
        const next: ProfileData = {
          ...prev,
          app: { ...prev.app, ...patch },
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      }),
    [persist]
  );

  const updateIdentity = useCallback(
    (patch: { displayName?: string; dob?: DobValue | null }) =>
      setData((prev) => {
        const next: ProfileData = {
          ...prev,
          displayName:
            patch.displayName !== undefined
              ? patch.displayName
              : prev.displayName,
          dob: patch.dob !== undefined ? patch.dob : prev.dob,
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        return next;
      }),
    [persist]
  );

  const setAvatarFromPath = useCallback(
    (path: string) => {
      if (modeRef.current !== "cloud") return;
      void (async () => {
        const token = await getToken();
        if (!token) return;
        await upsertProfileRow(token, {
          avatar_path: path,
          updated_at: new Date().toISOString(),
        });
        const url = await createSignedUrl(token, path);
        setAvatarUrl(url);
      })();
    },
    [getToken]
  );

  const clearAll = useCallback(() => {
    if (modeRef.current === "cloud") {
      void (async () => {
        const token = await getToken();
        if (token) {
          await upsertProfileRow(token, {
            ...profileDataToWritable({
              ...EMPTY_PROFILE,
              updatedAt: new Date().toISOString(),
            }),
            avatar_path: null,
          });
        }
      })();
    } else {
      clearProfile();
    }
    setData({ ...EMPTY_PROFILE });
    setAvatarUrl(null);
  }, [getToken]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      data,
      hydrated,
      updatePersonal,
      updateAppearance,
      updateBeauty,
      updateApp,
      updateIdentity,
      clearAll,
      avatarUrl,
      setAvatarFromPath,
    }),
    [
      data,
      hydrated,
      updatePersonal,
      updateAppearance,
      updateBeauty,
      updateApp,
      updateIdentity,
      clearAll,
      avatarUrl,
      setAvatarFromPath,
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
