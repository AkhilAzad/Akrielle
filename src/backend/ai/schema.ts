import type {
  AnalysisResult,
  ImprovementPriority,
} from "@/types/analysis";


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
  fallback = "Unavailable"
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


  const recommendations =
    Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [];



  const recommendationText =
    recommendations
      .map((item) =>
        typeof item === "string"
          ? item
          : JSON.stringify(item)
      )
      .join(", ");



  return {

    beautyScore:
      clampScore(
        parsed.beautyScore,
        80
      ),


    confidence:
      clampScore(
        parsed.confidence,
        90
      ),



    faceShape:
      str(
        parsed.faceShape ??
        parsed.face_shape
      ),



    skinTone:
      str(
        parsed.skinTone ??
        skin.tone ??
        skin.texture
      ),



    undertone:
      str(
        parsed.undertone
      ),



    eyeShape:
      str(
        parsed.eyeShape,
        "Detected from facial analysis"
      ),



    lipShape:
      str(
        parsed.lipShape,
        "Detected from facial analysis"
      ),



    facialHarmony:
      str(
        parsed.facialHarmony ??
        parsed.symmetry
      ),



    recommendations: {

      foundation:
        "Recommended based on skin analysis",


      lipstick:
        "Recommended based on undertone",


      blush:
        "Recommended based on facial harmony",


      eyeshadow:
        "Recommended based on eye contrast",


      highlighter:
        "Recommended based on facial structure",


      hairstyle:
        recommendationText ||
        "Maintain hairstyle suited to face shape",


      accessories:
        "Choose accessories matching facial proportions",


      skincare:
        str(
          skin.concerns,
          recommendationText
        ),

    },



    glowUp: {

      currentAppearanceScore:
        clampScore(
          parsed.currentScore,
          80
        ),


      potentialScore:
        clampScore(
          parsed.potentialScore,
          90
        ),


      reason:
        "Generated through AI beauty intelligence analysis",

    },



    impactImprovements:
      Array.isArray(
        parsed.impactImprovements
      )
      ? parsed.impactImprovements
          .filter(isRecord)
          .map((item) => ({
            area:
              str(
                item.area,
                "Improvement"
              ),

            priority:
              priority(
                item.priority
              ),

            explanation:
              str(
                item.explanation
              ),

            expectedImprovement:
              str(
                item.expectedImprovement
              ),
          }))
      : [],



    facialAnalysis:
      Array.isArray(
        parsed.facialAnalysis
      )
      ? parsed.facialAnalysis
          .filter(isRecord)
          .map((item) => ({
            feature:
              str(
                item.feature,
                "Feature"
              ),

            confidence:
              clampScore(
                item.confidence
              ),

            status:
              str(
                item.status
              ),

            explanation:
              str(
                item.explanation
              ),
          }))
      : [],

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
      parsed.skin_analysis
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