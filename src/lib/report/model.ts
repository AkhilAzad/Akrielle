import type { AnalysisResult } from "@/contexts/AnalysisResultContext";

/**
 * A plain-data (icon-free, fully serializable) view of an analysis
 * result, shaped for the printable Beauty Report. The wording here is
 * kept faithful to what the results page renders on screen, so the
 * exported PDF reads as the same consultation the user just saw.
 */
export interface ReportModel {
  score: number;
  confidence: number;
  scoreDescription: string;
  glowUp: {
    current: number;
    potential: number;
    reason: string;
  };
  profile: {
    label: string;
    value: string;
    confidence: number;
    explanation: string;
  }[];
  facial: {
    feature: string;
    status: string;
    confidence: number;
    explanation: string;
  }[];
  improvements: {
    rank: number;
    area: string;
    priority: string;
    explanation: string;
    expectedImprovement: string;
  }[];
  recommendations: {
    category: string;
    value: string;
    reason: string;
  }[];
}

const lower = (value: string) => value.toLowerCase();

/**
 * Derives the report model from a raw analysis result. Mirrors the
 * mapping used on the results page so the printed report and the
 * on-screen profile stay in lockstep.
 */
export function buildReportModel(result: AnalysisResult): ReportModel {
  const confidence = Math.round(result.confidence);

  return {
    score: Math.round(result.beautyScore),
    confidence,
    scoreDescription:
      "Your beauty profile was generated from AI analysis of your uploaded photo.",
    glowUp: {
      current: Math.round(result.glowUp.currentAppearanceScore),
      potential: Math.round(result.glowUp.potentialScore),
      reason: result.glowUp.reason,
    },
    profile: [
      {
        label: "Face Shape",
        value: result.faceShape,
        confidence,
        explanation: `AXL reads your face shape as ${lower(result.faceShape)}.`,
      },
      {
        label: "Skin Tone",
        value: result.skinTone,
        confidence,
        explanation: `Your complexion reads as ${lower(result.skinTone)} overall.`,
      },
      {
        label: "Undertone",
        value: result.undertone,
        confidence,
        explanation: `A ${lower(result.undertone)} undertone was detected beneath the surface tone.`,
      },
      {
        label: "Eye Shape",
        value: result.eyeShape,
        confidence,
        explanation: `Your eyes read as ${lower(result.eyeShape)} in shape.`,
      },
      {
        label: "Lip Shape",
        value: result.lipShape,
        confidence,
        explanation: `Your lips read as ${lower(result.lipShape)}.`,
      },
      {
        label: "Facial Harmony",
        value: result.facialHarmony,
        confidence,
        explanation: `Overall facial harmony reads as ${lower(result.facialHarmony)}.`,
      },
    ],
    facial: result.facialAnalysis.map((item) => ({
      feature: item.feature,
      status: item.status,
      confidence: Math.round(item.confidence),
      explanation: item.explanation,
    })),
    improvements: result.impactImprovements.map((item, index) => ({
      rank: index + 1,
      area: item.area,
      priority: item.priority,
      explanation: item.explanation,
      expectedImprovement: item.expectedImprovement,
    })),
    recommendations: [
      {
        category: "Foundation",
        value: result.recommendations.foundation,
        reason: `Complements your ${lower(result.skinTone)} skin tone and ${lower(result.undertone)} undertone.`,
      },
      {
        category: "Lipstick",
        value: result.recommendations.lipstick,
        reason: `Suited to your ${lower(result.undertone)} undertone and ${lower(result.lipShape)} lip shape.`,
      },
      {
        category: "Blush",
        value: result.recommendations.blush,
        reason: `Follows the natural contour of your ${lower(result.faceShape)} face shape.`,
      },
      {
        category: "Eyeshadow",
        value: result.recommendations.eyeshadow,
        reason: `Complements your ${lower(result.eyeShape)} eye shape and ${lower(result.undertone)} undertone.`,
      },
      {
        category: "Highlighter",
        value: result.recommendations.highlighter,
        reason: `Enhances your ${lower(result.skinTone)} skin tone naturally.`,
      },
      {
        category: "Hairstyle",
        value: result.recommendations.hairstyle,
        reason: `Frames your ${lower(result.faceShape)} face shape at its most flattering angles.`,
      },
      {
        category: "Accessories",
        value: result.recommendations.accessories,
        reason: `Selected to align with your ${lower(result.undertone)} undertone.`,
      },
      {
        category: "Skincare Focus",
        value: result.recommendations.skincare,
        reason: `Supports your skin's natural balance and evenness over time.`,
      },
    ],
  };
}
