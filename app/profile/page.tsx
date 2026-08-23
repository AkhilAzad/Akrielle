"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ScanFace,
  Palette,
  Droplet,
  Scale,
  Layers,
  Scissors,
  Leaf,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react";

import { FlowHeader } from "@/components/layout/FlowHeader";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { ProfileCard } from "@/components/results/ProfileCard";
import { ImpactImprovementList } from "@/components/results/ImpactImprovementList";
import { RecommendationGrid } from "@/components/results/RecommendationGrid";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileHistoryCard } from "@/components/profile/ProfileHistoryCard";
import {
  staggerContainer,
  viewportOnce,
  easeSignature,
} from "@/components/animations/variants";
import { getImpactAreaIcon } from "@/utils/resultIcons";

import { useAnalysisResult } from "@/context/AnalysisResultContext";
import { useAuth } from "@/context/AuthContext";
import { useImage } from "@/context/ImageContext";
import type { AnalysisResult } from "@/context/AnalysisResultContext";
import type { SavedAnalysis } from "@/types/account";
import type {
  BeautyProfileAttribute,
  ImpactImprovementCardData,
  RecommendationItem,
} from "@/types/results";

/**
 * Two analyses are treated as the "same scan" when their headline readings
 * line up. Used only to decide whether the in-session result already exists
 * in saved history — so we can label the latest scan with its real saved
 * date instead of a fabricated one.
 */
function isSameScan(a: AnalysisResult, b: AnalysisResult): boolean {
  return (
    Math.round(a.beautyScore) === Math.round(b.beautyScore) &&
    a.faceShape === b.faceShape &&
    a.skinTone === b.skinTone &&
    a.undertone === b.undertone
  );
}

function formatScanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { result, restoring, setResult } = useAnalysisResult();
  const { status, user, configured, listHistory, signOut } = useAuth();
  const { imagePreviewUrl } = useImage();

  // Whether we should attempt to load saved history at all.
  const canLoadHistory = configured && status === "signed-in";

  // null = still loading; [] = loaded and empty.
  const [history, setHistory] = useState<SavedAnalysis[] | null>(
    canLoadHistory ? null : []
  );

  useEffect(() => {
    if (!canLoadHistory) {
      setHistory([]);
      return;
    }
    let active = true;
    setHistory(null);
    void listHistory().then((rows) => {
      if (active) setHistory(rows);
    });
    return () => {
      active = false;
    };
  }, [canLoadHistory, listHistory]);

  const newestSaved = useMemo<SavedAnalysis | null>(
    () => (history && history.length > 0 ? history[0] : null),
    [history]
  );

  // The latest analysis: prefer the live in-session result, otherwise fall
  // back to the newest saved scan (e.g. after a refresh for a signed-in user).
  const latest: AnalysisResult | null = result ?? newestSaved?.result ?? null;

  // A real date for the latest scan, when we can attribute one honestly.
  const scanDateLabel = useMemo<string>(() => {
    if (result && newestSaved && isSameScan(result, newestSaved.result)) {
      return formatScanDate(newestSaved.createdAt);
    }
    if (!result && newestSaved) {
      return formatScanDate(newestSaved.createdAt);
    }
    // In-session result that isn't (yet) in saved history — no stored date.
    return "This session";
  }, [result, newestSaved]);

  // We're still settling if the analysis is being restored, auth is
  // initializing, or history is mid-fetch for a signed-in user.
  const settling =
    restoring || status === "initializing" || (canLoadHistory && history === null);

  const handleViewSaved = (item: SavedAnalysis) => {
    // Already the user's own saved scan — mark persisted so the results page
    // (and its save banner) won't create a duplicate.
    setResult(item.result, { persisted: true });
    router.push("/results");
  };

  // ---- Loading ------------------------------------------------------------
  if (settling) {
    return (
      <>
        <FlowHeader backHref="/" />
        <main className="py-24 md:py-32">
          <Container className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold-deep" aria-hidden="true" />
            <p className="font-body text-[15px] text-ink-muted">Loading your profile…</p>
          </Container>
        </main>
      </>
    );
  }

  // ---- Empty (no analysis anywhere) --------------------------------------
  if (!latest) {
    return (
      <>
        <FlowHeader backHref="/" />
        <main className="py-16 md:py-24">
          <Container className="flex max-w-[720px] flex-col">
            <SectionHeading
              eyebrow="Your profile"
              title="Your beauty profile."
              description={
                user?.email
                  ? `Signed in as ${user.email}.`
                  : "Your latest analysis and saved scans live here."
              }
            />
            <div className="mt-12 flex flex-col items-center gap-6 rounded-card border border-dashed border-line bg-surface/60 py-16 text-center">
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-2xl text-ink">No analysis yet.</h2>
                <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-ink-muted">
                  Run your first beauty scan and your profile will fill in
                  automatically — no data is invented here.
                </p>
              </div>
              <Button href="/upload" size="lg" showArrow>
                Run your first scan
              </Button>
            </div>
          </Container>
        </main>
      </>
    );
  }

  // ---- Derived display data (all from `latest`) --------------------------
  const confidencePercent = Math.round(latest.confidence);
  const roundedScore = Math.round(latest.beautyScore);
  const glowUpGain = Math.max(
    0,
    Math.round(latest.glowUp.potentialScore - latest.glowUp.currentAppearanceScore)
  );

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
      explanation: `Alkline reads your face shape as ${latest.faceShape.toLowerCase()}.`,
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

  const displayName = user?.email ?? "Your beauty profile";

  return (
    <>
      <FlowHeader backHref="/" />

      <main className="py-14 md:py-20">
        <Container className="flex flex-col gap-16 md:gap-24">
          {/* Header + sign-out (when signed in). */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeSignature }}
            className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
          >
            <SectionHeading
              eyebrow="Your profile"
              title="Your beauty profile."
              description="Your latest analysis, key readings, and saved scans — all in one place."
            />
            {configured && status === "signed-in" && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="group inline-flex shrink-0 items-center gap-2 self-start text-sm text-ink-muted transition-colors duration-300 hover:text-ink focus-visible:outline-none sm:self-auto"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                Sign out
              </button>
            )}
          </motion.div>

          {/* Premium summary hero. */}
          <ProfileHero
            photoUrl={imagePreviewUrl}
            email={user?.email ?? null}
            displayName={displayName}
            score={roundedScore}
            confidence={confidencePercent}
            scanDateLabel={scanDateLabel}
            glowUpGain={glowUpGain}
          />

          {/* Key readings. */}
          <section aria-labelledby="profile-readings-heading">
            <SectionHeading
              eyebrow="Key readings"
              title="What Alkline detected."
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
                description="Your highest-impact areas, ranked from what Alkline actually sees in your photo."
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

          {/* Scan history. */}
          <section aria-labelledby="profile-history-heading">
            <SectionHeading
              eyebrow="Scan history"
              title="Your saved scans."
              description="Revisit any past analysis exactly as it was generated."
            />

            <div className="mt-12">
              {!configured ? (
                <div className="rounded-card border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
                  <p className="mx-auto max-w-md text-[15px] leading-relaxed text-ink-muted">
                    Your saved scans appear here once accounts are enabled and
                    you&apos;re signed in.
                  </p>
                </div>
              ) : status !== "signed-in" ? (
                <div className="flex flex-col items-center gap-6 rounded-card border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
                  <p className="mx-auto max-w-md text-[15px] leading-relaxed text-ink-muted">
                    Sign in to save your scans and revisit them anytime.
                  </p>
                  <Button
                    href={`/signin?next=${encodeURIComponent("/profile")}`}
                    size="lg"
                    variant="secondary"
                  >
                    Sign in
                  </Button>
                </div>
              ) : history && history.length > 0 ? (
                <motion.ul
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  variants={staggerContainer(0.06)}
                  className="flex flex-col gap-4"
                >
                  {history.map((item) => (
                    <ProfileHistoryCard
                      key={item.id}
                      item={item}
                      onView={() => handleViewSaved(item)}
                    />
                  ))}
                </motion.ul>
              ) : (
                <div className="flex flex-col items-center gap-6 rounded-card border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
                  <p className="mx-auto max-w-md text-[15px] leading-relaxed text-ink-muted">
                    No saved scans yet. Run a scan and it&apos;ll be saved here
                    automatically.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Actions. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: easeSignature }}
            className="flex flex-col items-center gap-4 border-t border-line pt-16 sm:flex-row sm:justify-center"
          >
            <Button href="/upload" size="lg" showArrow>
              Run New Scan
            </Button>
            <Button href="/results" variant="secondary" size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
              View full analysis
            </Button>
          </motion.div>
        </Container>
      </main>
    </>
  );
}
