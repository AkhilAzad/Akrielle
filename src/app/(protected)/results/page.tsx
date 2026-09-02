"use client";

import { motion } from "framer-motion";
import {
  Download,
  ScanFace,
  Palette,
  Droplet,
  Eye,
  Smile,
  Aperture,
  Layers,
  Heart,
  Sparkles,
  Scissors,
  Gem,
  Leaf,
} from "lucide-react";

import { FlowHeader } from "@/components/layout/FlowHeader";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { BeautyScoreCard } from "@/components/results/BeautyScoreCard";
import { ProfileGrid } from "@/components/results/ProfileGrid";
import { RecommendationGrid } from "@/components/results/RecommendationGrid";
import { GlowUpPotentialCard } from "@/components/results/GlowUpPotentialCard";
import { ImpactImprovementList } from "@/components/results/ImpactImprovementList";
import { FacialAnalysisGrid } from "@/components/results/FacialAnalysisGrid";
import { SaveHistoryBanner } from "@/components/account/SaveHistoryBanner";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAnalysisResult } from "@/contexts/AnalysisResultContext";
import { getFacialFeatureIcon, getImpactAreaIcon } from "@/utils/resultIcons";
import { buildScoreRationale } from "@/backend/ai/scoring";

import type {
  BeautyProfileAttribute,
  BeautyScoreData,
  FacialAnalysisCardData,
  GlowUpPotentialData,
  ImpactImprovementCardData,
  RecommendationItem,
} from "@/types/results";

const easing = [0.22, 1, 0.36, 1] as const;

export default function ResultsPage() {
  return (
    <RequireAuth>
      <ResultsPageContent />
    </RequireAuth>
  );
}

