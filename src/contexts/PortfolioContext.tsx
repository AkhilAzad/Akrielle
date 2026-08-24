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

import { PORTFOLIO_MAX_ITEMS } from "@/constants/profile";
import {
  clearPortfolio,
  cryptoId,
  downscaleToDataUrl,
  loadPortfolio,
  savePortfolio,
} from "@/lib/portfolio/store";
import { downscaleToBlob, dataUrlToBlob } from "@/lib/media/image";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import {
  deletePortfolioRow,
  insertPortfolioRow,
  listPortfolioRows,
} from "@/database/supabase/portfolioDb";
import {
  createSignedUrl,
  deleteObject,
  uploadImage,
} from "@/database/supabase/storage";
import type { PortfolioItem } from "@/types/profile";

/** Reason an add attempt was rejected, for a friendly caller-side message. */
export type PortfolioAddReason = "full" | "invalid" | "storage" | "error";

export interface PortfolioAddResult {
  ok: boolean;
  reason?: PortfolioAddReason;
}

/**
 * Client-side photo portfolio — a small, capped, private gallery.
 *
 * Backend-aware but with one stable API:
 *  - signed in  → images live in the private `user-media` Storage bucket, with
 *    metadata rows in `portfolio_items` (both per-user, RLS-protected). Items
 *    are shown via short-lived signed URLs. On first sign-in with an empty
 *    cloud gallery, existing local photos are migrated up (cloud otherwise
 *    wins). The most recent photo also becomes the profile avatar.
 *  - anonymous  → downscaled JPEG data URLs in localStorage, exactly as before.
 *
 * The list is capped at PORTFOLIO_MAX_ITEMS (newest first). `hydrated` gates
 * SSR / first render and the initial cloud load.
 */
export interface PortfolioContextValue {
  items: PortfolioItem[];
  /** True once the active backend has been read on the client. */
  hydrated: boolean;
  count: number;
  isFull: boolean;
  /** Downscale + prepend a picked file. Returns ok/reason (never throws). */
  addFromFile: (file: File) => Promise<PortfolioAddResult>;
  remove: (id: string) => void;
  clearAll: () => void;
}

