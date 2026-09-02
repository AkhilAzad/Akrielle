import type {
  AnalysisResult,
  FacialAnalysisFeature,
  ImpactImprovement,
  ImprovementPriority,
} from "@/types/analysis";

/**
 * Scoring & image-quality helpers for the analysis pipeline.
 *
 * This module is intentionally pure and dependency-free (type-only imports),
 * so it stays client-safe alongside schema.ts and can be reasoned about in
 * isolation. It owns the "dynamic" parts of the result that must never be a
 * hardcoded default:
 *
 *   • Beauty Harmony / Glow-Up scores — derived from the model's own numbers,
 *     cross-filled between equivalent fields, and kept internally consistent
 *     (potential can never be lower than current).
 *   • Feature-specific confidence — each facial-analysis reading keeps its own
 *     confidence, an undetermined reading can't claim high certainty, and the
 *     single overall confidence is the mean of those per-feature readings.
 *   • Basic image quality — intrinsic pixel dimensions are read straight from
 *     the file bytes (no image library) so tiny/thumbnail images are rejected
 *     and borderline-resolution images honestly lower the reported confidence.
 */

/* -------------------------------------------------------------------------- */
/* Numeric helpers                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Coerce an unknown value to a 0–100 score, or null if it isn't a real number.
 * Unlike a fallback-to-0, null lets callers tell "absent" apart from "zero" so
 * they can cross-fill from another field instead of inventing a score.
 */
export function numOrNull(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(n)) {
    return null;
  }

  return Math.max(0, Math.min(100, n));
}

/**
 * First value (left to right) that reads as a real 0–100 score, else null.
 * Used to cross-fill equivalent score fields without falling back to a
 * fabricated constant.
 */
