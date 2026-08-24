import type {
  AnalysisResult,
  ImprovementPriority,
} from "@/contexts/AnalysisResultContext";

/**
 * Turns a raw model response into a safe, fully-typed AnalysisResult.
 *
 * The model is usually right, but it can wrap JSON in prose, fence it in
 * markdown, drop a field, or return a number as a string. The results page
 * and PDF report both read these fields directly (e.g. `faceShape.toLowerCase()`),
 * so a single missing field would otherwise crash the UI. These helpers
 * extract the JSON robustly and then repair/clamp every field, only giving
 * up when the payload isn't a real analysis at all.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Pull the first well-formed JSON object out of a model response. Handles
 * markdown code fences and stray prose by falling back to the substring
 * between the outer braces.
 */
export function extractJsonObject(raw: string): unknown | null {
  if (!raw) return null;

  const text = raw
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    // Fall back to slicing between the outermost braces.
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function str(value: unknown, fallback = "Unavailable"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/** Coerce to a number and clamp into the 0–100 score range. */
function clampScore(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, n));
}

function priority(value: unknown): ImprovementPriority {
  const s = String(value).toLowerCase();
  if (s === "high") return "High";
  if (s === "low") return "Low";
  return "Medium";
}

/** The identity of an analysis — if most of these are missing, it isn't one. */
const CORE_STRING_KEYS = [
  "faceShape",
  "skinTone",
  "undertone",
  "eyeShape",
  "lipShape",
  "facialHarmony",
] as const;

export type CoerceOutcome =
  | { ok: true; data: AnalysisResult }
  | { ok: false };

/**
 * Repairs a parsed record into a fully-typed AnalysisResult, coercing and
 * clamping every field to a safe value. This never rejects — callers decide
 * whether the payload qualifies as an analysis before calling it.
 */
function repairAnalysisResult(parsed: Record<string, unknown>): AnalysisResult {
  const recs = isRecord(parsed.recommendations) ? parsed.recommendations : {};
  const glow = isRecord(parsed.glowUp) ? parsed.glowUp : {};

  const current = clampScore(glow.currentAppearanceScore, 0);
  // Product rule: potential is never below current.
  const potential = Math.max(current, clampScore(glow.potentialScore, current));

  const impactImprovements = Array.isArray(parsed.impactImprovements)
    ? parsed.impactImprovements.filter(isRecord).map((item) => ({
        area: str(item.area, "Improvement"),
        priority: priority(item.priority),
        explanation: str(item.explanation, ""),
        expectedImprovement: str(item.expectedImprovement, ""),
      }))
    : [];

  const facialAnalysis = Array.isArray(parsed.facialAnalysis)
    ? parsed.facialAnalysis.filter(isRecord).map((item) => ({
        feature: str(item.feature, "Feature"),
        confidence: clampScore(item.confidence, 0),
        status: str(item.status, ""),
        explanation: str(item.explanation, ""),
      }))
    : [];

  return {
    beautyScore: clampScore(parsed.beautyScore, 0),
    confidence: clampScore(parsed.confidence, 0),
    faceShape: str(parsed.faceShape),
    skinTone: str(parsed.skinTone),
    undertone: str(parsed.undertone),
    eyeShape: str(parsed.eyeShape),
    lipShape: str(parsed.lipShape),
    facialHarmony: str(parsed.facialHarmony),
    recommendations: {
      foundation: str(recs.foundation),
      lipstick: str(recs.lipstick),
      blush: str(recs.blush),
      eyeshadow: str(recs.eyeshadow),
      highlighter: str(recs.highlighter),
      hairstyle: str(recs.hairstyle),
      accessories: str(recs.accessories),
      skincare: str(recs.skincare),
    },
    glowUp: {
      currentAppearanceScore: current,
      potentialScore: potential,
      reason: str(glow.reason, ""),
    },
    impactImprovements,
    facialAnalysis,
  };
}

/**
 * Validates and repairs a parsed payload into an AnalysisResult. Returns
 * `{ ok: false }` only when the payload clearly isn't an analysis (not an
 * object, or missing the backbone of core attributes) — e.g. a refusal or
 * an error object. Otherwise every field is coerced to a safe value.
 */
export function coerceAnalysisResult(parsed: unknown): CoerceOutcome {
  if (!isRecord(parsed)) return { ok: false };

  const presentCore = CORE_STRING_KEYS.filter(
    (key) => typeof parsed[key] === "string" && (parsed[key] as string).trim()
  ).length;
  if (presentCore < 3) return { ok: false };

  return { ok: true, data: repairAnalysisResult(parsed) };
}

/**
 * Repair a *previously stored* payload (e.g. a row loaded back from the
 * database) into a safe AnalysisResult. Unlike `coerceAnalysisResult`, this
 * never rejects: stored rows already passed validation at save time, so here
 * we only need to guarantee the shape is safe for the UI to render directly —
 * even if the row was written by an older schema version or is corrupted.
 */
export function coerceStoredResult(parsed: unknown): AnalysisResult {
  return repairAnalysisResult(isRecord(parsed) ? parsed : {});
}
