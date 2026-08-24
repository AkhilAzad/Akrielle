import {
  PORTFOLIO_THUMB_MAX_PX,
  PORTFOLIO_THUMB_QUALITY,
} from "@/constants/profile";

/**
 * Shared, dependency-free image helper for the Storage-backed flows.
 *
 * `downscaleToBlob` mirrors the portfolio store's `downscaleToDataUrl`, but
 * emits a binary Blob (via canvas.toBlob) instead of a base64 data URL — the
 * right shape for uploading to Supabase Storage. Keeping the downscale here
 * means both the cloud portfolio and the opt-in scan upload clamp images to
 * the same compact size before they ever leave the device.
 */

/** MIME type every downscaled upload is encoded as. */
export const UPLOAD_CONTENT_TYPE = "image/jpeg";

/**
 * Downscale an image file to a compact JPEG Blob using a canvas. The longest
 * edge is clamped to `maxPx`. Rejects if the file can't be decoded as an image
 * or the browser can't produce a blob. Browser-only (guards against SSR).
 */
export function downscaleToBlob(
  file: File,
  maxPx: number = PORTFOLIO_THUMB_MAX_PX,
  quality: number = PORTFOLIO_THUMB_QUALITY
): Promise<Blob> {
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
        const scale = Math.min(1, maxPx / Math.max(w, h));
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
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not encode image"));
          },
          UPLOAD_CONTENT_TYPE,
          quality
        );
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

/**
 * Convert a data: URL (e.g. a locally-stored portfolio thumbnail) into a Blob
 * so it can be uploaded to Storage during the local→cloud migration. Returns
 * null if it can't be read. Browser-only.
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob | null> {
  if (typeof fetch === "undefined") return null;
  try {
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch {
    return null;
  }
}