export function firstScore(...values: unknown[]): number | null {
  for (const value of values) {
    const n = numOrNull(value);
    if (n !== null) {
      return n;
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Feature-specific confidence                                                */
/* -------------------------------------------------------------------------- */

/**
 * A feature the model could not actually determine cannot carry high
 * certainty, regardless of the number it reported. Cap the confidence of any
 * "Unknown"/placeholder reading so per-feature confidence stays honest.
 */
const UNKNOWN_CONFIDENCE_CAP = 30;

const UNKNOWN_STATUSES = new Set([
  "",
  "unknown",
  "n/a",
  "na",
  "unavailable",
  "undetermined",
]);

export function isUnknownReading(status: string): boolean {
  return UNKNOWN_STATUSES.has(status.trim().toLowerCase());
}

/**
 * Clamp a single feature's confidence: an undetermined reading is capped so it
 * can't outshine features that were genuinely observed.
 */
export function normalizeFeatureConfidence(
  status: string,
  confidence: number
): number {
  if (isUnknownReading(status)) {
    return Math.min(confidence, UNKNOWN_CONFIDENCE_CAP);
  }
  return confidence;
}

/**
 * Overall confidence is grounded in the per-feature readings: it's the mean of
 * the individual facial-analysis confidences when any exist, so the headline
 * "AI Confidence" always reflects the detailed readings shown beneath it. Falls
 * back to the model's own top-level number only when no features were returned.
 */
export function deriveOverallConfidence(
  features: FacialAnalysisFeature[],
  fallback: number
): number {
  const values = features
    .map((f) => f.confidence)
    .filter((n) => Number.isFinite(n));

  if (values.length === 0) {
    return fallback;
  }

  const mean =
    values.reduce((sum, n) => sum + n, 0) / values.length;

  return Math.round(mean);
}

/* -------------------------------------------------------------------------- */
/* Dynamic Glow-Up scoring                                                    */
/* -------------------------------------------------------------------------- */

/**
 * How much realistic upside each identified improvement implies. Used only as a
 * fallback when the model omitted a usable potential score (or returned one
 * below the current score); a valid model potential is always preferred. These
 * are transparent weights, not a fabricated result — the derived potential is
 * literally the current score plus the headroom the improvements represent.
 */
const HEADROOM_BY_PRIORITY: Record<ImprovementPriority, number> = {
  High: 8,
  Medium: 5,
  Low: 2,
};

const MIN_DERIVED_HEADROOM = 3;
const MAX_DERIVED_HEADROOM = 40;

export function deriveHeadroom(
  improvements: ImpactImprovement[]
): number {
  const raw = improvements.reduce(
    (sum, item) => sum + HEADROOM_BY_PRIORITY[item.priority],
    0
  );

  return Math.min(
    MAX_DERIVED_HEADROOM,
    Math.max(MIN_DERIVED_HEADROOM, raw)
  );
}

/**
 * Keep the Glow-Up pair coherent. The current score is trusted as-is; the
 * potential score is trusted only when it's present and at least the current
 * score, otherwise it's derived from the improvements identified. Guarantees
 * 0 <= current <= potential <= 100.
 */
export function reconcileGlowUp(
  current: number,
  rawPotential: number | null,
  improvements: ImpactImprovement[]
): { currentAppearanceScore: number; potentialScore: number } {
  const currentAppearanceScore = Math.max(0, Math.min(100, current));

  let potentialScore: number;

  if (rawPotential !== null && rawPotential >= currentAppearanceScore) {
    potentialScore = Math.min(100, rawPotential);
  } else {
    potentialScore = Math.min(
      100,
      currentAppearanceScore + deriveHeadroom(improvements)
    );
  }

  return { currentAppearanceScore, potentialScore };
}

/* -------------------------------------------------------------------------- */
/* Basic image-quality checks                                                 */
/* -------------------------------------------------------------------------- */

export interface ImageDimensions {
  width: number;
  height: number;
}

function pngDimensions(b: Uint8Array): ImageDimensions | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  for (let i = 0; i < signature.length; i++) {
    if (b[i] !== signature[i]) {
      return null;
    }
  }

  // IHDR must be the first chunk; its data begins at byte 16.
  const width =
    b[16] * 0x1000000 + (b[17] << 16) + (b[18] << 8) + b[19];
  const height =
    b[20] * 0x1000000 + (b[21] << 16) + (b[22] << 8) + b[23];

  if (width > 0 && height > 0) {
    return { width, height };
  }
  return null;
}

function jpegDimensions(b: Uint8Array): ImageDimensions | null {
  if (b[0] !== 0xff || b[1] !== 0xd8) {
    return null;
  }

  const len = b.length;
  let i = 2;

  while (i + 1 < len) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }

    let marker = b[i + 1];

    // Skip any fill bytes (0xFF padding) between segments.
    while (marker === 0xff && i + 1 < len) {
      i++;
      marker = b[i + 1];
    }

    i += 2;

    // Standalone markers that carry no length payload.
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      continue;
    }

    if (i + 1 >= len) {
      break;
    }

    const segmentLength = (b[i] << 8) | b[i + 1];
    if (segmentLength < 2) {
      break;
    }

    // Start-Of-Frame markers hold the image size (exclude DHT/JPG/DAC).
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isSof) {
      if (i + 6 < len) {
        const height = (b[i + 3] << 8) | b[i + 4];
        const width = (b[i + 5] << 8) | b[i + 6];
        if (width > 0 && height > 0) {
          return { width, height };
        }
      }
      return null;
    }

    i += segmentLength;
  }

  return null;
}

function webpDimensions(b: Uint8Array): ImageDimensions | null {
  if (b.length < 30) {
    return null;
  }

  // "RIFF" .... "WEBP"
  const isRiff =
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46;
  const isWebp =
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;

  if (!isRiff || !isWebp) {
    return null;
  }

  const fourCC = String.fromCharCode(b[12], b[13], b[14], b[15]);

  // Lossy (VP8 ): 3-byte start code 0x9d 0x01 0x2a, then 14-bit dimensions.
  if (fourCC === "VP8 ") {
    if (b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
      const width = ((b[27] << 8) | b[26]) & 0x3fff;
      const height = ((b[29] << 8) | b[28]) & 0x3fff;
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }
    return null;
  }

  // Lossless (VP8L): 0x2f signature, then packed 14-bit dimensions.
  if (fourCC === "VP8L") {
    if (b[20] !== 0x2f) {
      return null;
    }
    const b1 = b[21];
    const b2 = b[22];
    const b3 = b[23];
    const b4 = b[24];
    const width = 1 + (((b2 & 0x3f) << 8) | b1);
    const height =
      1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    if (width > 0 && height > 0) {
      return { width, height };
    }
    return null;
  }

  // Extended (VP8X): 24-bit canvas dimensions minus one.
  if (fourCC === "VP8X") {
    const width = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const height = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    if (width > 0 && height > 0) {
      return { width, height };
    }
    return null;
  }

  return null;
}

/**
 * Read intrinsic pixel dimensions straight from the file header — no image
 * library, no full decode. Returns null when the size can't be determined
 * confidently, so callers can fail open (never block a valid upload on a
 * parsing gap).
 */
