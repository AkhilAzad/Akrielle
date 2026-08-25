"use client";

import { motion } from "framer-motion";
import { Calendar, TrendingUp, UserRound } from "lucide-react";
import { easeSignature } from "@/components/animations/variants";
import { Button } from "@/components/common/Button";

interface ProfileHeroProps {
  /** In-session preview URL for the current photo, or null if unavailable. */
  photoUrl: string | null;
  /** The user's email when signed in, used for the avatar initial + identity. */
  email: string | null;
  /** Heading shown beside the avatar. */
  displayName: string;
  /** Whether a real analysis exists to show a score/confidence for. */
  hasAnalysis: boolean;
  /** Latest overall score, already rounded (0–100). Only shown when hasAnalysis. */
  score: number;
  /** AI confidence for the latest scan, already rounded (0–100). */
  confidence: number;
  /** Human-readable date of the latest scan (e.g. "August 24, 2026" or "This session"). */
  scanDateLabel: string;
  /** Realistic headroom = potential − current, already rounded (>= 0). */
  glowUpGain: number;
}

/**
 * The premium header for the Profile page — a dark charcoal panel in the
 * established AXL "stats panel" archetype (see GlowUpPotentialCard):
 * radial accent glow, eyebrow-on-dark, ivory type, and an accent score ring.
 *
 * Every value shown here is derived from the real latest analysis + the
 * signed-in user; nothing is fabricated. When no photo is available for the
 * session, a graceful avatar fallback (email initial, else a person glyph)
 * is shown instead of inventing an image. When there's no analysis yet, the
 * score ring gives way to a "run your first scan" call to action rather than
 * showing an empty or invented reading.
 */
export function ProfileHero({
  photoUrl,
  email,
  displayName,
  hasAnalysis,
  score,
  confidence,
  scanDateLabel,
  glowUpGain,
}: ProfileHeroProps) {
  const initial = email ? email.trim().charAt(0).toUpperCase() : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: easeSignature }}
      className="relative overflow-hidden rounded-card bg-charcoal px-7 py-10 text-ivory shadow-card sm:px-10 md:px-14 md:py-14"
    >
      {/* Soft crimson bloom, mirrored from the results stats panel. */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] translate-x-1/3 -translate-y-1/3 rounded-full opacity-[0.22] blur-3xl"
        style={{ background: "radial-gradient(circle, #DE1F35 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-12">
        {/* Identity — avatar + name + latest scan date. */}
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5 sm:h-24 sm:w-24">
            {photoUrl ? (
              // Blob/object URL from ImageContext — plain img keeps it simple
              // and avoids next/image blob-URL configuration.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Your uploaded photo"
                className="h-full w-full object-cover"
              />
            ) : initial ? (
              <span className="font-display text-3xl font-medium tracking-tightest text-ivory">
                {initial}
              </span>
            ) : (
              <UserRound
                className="h-8 w-8 text-ivory-faint"
                strokeWidth={1.4}
                aria-hidden="true"
              />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <span className="eyebrow eyebrow-on-dark">
              <span className="eyebrow-dot" aria-hidden="true" />
              Profile
            </span>
            <h1 className="truncate text-2xl font-medium tracking-tightest text-ivory md:text-3xl">
              {displayName}
            </h1>
            {hasAnalysis ? (
              <span className="inline-flex items-center gap-2 text-sm text-ivory-muted">
                <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                Latest scan · {scanDateLabel}
              </span>
            ) : (
              <span className="text-sm text-ivory-muted">
                No analysis yet — run your first scan to build your profile.
              </span>
            )}
          </div>
        </div>

        {/* Latest overall score — accent ring, matching the results panel.
            Falls back to a first-scan CTA when there's no analysis yet. */}
        {hasAnalysis ? (
          <div className="flex shrink-0 items-center gap-6 md:flex-col md:items-end md:gap-4">
            <div className="flex flex-col items-center gap-3 md:items-end">
              <div
                className="relative flex h-[min(120px,30vw)] w-[min(120px,30vw)] items-center justify-center rounded-full border border-accent/50"
                role="img"
                aria-label={`Overall score: ${score} out of 100`}
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-full opacity-40 blur-md"
                  style={{ background: "radial-gradient(circle, #DE1F35 0%, transparent 72%)" }}
                  aria-hidden="true"
                />
                <span className="relative flex items-baseline gap-0.5 text-accent-from">
                  <span className="text-4xl font-medium tracking-tightest">{score}</span>
                  <span className="text-sm text-ivory-faint">/100</span>
                </span>
              </div>
              <span className="eyebrow text-accent-from">Overall score</span>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <span className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-ivory">
                AI confidence {confidence}%
              </span>
              {glowUpGain > 0 && (
                <span className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-ivory">
                  <TrendingUp
                    className="h-3.5 w-3.5 text-accent-from"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                  +{glowUpGain} point{glowUpGain === 1 ? "" : "s"} of headroom
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            <Button href="/upload" variant="gold" size="lg" showArrow>
              Run your first scan
            </Button>
            <span className="text-xs text-ivory-faint">
              One photo — a private facial analysis.
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
