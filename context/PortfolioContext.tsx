"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import type { PortfolioItem } from "@/types/profile";

/** Reason an add attempt was rejected, for a friendly caller-side message. */
export type PortfolioAddReason = "full" | "invalid" | "storage" | "error";

export interface PortfolioAddResult {
  ok: boolean;
  reason?: PortfolioAddReason;
}

/**
 * Client-side, anonymous-first photo portfolio persisted to localStorage.
 *
 * Images are downscaled to compact JPEG data URLs before storage and the list
 * is capped at PORTFOLIO_MAX_ITEMS (newest first), so a few thumbnails stay
 * comfortably inside the storage budget. `hydrated` gates SSR/first render.
 */
export interface PortfolioContextValue {
  items: PortfolioItem[];
  /** True once localStorage has been read on the client. */
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
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read any persisted portfolio once, on the client, after mount.
  useEffect(() => {
    setItems(loadPortfolio());
    setHydrated(true);
  }, []);

  const addFromFile = useCallback(
    async (file: File): Promise<PortfolioAddResult> => {
      if (items.length >= PORTFOLIO_MAX_ITEMS) {
        return { ok: false, reason: "full" };
      }
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

      // Prepend (newest first) and cap to the max, then persist.
      const next = [item, ...items].slice(0, PORTFOLIO_MAX_ITEMS);
      const saved = savePortfolio(next);
      if (!saved) {
        // Likely quota exceeded — don't update state to a value we couldn't
        // persist; report back so the UI can explain.
        return { ok: false, reason: "storage" };
      }
      setItems(next);
      return { ok: true };
    },
    [items]
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      savePortfolio(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    clearPortfolio();
    setItems([]);
  }, []);

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
 * Hook for accessing the local photo portfolio and actions.
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
