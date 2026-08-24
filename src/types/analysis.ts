/**
 * Shared analysis domain types.
 *
 * These describe the shape of the result returned by /api/analyze and are
 * consumed across the app — the AI schema/coercion layer, the analysis-result
 * context, the printable report model, the Supabase persistence layer, and the
 * results/profile UI. They live here, decoupled from any React context, so that
 * non-React modules can depend on the data model without importing a client
 * component.
 */

/**
 * Shape of the recommendations block returned by /api/analyze.
 */
export interface AnalysisRecommendations {
  foundation: string;
  lipstick: string;
  blush: string;
  eyeshadow: string;
  highlighter: string;
  hairstyle: string;
  accessories: string;
  skincare: string;
}

/**
 * Priority level for a ranked improvement.
 */
export type ImprovementPriority = "High" | "Medium" | "Low";

/**
 * Current vs. potential appearance.
 */
export interface GlowUpPotential {
  currentAppearanceScore: number;
  potentialScore: number;
  reason: string;
}

/**
 * A single ranked, high-impact improvement area.
 */
export interface ImpactImprovement {
  area: string;
  priority: ImprovementPriority;
  explanation: string;
  expectedImprovement: string;
}

/**
 * A single feature reading from the expanded facial analysis.
 */
export interface FacialAnalysisFeature {
  feature: string;

  /** 0–100 */
  confidence: number;

  status: string;
  explanation: string;
}

/**
 * Shape of the full analysis result returned by /api/analyze.
 */
export interface AnalysisResult {
  beautyScore: number;
  faceShape: string;
  skinTone: string;
  undertone: string;
  eyeShape: string;
  lipShape: string;
  facialHarmony: string;
  confidence: number;
  recommendations: AnalysisRecommendations;
  glowUp: GlowUpPotential;
  impactImprovements: ImpactImprovement[];
  facialAnalysis: FacialAnalysisFeature[];
}
