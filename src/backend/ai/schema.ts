import type {
  AnalysisResult,
  FacialAnalysisFeature,
  ImpactImprovement,
  ImprovementPriority,
} from "@/types/analysis";

import {
  deriveOverallConfidence,
  firstScore,
  normalizeFeatureConfidence,
  reconcileGlowUp,
} from "./scoring";


export function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


/**
 * Extract JSON object from AI response.
 * Handles markdown fences and extra text.
 */
export function extractJsonObject(
  raw: string
): unknown | null {

  if (!raw) return null;


  const text = raw
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();


  try {
    return JSON.parse(text);
  } catch {}


  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");


  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {
    return null;
  }


  try {
    return JSON.parse(
      text.slice(start, end + 1)
    );
  }
  catch {
    return null;
  }
}



function str(
  value: unknown,
  fallback = "Unknown"
): string {

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value.trim();
  }


  return fallback;
}



function clampScore(
  value: unknown,
  fallback = 0
): number {

  const n =
    typeof value === "number"
      ? value
      : Number(value);


  if (!Number.isFinite(n)) {
    return fallback;
  }


  return Math.max(
    0,
    Math.min(100, n)
  );
}



function priority(
  value: unknown
): ImprovementPriority {

  const s =
    String(value).toLowerCase();


  if (s === "high") {
    return "High";
  }


  if (s === "low") {
    return "Low";
  }


  return "Medium";
}



export type CoerceOutcome =
  | {
      ok: true;
      data: AnalysisResult;
    }
  | {
      ok: false;
    };



/**
 * Converts Gemini/Grok output into
 * the internal AXL AnalysisResult format.
 */
function repairAnalysisResult(
  parsed: Record<string, unknown>
): AnalysisResult {


  const skin =
    isRecord(parsed.skin_analysis)
      ? parsed.skin_analysis
      : {};


  const glow =
    isRecord(parsed.glowUp)
      ? parsed.glowUp
      : {};


  const recs =
    isRecord(parsed.recommendations)
      ? parsed.recommendations
      : {};



  /*
   * Feature-specific confidence: keep each reading's own confidence, but an
   * undetermined ("Unknown") reading can't claim high certainty.
   */
  const facialAnalysis: FacialAnalysisFeature[] =
    Array.isArray(parsed.facialAnalysis)
      ? parsed.facialAnalysis
          .filter(isRecord)
          .map((item) => {
            const status = str(item.status);

            return {
              feature:
                str(item.feature, "Feature"),

              confidence:
                normalizeFeatureConfidence(
                  status,
                  clampScore(item.confidence)
                ),

              status,

              explanation:
                str(item.explanation),
            };
          })
      : [];



  const impactImprovements: ImpactImprovement[] =
    Array.isArray(parsed.impactImprovements)
      ? parsed.impactImprovements
          .filter(isRecord)
          .map((item) => ({
            area:
              str(item.area, "Improvement"),

            priority:
              priority(item.priority),

            explanation:
              str(item.explanation),

            expectedImprovement:
              str(item.expectedImprovement),
          }))
      : [];



  /*
   * Dynamic Beauty Harmony score: the model's honest per-image number, never a
   * hardcoded default; cross-filled from the equivalent current-appearance
   * score only if the model omitted it.
   */
  const beautyScore =
    firstScore(
      parsed.beautyScore,
      glow.currentAppearanceScore,
      parsed.currentScore
    ) ?? 0;



  /*
   * Dynamic Glow-Up score: current cross-fills with the beauty score; potential
   * is trusted only when present and >= current, otherwise derived from the
   * improvements actually identified. reconcileGlowUp guarantees
   * potential >= current.
   */
  const currentAppearance =
    firstScore(
      glow.currentAppearanceScore,
      parsed.currentScore,
      parsed.beautyScore
    ) ?? 0;

  const glowScores =
    reconcileGlowUp(
      currentAppearance,
      firstScore(
        glow.potentialScore,
        parsed.potentialScore
      ),
      impactImprovements
    );



  /*
   * Overall confidence is grounded in the per-feature readings when present,
   * falling back to the model's own top-level number only if none were given.
   */
  const confidence =
    deriveOverallConfidence(
      facialAnalysis,
      firstScore(parsed.confidence) ?? 0
    );



  return {

    beautyScore,


    confidence,



    faceShape:
      str(
        parsed.faceShape ??
        parsed.face_shape
      ),



    skinTone:
      str(
        parsed.skinTone ??
        parsed.skinAnalysis ??
        skin.tone ??
        skin.texture
      ),



    undertone:
      str(
        parsed.undertone
      ),



    eyeShape:
      str(
        parsed.eyeShape
      ),



    lipShape:
      str(
        parsed.lipShape
      ),



    facialHarmony:
      str(
        parsed.facialHarmony ??
        parsed.facialSymmetry ??
        parsed.symmetry
      ),



    recommendations: {

      foundation:
        str(recs.foundation),


      lipstick:
        str(recs.lipstick),


      blush:
        str(recs.blush),


      eyeshadow:
        str(recs.eyeshadow),


      highlighter:
        str(recs.highlighter),


      hairstyle:
        str(recs.hairstyle),


      accessories:
        str(recs.accessories),


      skincare:
        str(recs.skincare),

    },



    glowUp: {

      currentAppearanceScore:
        glowScores.currentAppearanceScore,


      potentialScore:
        glowScores.potentialScore,


      reason:
        str(
          glow.reason ??
          parsed.reason,
          "Based on the improvements identified from your photo."
        ),

    },



    impactImprovements,



    facialAnalysis,

  };
}



/**
 * Validate + normalize AI response.
 */
export function coerceAnalysisResult(
  parsed: unknown
): CoerceOutcome {


  if (!isRecord(parsed)) {
    return {
      ok: false,
    };
  }



  const hasFace =
    Boolean(
      parsed.faceShape ??
      parsed.face_shape
    );


  const hasSkin =
    Boolean(
      parsed.skinTone ??
      parsed.skin_analysis ??
      parsed.skinAnalysis
    );


  const hasUndertone =
    Boolean(
      parsed.undertone
    );



  if (
    !hasFace &&
    !hasSkin &&
    !hasUndertone
  ) {
    return {
      ok:false,
    };
  }



  return {
    ok:true,
    data:
      repairAnalysisResult(parsed),
  };
}



/**
 * Used for old saved database records.
 */
export function coerceStoredResult(
  parsed: unknown
): AnalysisResult {

  return repairAnalysisResult(
    isRecord(parsed)
      ? parsed
      : {}
  );

}