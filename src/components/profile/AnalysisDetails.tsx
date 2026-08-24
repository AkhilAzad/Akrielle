"use client";

import { motion } from "framer-motion";
import { ScanFace, Palette, Droplet, Scale, Layers, Scissors, Leaf } from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { ProfileCard } from "@/components/results/ProfileCard";
import { ImpactImprovementList } from "@/components/results/ImpactImprovementList";
import { RecommendationGrid } from "@/components/results/RecommendationGrid";
import { staggerContainer, viewportOnce } from "@/components/animations/variants";
import { getImpactAreaIcon } from "@/utils/resultIcons";

import type { AnalysisResult } from "@/types/analysis";
import type {
  BeautyProfileAttribute,
  ImpactImprovementCardData,
  RecommendationItem,
} from "@/types/results";

interface AnalysisDetailsProps {
  /** The analysis to render. Only mounted by the page when this exists. */
  latest: AnalysisResult;
}

/**
 * The AI-derived portion of the profile dashboard: key readings, top
 * observations, and a curated handful of recommendations. Extracted from the
 * profile page so the page can always render the dashboard shell and simply
 * drop this block in when a real analysis is available.
 *
 * Every value is read straight from `latest` — nothing here is fabricated.
 */
export function AnalysisDetails({ latest }: AnalysisDetailsProps) {
  const confidencePercent = Math.round(latest.confidence);

  // "Symmetry" is a real reading: the Eye Symmetry feature from the facial
  // analysis. If it's missing, fall back to the overall facial-harmony field.
  const symmetryFeature = latest.facialAnalysis.find((f) =>
    /symmetry/i.test(f.feature)
  );
  const symmetryValue = symmetryFeature?.status ?? latest.facialHarmony;
  const symmetryConfidence = symmetryFeature
    ? Math.round(symmetryFeature.confidence)
    : confidencePercent;
  const symmetryExplanation =
    symmetryFeature?.explanation ??
    `Overall facial harmony reads as ${latest.facialHarmony.toLowerCase()}.`;

  const summaryAttributes: BeautyProfileAttribute[] = [
    {
      id: "face-shape",
      icon: ScanFace,
      label: "Face Shape",
      value: latest.faceShape,
      confidence: confidencePercent,
      explanation: `AXL reads your face shape as ${latest.faceShape.toLowerCase()}.`,
    },
    {
      id: "skin-tone",
      icon: Palette,
      label: "Skin Tone",
      value: latest.skinTone,
      confidence: confidencePercent,
      explanation: `Your complexion reads as ${latest.skinTone.toLowerCase()} overall.`,
    },
    {
      id: "undertone",
      icon: Droplet,
      label: "Undertone",
      value: latest.undertone,
      confidence: confidencePercent,
      explanation: `A ${latest.undertone.toLowerCase()} undertone was detected beneath the surface tone.`,
    },
    {
      id: "symmetry",
      icon: Scale,
      label: "Symmetry",
      value: symmetryValue,
      confidence: symmetryConfidence,
      explanation: symmetryExplanation,
    },
  ];

  const observations: ImpactImprovementCardData[] = latest.impactImprovements
    .slice(0, 3)
    .map((item, index) => ({
      id: `obs-${index}-${item.area}`,
      icon: getImpactAreaIcon(item.area),
      rank: index + 1,
      area: item.area,
      priority: item.priority,
      explanation: item.explanation,
      expectedImprovement: item.expectedImprovement,
    }));

  const recommendations: RecommendationItem[] = [
    {
      id: "foundation",
      icon: Layers,
      category: "Foundation",
      value: latest.recommendations.foundation,
      reason: `Complements your ${latest.skinTone.toLowerCase()} skin tone and ${latest.undertone.toLowerCase()} undertone.`,
    },
    {
      id: "lipstick",
      icon: Droplet,
      category: "Lipstick",
      value: latest.recommendations.lipstick,
      reason: `Suited to your ${latest.undertone.toLowerCase()} undertone.`,
    },
    {
      id: "hairstyle",
      icon: Scissors,
      category: "Hairstyle",
      value: latest.recommendations.hairstyle,
      reason: `Frames your ${latest.faceShape.toLowerCase()} face shape at its most flattering angles.`,
    },
    {
      id: "skincare",
      icon: Leaf,
      category: "Skincare Focus",
      value: latest.recommendations.skincare,
      reason: "Supports your skin's natural balance and evenness over time.",
    },
  ];

  return (
    <>
      {/* Key readings. */}
      <section aria-labelledby="profile-readings-heading">
        <SectionHeading
          eyebrow="Key readings"
          title="What AXL detected."
          description="The core of your beauty profile, each with its own confidence level."
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer(0.07)}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {summaryAttributes.map((attribute) => (
            <ProfileCard key={attribute.id} attribute={attribute} />
          ))}
        </motion.div>
      </section>

      {/* Observations. */}
      {observations.length > 0 && (
        <section aria-labelledby="profile-observations-heading">
          <SectionHeading
            eyebrow="Observations"
            title="Where to focus first."
            description="Your highest-impact areas, ranked from what AXL actually sees in your photo."
          />
          <div className="mt-12">
            <ImpactImprovementList items={observations} />
          </div>
        </section>
      )}

      {/* Recommendations. */}
      <section aria-labelledby="profile-recommendations-heading">
        <SectionHeading
          eyebrow="Recommendations"
          title="Curated for your features."
          description="A few suggestions grounded in your profile — see the full analysis for the complete set."
        />
        <div className="mt-12">
          <RecommendationGrid items={recommendations} />
        </div>
      </section>
    </>
  );
}
