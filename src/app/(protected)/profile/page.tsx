"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, LogOut, Sparkles } from "lucide-react";

import { FlowHeader } from "@/components/layout/FlowHeader";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileHistoryCard } from "@/components/profile/ProfileHistoryCard";
import { PersonalDetailsCard } from "@/components/profile/PersonalDetailsCard";
import { AppearanceCard } from "@/components/profile/AppearanceCard";
import { PreferencesCard } from "@/components/profile/PreferencesCard";
import { PortfolioSection } from "@/components/profile/PortfolioSection";
import { AnalysisDetails } from "@/components/profile/AnalysisDetails";
import {
  staggerContainer,
  viewportOnce,
  easeSignature,
} from "@/components/animations/variants";

import { useAnalysisResult } from "@/contexts/AnalysisResultContext";
import { useAuth } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useImage } from "@/contexts/ImageContext";
import { useProfile } from "@/contexts/ProfileContext";
import type { AnalysisResult } from "@/types/analysis";
import type { SavedAnalysis } from "@/types/account";

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
  return (
    <RequireAuth>
      <ProfilePageContent />
    </RequireAuth>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const { result, restoring, setResult } = useAnalysisResult();
  const { status, user, configured, listHistory, signOut } = useAuth();
  const { imagePreviewUrl } = useImage();
  const { data: profile, avatarUrl } = useProfile();

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
  const hasAnalysis = latest !== null;

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

  // Hero stats — only meaningful when an analysis exists (else hidden).
  const roundedScore = latest ? Math.round(latest.beautyScore) : 0;
  const confidencePercent = latest ? Math.round(latest.confidence) : 0;
  const glowUpGain = latest
    ? Math.max(
        0,
        Math.round(
          latest.glowUp.potentialScore - latest.glowUp.currentAppearanceScore
        )
      )
    : 0;

  // Prefer the name saved on the profile; fall back to the account email,
  // then a neutral label for anonymous visitors.
  const profileName = profile.displayName.trim();
  const displayName = profileName || user?.email || "Your profile";

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
              title="Your profile."
              description="Your details, preferences, and analysis — all in one place."
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
            photoUrl={imagePreviewUrl ?? avatarUrl}
            email={user?.email ?? null}
            displayName={displayName}
            hasAnalysis={hasAnalysis}
            score={roundedScore}
            confidence={confidencePercent}
            scanDateLabel={scanDateLabel}
            glowUpGain={glowUpGain}
          />

          {/* Editable profile — personal details, appearance, preferences. */}
          <PersonalDetailsCard />
          <AppearanceCard />
          <PreferencesCard />

          {/* AI-derived analysis (only when a real scan exists). */}
          {latest && <AnalysisDetails latest={latest} />}

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

          {/* Uploads / portfolio. */}
          <PortfolioSection />

          {/* Actions. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: easeSignature }}
            className="flex flex-col items-center gap-4 border-t border-line pt-16 sm:flex-row sm:justify-center"
          >
            <Button href="/upload" size="lg" showArrow>
              {hasAnalysis ? "Run New Scan" : "Run your first scan"}
            </Button>
            {hasAnalysis && (
              <Button href="/results" variant="secondary" size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                View full analysis
              </Button>
            )}
          </motion.div>
        </Container>
      </main>
    </>
  );
}