function ResultsPageContent() {
  const { result, restoring } = useAnalysisResult();

  /*
   * IMPORTANT:
   *
   * On a fresh page load, the provider starts with result === null.
   * sessionStorage is restored after the browser mounts.
   *
   * Therefore we MUST NOT show "No analysis available" until restoring
   * has finished.
   */
  if (restoring) {
    return (
      <>
        <FlowHeader backHref="/upload" />

        <main className="py-16 md:py-24">
          <Container className="flex max-w-[480px] flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing }}
              className="flex flex-col items-center"
            >
              <SectionHeading
                eyebrow="Step 3 of 3"
                title="Preparing your results."
                description="Restoring your completed beauty analysis."
                align="center"
                className="items-center"
              />
            </motion.div>
          </Container>
        </main>
      </>
    );
  }

  /*
   * Only show the empty state AFTER restoration has completed.
   */
  if (!result) {
    return (
      <>
        <FlowHeader backHref="/upload" />

        <main className="py-16 md:py-24">
          <Container className="flex max-w-[480px] flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing }}
              className="flex flex-col items-center"
            >
              <SectionHeading
                eyebrow="Step 3 of 3"
                title="No analysis available."
                description="We couldn't find a completed beauty analysis for this session. Upload a photo to get started."
                align="center"
                className="items-center"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: easing }}
              className="mt-10"
            >
              <Button href="/upload" size="lg">
                Upload a Photo
              </Button>
            </motion.div>
          </Container>
        </main>
      </>
    );
  }

  const confidencePercent = Math.round(result.confidence);
  const roundedScore = Math.round(result.beautyScore);

  const beautyScore: BeautyScoreData = {
    score: roundedScore,
    headline: "Beauty Harmony Score",
    description: buildScoreRationale(result),
    breakdown: [
      {
        id: "beauty-score",
        label: "Beauty Score",
        value: roundedScore,
      },
      {
        id: "confidence",
        label: "AI Confidence",
        value: confidencePercent,
      },
    ],
  };

  const beautyProfileAttributes: BeautyProfileAttribute[] = [
    {
      id: "face-shape",
      icon: ScanFace,
      label: "Face Shape",
      value: result.faceShape,
      confidence: confidencePercent,
      explanation: `AXL reads your face shape as ${result.faceShape.toLowerCase()}.`,
    },
    {
      id: "skin-tone",
      icon: Palette,
      label: "Skin Tone",
      value: result.skinTone,
      confidence: confidencePercent,
      explanation: `Your complexion reads as ${result.skinTone.toLowerCase()} overall.`,
    },
    {
      id: "undertone",
      icon: Droplet,
      label: "Undertone",
      value: result.undertone,
      confidence: confidencePercent,
      explanation: `A ${result.undertone.toLowerCase()} undertone was detected beneath the surface tone.`,
    },
    {
      id: "eye-shape",
      icon: Eye,
      label: "Eye Shape",
      value: result.eyeShape,
      confidence: confidencePercent,
      explanation: `Your eyes read as ${result.eyeShape.toLowerCase()} in shape.`,
    },
    {
      id: "lip-shape",
      icon: Smile,
      label: "Lip Shape",
      value: result.lipShape,
      confidence: confidencePercent,
      explanation: `Your lips read as ${result.lipShape.toLowerCase()}.`,
    },
    {
      id: "facial-harmony",
      icon: Aperture,
      label: "Facial Harmony",
      value: result.facialHarmony,
      confidence: confidencePercent,
      explanation: `Overall facial harmony reads as ${result.facialHarmony.toLowerCase()}.`,
    },
  ];

  const recommendations: RecommendationItem[] = [
    {
      id: "foundation",
      icon: Layers,
      category: "Foundation",
      value: result.recommendations.foundation,
      reason: `Complements your ${result.skinTone.toLowerCase()} skin tone and ${result.undertone.toLowerCase()} undertone.`,
    },
    {
      id: "lipstick",
      icon: Droplet,
      category: "Lipstick",
      value: result.recommendations.lipstick,
      reason: `Suited to your ${result.undertone.toLowerCase()} undertone and ${result.lipShape.toLowerCase()} lip shape.`,
    },
    {
      id: "blush",
      icon: Heart,
      category: "Blush",
      value: result.recommendations.blush,
      reason: `Follows the natural contour of your ${result.faceShape.toLowerCase()} face shape.`,
    },
    {
      id: "eyeshadow",
      icon: Eye,
      category: "Eyeshadow",
      value: result.recommendations.eyeshadow,
      reason: `Complements your ${result.eyeShape.toLowerCase()} eye shape and ${result.undertone.toLowerCase()} undertone.`,
    },
    {
      id: "highlighter",
      icon: Sparkles,
      category: "Highlighter",
      value: result.recommendations.highlighter,
      reason: `Enhances your ${result.skinTone.toLowerCase()} skin tone naturally.`,
    },
    {
      id: "hairstyle",
      icon: Scissors,
      category: "Hairstyle",
      value: result.recommendations.hairstyle,
      reason: `Frames your ${result.faceShape.toLowerCase()} face shape at its most flattering angles.`,
    },
    {
      id: "accessories",
      icon: Gem,
      category: "Accessories",
      value: result.recommendations.accessories,
      reason: `Selected to align with your ${result.undertone.toLowerCase()} undertone.`,
    },
    {
      id: "skincare",
      icon: Leaf,
      category: "Skincare Focus",
      value: result.recommendations.skincare,
      reason: `Supports your skin's natural balance and evenness over time.`,
    },
  ];

  const glowUp: GlowUpPotentialData = {
    currentAppearanceScore: Math.round(
      result.glowUp.currentAppearanceScore
    ),
    potentialScore: Math.round(result.glowUp.potentialScore),
    reason: result.glowUp.reason,
  };

  const impactImprovements: ImpactImprovementCardData[] =
    result.impactImprovements.map((item, index) => ({
      id: `impact-${index}-${item.area}`,
      icon: getImpactAreaIcon(item.area),
      rank: index + 1,
      area: item.area,
      priority: item.priority,
      explanation: item.explanation,
      expectedImprovement: item.expectedImprovement,
    }));

  const facialAnalysis: FacialAnalysisCardData[] =
    result.facialAnalysis.map((item, index) => ({
      id: `facial-${index}-${item.feature}`,
      icon: getFacialFeatureIcon(item.feature),
      feature: item.feature,
      confidence: Math.round(item.confidence),
      status: item.status,
      explanation: item.explanation,
    }));

  return (
    <>
      <FlowHeader backHref="/upload" />

      <main className="py-16 md:py-24">
        <Container className="flex flex-col gap-20 md:gap-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing }}
            className="flex flex-col items-center"
          >
            <SectionHeading
              eyebrow="Step 3 of 3"
              title="Your Beauty Profile."
              description="Here is what AXL discovered about your unique features — and what genuinely suits them."
              align="center"
              className="items-center"
            />
          </motion.div>

          <SaveHistoryBanner />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easing }}
          >
            <BeautyScoreCard data={beautyScore} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easing }}
          >
            <GlowUpPotentialCard data={glowUp} />
          </motion.div>

          <section aria-labelledby="beauty-profile-heading">
            <SectionHeading
              eyebrow="Beauty Profile"
              title="What AXL detected."
              description="Six readings from your photo, each with its own confidence level."
            />

            <div className="mt-12">
              <ProfileGrid attributes={beautyProfileAttributes} />
            </div>
          </section>

          {facialAnalysis.length > 0 && (
            <section aria-labelledby="facial-analysis-heading">
              <SectionHeading
                eyebrow="Complete Facial Analysis"
                title="Every feature, read in detail."
                description={`${facialAnalysis.length} individual ${
                  facialAnalysis.length === 1
                    ? "reading"
                    : "readings"
                }, each with its own confidence level and status.`}
              />

              <div className="mt-12">
                <FacialAnalysisGrid items={facialAnalysis} />
              </div>
            </section>
          )}

          {impactImprovements.length > 0 && (
            <section aria-labelledby="impact-improvements-heading">
              <SectionHeading
                eyebrow="Highest Impact Improvements"
                title="Where to focus first."
                description="Ranked from highest to lowest impact, based on what AXL actually sees in your photo."
              />

              <div className="mt-12">
                <ImpactImprovementList
                  items={impactImprovements}
                />
              </div>
            </section>
          )}

          <section aria-labelledby="recommendations-heading">
            <SectionHeading
              eyebrow="Recommendations"
              title="Curated for your features."
              description="Every suggestion below is grounded in the profile above — never a trend, always a fit."
            />

            <div className="mt-12">
              <RecommendationGrid items={recommendations} />
            </div>
          </section>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: easing }}
            className="flex flex-col items-center gap-4 border-t border-line pt-16 sm:flex-row sm:justify-center"
          >
            <Button href="/report" size="lg" className="gap-2">
              <Download
                className="h-4 w-4"
                strokeWidth={1.6}
                aria-hidden="true"
              />
              Download Beauty Report
            </Button>

            <Button
              href="/upload"
              variant="secondary"
              size="lg"
            >
              Analyze Another Photo
            </Button>

            <Button href="/" variant="ghost" size="lg">
              Back Home
            </Button>
          </motion.div>
        </Container>
      </main>
    </>
  );
}