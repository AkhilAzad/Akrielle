"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Loader2, BookmarkPlus, ArrowRight } from "lucide-react";

import { Button } from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";
import { useAnalysisResult } from "@/context/AnalysisResultContext";
import { useImage } from "@/context/ImageContext";
import { useProfile } from "@/context/ProfileContext";
import { downscaleToBlob } from "@/lib/media/image";
import { cn } from "@/lib/utils";

const easing = [0.22, 1, 0.36, 1] as const;
const SIGN_IN_HREF = `/signin?next=${encodeURIComponent("/results")}`;

/**
 * Self-contained banner shown on the results page. It quietly auto-saves a
 * fresh analysis to the signed-in user's history, and shows the appropriate
 * call to action:
 *  - anonymous → invite them to sign in to save (returns here afterward),
 *  - signed in → confirm it's saved, with a link to their history.
 *
 * The `persisted` flag on the analysis context prevents re-saving a result
 * that was re-opened from history, and survives navigation within the app so
 * a round trip to /report and back won't create a duplicate.
 */
export function SaveHistoryBanner() {
  const { status, configured, saveCurrentAnalysis } = useAuth();
  const { result, persisted, markPersisted } = useAnalysisResult();
  const { image } = useImage();
  const { data: profile, hydrated: profileHydrated } = useProfile();
  const savingRef = useRef(false);
  // Bumped after a transient save failure to re-trigger the effect and retry.
  const [attempt, setAttempt] = useState(0);

  // The opt-in decision. Gating the save on profileHydrated ensures this is the
  // user's settled preference (not the pre-hydration default), so it can't flip
  // mid-save and interrupt an in-flight upload.
  const savePhotos = profile.app.savePhotos;

  useEffect(() => {
    if (!configured || !result || persisted) return;
    if (status !== "signed-in") return;
    // Wait until the profile has loaded so the savePhotos preference is final.
    if (!profileHydrated) return;
    if (savingRef.current) return;
    savingRef.current = true;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      // Opt-in: attach the scan photo only when "save photos" is on and we
      // still hold the in-session image. A downscale hiccup must never block
      // the history save, so failures fall back to saving without the photo.
      let imageBlob: Blob | null = null;
      if (savePhotos && image) {
        try {
          imageBlob = await downscaleToBlob(image);
        } catch {
          imageBlob = null;
        }
      }
      if (cancelled) return;

      const saved = await saveCurrentAnalysis(result, { imageBlob });
      if (cancelled) return;
      savingRef.current = false;
      if (saved) {
        markPersisted();
      } else if (attempt < 3) {
        // Save failed (e.g. a token refresh was mid-flight). Back off and
        // retry a few times so a momentary blip doesn't silently drop the
        // save or leave the banner spinning forever.
        retryTimer = setTimeout(() => setAttempt((n) => n + 1), 4000);
      }
    })();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [
    configured,
    result,
    persisted,
    status,
    profileHydrated,
    savePhotos,
    image,
    saveCurrentAnalysis,
    markPersisted,
    attempt,
  ]);

  // Accounts disabled, nothing to save, or session still restoring.
  if (!configured || !result || status === "initializing") return null;

  const wrapper =
    "flex flex-col gap-3 rounded-card-sm border px-5 py-4 sm:flex-row sm:items-center sm:justify-between";

  if (status === "signed-in") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easing }}
        className={cn(wrapper, "border-line bg-surface")}
      >
        <div className="flex items-center gap-3">
          {persisted ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </span>
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            </span>
          )}
          <p className="text-sm text-ink">
            {persisted
              ? "Saved to your beauty history."
              : "Saving to your history…"}
          </p>
        </div>
        <Link
          href="/account"
          className="group inline-flex items-center gap-2 self-start text-sm font-medium text-accent transition-colors duration-300 hover:text-ink sm:self-auto"
        >
          View history
          <ArrowRight
            className="h-4 w-4 transition-transform duration-500 ease-signature group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </motion.div>
    );
  }

  // Anonymous visitor.
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easing }}
      className={cn(wrapper, "border-accent/30 bg-accent/5")}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-accent">
          <BookmarkPlus className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <p className="text-sm text-ink">
          Want to keep this? Sign in to save it to your history.
        </p>
      </div>
      <Button href={SIGN_IN_HREF} size="md" variant="primary" className="self-start sm:self-auto">
        Sign in to save
      </Button>
    </motion.div>
  );
}
