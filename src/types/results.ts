import type { LucideIcon } from "lucide-react";

export interface BeautyProfileAttribute {
  id: string;
  icon: LucideIcon;
  label: string;
  value: string;
  /** 0–100 */
  confidence: number;
  explanation: string;
}

export interface RecommendationItem {
  id: string;
  icon: LucideIcon;
  category: string;
  value: string;
  reason: string;
}

export interface BeautyScoreBreakdownItem {
  id: string;
  label: string;
  /** 0–100 */
  value: number;
}

export interface BeautyScoreData {
  score: number;
  headline: string;
  description: string;
  breakdown: BeautyScoreBreakdownItem[];
}

export type ImprovementPriority = "High" | "Medium" | "Low";

/** Display shape for the Glow-Up Potential section. */
export interface GlowUpPotentialData {
  currentAppearanceScore: number;
  potentialScore: number;
  reason: string;
}

/** Display shape for a single card in Highest Impact Improvements. */
export interface ImpactImprovementCardData {
  id: string;
  icon: LucideIcon;
  rank: number;
  area: string;
  priority: ImprovementPriority;
  explanation: string;
  expectedImprovement: string;
}

/** Display shape for a single card in Complete Facial Analysis. */
export interface FacialAnalysisCardData {
  id: string;
  icon: LucideIcon;
  feature: string;
  /** 0–100 */
  confidence: number;
  status: string;
  explanation: string;
}
