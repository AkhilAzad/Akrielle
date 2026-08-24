import {
  PORTFOLIO_STORAGE_KEY,
  PORTFOLIO_THUMB_MAX_PX,
  PORTFOLIO_THUMB_QUALITY,
} from "@/constants/profile";
import type { PortfolioItem } from "@/types/profile";

/**
 * Dependency-free, SSR-safe persistence for the local photo portfolio, plus the
 * canvas helper that downscales a picked file into a small JPEG data URL.
 *
 * Same posture as the other stores: never throw, degrade to an empty gallery if
 * storage is missing or blocked. Images are downscaled before storage so a
 * handful of thumbnails stay comfortably inside the localStorage budget.
 */

/** A best-effort unique id, without pulling in a uuid dependency. */
export function cryptoId(): string {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to the manual id below.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Narrow an unknown blob to a PortfolioItem, or null if it isn't one. */
function coerceItem(raw: unknown): PortfolioItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.dataUrl !== "string") return null;
  if (!r.dataUrl.startsWith("data:image/")) return null;
  return {
    id: r.id,
    dataUrl: r.dataUrl,
    addedAt: typeof r.addedAt === "string" ? r.addedAt : new Date().toISOString(),
    name: typeof r.name === "string" ? r.name : "",
  };
}

/** Read the persisted portfolio, or an empty list. */
export function loadPortfolio(): PortfolioItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(coerceItem)
      .filter((item): item is PortfolioItem => item !== null);
  } catch {
    return [];
  }
}

/**
 * Persist the portfolio. Returns false if the write failed (e.g. quota
 * exceeded) so the caller can surface a friendly message instead of assuming
 * success.
 */
export function savePortfolio(items: PortfolioItem[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

/** Remove the persisted portfolio (used by "clear all"). */
export function clearPortfolio(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

/**
 * Downscale an image file to a compact JPEG data URL using a canvas — no
 * dependency, all in the browser. The longest edge is clamped to
 * PORTFOLIO_THUMB_MAX_PX so stored thumbnails stay small. Rejects if the file
 * can't be decoded as an image.
 */
export function downscaleToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in a browser"));
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not an image file"));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const { naturalWidth: w, naturalHeight: h } = img;
        if (!w || !h) {
          reject(new Error("Image has no dimensions"));
          return;
        }
        const scale = Math.min(1, PORTFOLIO_THUMB_MAX_PX / Math.max(w, h));
        const outW = Math.max(1, Math.round(w * scale));
        const outH = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, outW, outH);
        resolve(canvas.toDataURL("image/jpeg", PORTFOLIO_THUMB_QUALITY));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Downscale failed"));
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };

    img.src = url;
  });
}
