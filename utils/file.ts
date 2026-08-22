import {
  ACCEPTED_FILE_TYPES,
  ACCEPTED_FILE_EXTENSIONS_LABEL,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  MIN_IMAGE_DIMENSION,
} from "@/constants/upload";
import type { UploadError } from "@/types/upload";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Validates a File against Alkline's accepted formats and size limit.
 * Returns null when the file is valid, or a descriptive UploadError.
 */
export function validateImageFile(file: File): UploadError | null {
  const isAcceptedType = (ACCEPTED_FILE_TYPES as readonly string[]).includes(file.type);
  if (!isAcceptedType) {
    return {
      reason: "invalid-type",
      message: `Please upload a ${ACCEPTED_FILE_EXTENSIONS_LABEL} image.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      reason: "too-large",
      message: `That image is larger than ${MAX_FILE_SIZE_LABEL}. Please choose a smaller file.`,
    };
  }

  return null;
}

/**
 * Decodes the image in the browser to confirm it's a real, readable image
 * of a usable size. Catches corrupt files and tiny thumbnails/icons that
 * pass the type + size checks but can't be meaningfully analyzed. Resolves
 * with null when the image is fine, or a descriptive UploadError otherwise.
 *
 * Never rejects — decode failures resolve as an "unreadable" UploadError so
 * callers only need a single, simple code path.
 */
export function validateImageDimensions(file: File): Promise<UploadError | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => URL.revokeObjectURL(url);

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      cleanup();

      if (!width || !height) {
        resolve({
          reason: "unreadable",
          message: "We couldn't read that image. Please try a different photo.",
        });
        return;
      }

      if (Math.min(width, height) < MIN_IMAGE_DIMENSION) {
        resolve({
          reason: "too-small",
          message: `That image is too small to analyze. Please use a photo at least ${MIN_IMAGE_DIMENSION}px on each side.`,
        });
        return;
      }

      resolve(null);
    };

    img.onerror = () => {
      cleanup();
      resolve({
        reason: "unreadable",
        message: "We couldn't read that image. Please try a different photo.",
      });
    };

    img.src = url;
  });
}