export interface PortfolioProviderProps {
  children: React.ReactNode;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(
  undefined
);

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({
  children,
}) => {
  const { configured, status, user, getToken } = useAuth();
  const { setAvatarFromPath } = useProfile();

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Which backend the mutators write to.
  const modeRef = useRef<"local" | "cloud">("local");
  // rowId → Storage object path, so we can delete the object when a row is
  // removed. Rebuilt on every cloud load; only meaningful in cloud mode.
  const pathsRef = useRef<Map<string, string>>(new Map());

  const userId = user?.id ?? null;

  // Load (and, if needed, migrate) the gallery whenever auth state settles.
  useEffect(() => {
    let cancelled = false;
    setHydrated(false);

    const signedIn = configured && status === "signed-in" && Boolean(userId);

    async function load() {
      if (configured && status === "initializing") return;

      if (signedIn && userId) {
        modeRef.current = "cloud";
        const token = await getToken();
        if (!token) {
          if (!cancelled) {
            setItems([]);
            setHydrated(true);
          }
          return;
        }

        const rows = await listPortfolioRows(token);
        if (cancelled) return;

        if (rows.length > 0) {
          // Cloud wins — build items with fresh signed URLs.
          pathsRef.current = new Map(rows.map((r) => [r.id, r.storage_path]));
          const built = await Promise.all(
            rows.map(async (r) => ({
              id: r.id,
              dataUrl: (await createSignedUrl(token, r.storage_path)) ?? "",
              addedAt: r.added_at,
              name: r.name ?? "",
            }))
          );
          if (!cancelled) setItems(built);
        } else {
          // Empty cloud gallery — migrate any local photos up (up to the cap).
          const local = loadPortfolio().slice(0, PORTFOLIO_MAX_ITEMS);
          const created: PortfolioItem[] = [];
          const map = new Map<string, string>();
          let newestPath: string | null = null;
          for (const li of local) {
            const blob = await dataUrlToBlob(li.dataUrl);
            if (!blob) continue;
            const id = cryptoId();
            const path = `${userId}/portfolio/${id}.jpg`;
            const up = await uploadImage(token, path, blob);
            if (!up) continue;
            const row = await insertPortfolioRow(token, {
              storage_path: path,
              name: li.name,
            });
            if (!row) continue;
            map.set(row.id, path);
            if (!newestPath) newestPath = path;
            created.push({
              id: row.id,
              dataUrl: (await createSignedUrl(token, path)) ?? "",
              addedAt: row.added_at,
              name: row.name ?? li.name,
            });
          }
          if (cancelled) return;
          pathsRef.current = map;
          setItems(created);
          // Adopt the newest migrated photo as the avatar.
          if (newestPath) setAvatarFromPath(newestPath);
        }
        if (!cancelled) setHydrated(true);
        return;
      }

      // Anonymous (or accounts not configured) — localStorage.
      modeRef.current = "local";
      pathsRef.current = new Map();
      if (!cancelled) {
        setItems(loadPortfolio());
        setHydrated(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [configured, status, userId, getToken, setAvatarFromPath]);

  const addFromFile = useCallback(
    async (file: File): Promise<PortfolioAddResult> => {
      if (items.length >= PORTFOLIO_MAX_ITEMS) {
        return { ok: false, reason: "full" };
      }

      if (modeRef.current === "cloud" && userId) {
        const token = await getToken();
        if (!token) return { ok: false, reason: "error" };

        let blob: Blob;
        try {
          blob = await downscaleToBlob(file);
        } catch {
          return { ok: false, reason: "invalid" };
        }

        const id = cryptoId();
        const path = `${userId}/portfolio/${id}.jpg`;
        const uploaded = await uploadImage(token, path, blob);
        if (!uploaded) return { ok: false, reason: "error" };

        const row = await insertPortfolioRow(token, {
          storage_path: path,
          name: file.name ?? "",
        });
        if (!row) {
          // Roll back the orphaned object so Storage doesn't accumulate junk.
          await deleteObject(token, path);
          return { ok: false, reason: "error" };
        }

        pathsRef.current.set(row.id, path);
        const item: PortfolioItem = {
          id: row.id,
          dataUrl: (await createSignedUrl(token, path)) ?? "",
          addedAt: row.added_at,
          name: row.name ?? file.name ?? "",
        };
        setItems((prev) => [item, ...prev].slice(0, PORTFOLIO_MAX_ITEMS));
        // Newest saved photo becomes the profile avatar.
        setAvatarFromPath(path);
        return { ok: true };
      }

      // Local (anonymous) — downscale to a data URL and persist.
      let dataUrl: string;
      try {
        dataUrl = await downscaleToDataUrl(file);
      } catch {
        return { ok: false, reason: "invalid" };
      }
      const item: PortfolioItem = {
        id: cryptoId(),
        dataUrl,
        addedAt: new Date().toISOString(),
        name: file.name ?? "",
      };
      const next = [item, ...items].slice(0, PORTFOLIO_MAX_ITEMS);
      const saved = savePortfolio(next);
      if (!saved) return { ok: false, reason: "storage" };
      setItems(next);
      return { ok: true };
    },
    [items, userId, getToken, setAvatarFromPath]
  );

  const remove = useCallback(
    (id: string) => {
      const cloud = modeRef.current === "cloud";
      const path = cloud ? pathsRef.current.get(id) : undefined;
      if (cloud) pathsRef.current.delete(id);

      setItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        if (!cloud) savePortfolio(next);
        return next;
      });

      if (cloud) {
        void (async () => {
          const token = await getToken();
          if (!token) return;
          await deletePortfolioRow(token, id);
          if (path) await deleteObject(token, path);
        })();
      }
    },
    [getToken]
  );

  const clearAll = useCallback(() => {
    if (modeRef.current === "cloud") {
      const entries = Array.from(pathsRef.current.entries());
      pathsRef.current = new Map();
      void (async () => {
        const token = await getToken();
        if (!token) return;
        await Promise.all(
          entries.map(async ([rowId, path]) => {
            await deletePortfolioRow(token, rowId);
            await deleteObject(token, path);
          })
        );
      })();
    } else {
      clearPortfolio();
    }
    setItems([]);
  }, [getToken]);

  const value = useMemo<PortfolioContextValue>(
    () => ({
      items,
      hydrated,
      count: items.length,
      isFull: items.length >= PORTFOLIO_MAX_ITEMS,
      addFromFile,
      remove,
      clearAll,
    }),
    [items, hydrated, addFromFile, remove, clearAll]
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

/**
 * Hook for accessing the photo portfolio and actions.
 * Must be used within a PortfolioProvider.
 */
export const usePortfolio = (): PortfolioContextValue => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};

export default PortfolioContext;