export function readImageDimensions(
  bytes: Uint8Array,
  mimeType: string
): ImageDimensions | null {
  if (bytes.length < 24) {
    return null;
  }

  switch (mimeType) {
    case "image/png":
      return pngDimensions(bytes);
    case "image/jpeg":
      return jpegDimensions(bytes);
    case "image/webp":
      return webpDimensions(bytes);
    default:
      return (
        pngDimensions(bytes) ??
        jpegDimensions(bytes) ??
        webpDimensions(bytes)
      );
  }
}

/**
 * Resolution above which we treat the photo as full quality. Between the
 * minimum accepted dimension and this, confidence is scaled down so a barely
 * acceptable image doesn't report the same certainty as a crisp one.
 */
const COMFORTABLE_DIMENSION = 512;

/** Lowest multiplier applied at the minimum accepted resolution. */
const QUALITY_FLOOR = 0.8;

/**
 * A 0.8–1.0 multiplier describing how much the image resolution supports a
 * confident reading. 1.0 at/above the comfortable size, scaling down to the
 * floor as the shorter side approaches the minimum accepted dimension.
 */
export function imageQualityFactor(
  shortSide: number,
  minDimension: number,
  comfortable: number = COMFORTABLE_DIMENSION
): number {
  if (shortSide >= comfortable) {
    return 1;
  }

  const span = comfortable - minDimension;
  if (span <= 0) {
    return 1;
  }

  const t = Math.max(0, Math.min(1, (shortSide - minDimension) / span));
  return QUALITY_FLOOR + (1 - QUALITY_FLOOR) * t;
}

/**
 * Apply an image-quality factor to every confidence number in the result
 * (overall + per feature). Scores that describe the face itself — beauty
 * harmony, glow-up — are left untouched: image quality affects how *sure* we
 * are, not the reading itself.
 */
export function applyImageConfidence(
  result: AnalysisResult,
  factor: number
): AnalysisResult {
  if (factor >= 1) {
    return result;
  }

  return {
    ...result,
    confidence: Math.round(result.confidence * factor),
    facialAnalysis: result.facialAnalysis.map((feature) => ({
      ...feature,
      confidence: Math.round(feature.confidence * factor),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Human-readable score rationale                                             */
/* -------------------------------------------------------------------------- */

/**
 * Compose a short, natural "why this score" line, grounded strictly in what the
 * result already contains — never anything invented. It draws only on:
 *
 *   • the two profile readings most tied to a harmony score — overall facial
 *     harmony and face shape — each stated only when it was actually determined
 *     (an "Unknown"/placeholder reading is dropped, not described);
 *   • the scoring factors already shown to the user — the overall confidence
 *     (itself the mean of the per-feature readings) and how many features were
 *     read;
 *   • the single highest-impact area the analysis surfaced, if any, as the
 *     honest path to a higher score.
 *
 * Every clause is omitted when the value behind it is absent, so the sentence
 * only ever states what the analysis genuinely found. It reads the result; it
 * changes no score.
 */
export function buildScoreRationale(result: AnalysisResult): string {
  const descriptor = (value: string): string | null => {
    const trimmed = value.trim();
    return trimmed && !isUnknownReading(trimmed) ? trimmed.toLowerCase() : null;
  };

  const harmony = descriptor(result.facialHarmony);
  const shape = descriptor(result.faceShape);

  const traits: string[] = [];
  if (harmony) {
    traits.push(`your ${harmony} facial harmony`);
  }
  if (shape) {
    traits.push(`${harmony ? "" : "your "}${shape} facial structure`);
  }

  const lead =
    traits.length > 0
      ? `This score reflects AXL's read of ${traits.join(" and ")}`
      : "This score reflects AXL's overall read of your features";

  const confidence = Math.round(result.confidence);
  const featureCount = result.facialAnalysis.length;

  const confidenceClause =
    featureCount > 0
      ? `, measured across ${featureCount} facial ${
          featureCount === 1 ? "feature" : "features"
        } at ${confidence}% average confidence`
      : `, with ${confidence}% overall confidence`;

  let rationale = `${lead}${confidenceClause}.`;

  const topArea = result.impactImprovements[0]?.area?.trim();
  if (topArea) {
    rationale += ` The clearest path to a higher score is ${topArea.toLowerCase()}.`;
  }

  return rationale;
}
