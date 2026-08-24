"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { AnalysisVisual } from "@/components/analysis/AnalysisVisual";
import { ScanProgressBar } from "@/components/analysis/ScanProgressBar";
import { ScanStageList } from "@/components/analysis/ScanStageList";
import { useScanSequence } from "@/hooks/useScanSequence";
import { useImage } from "@/context/ImageContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAnalysisResult } from "@/context/AnalysisResultContext";
import type { AnalysisResult } from "@/context/AnalysisResultContext";
import { isPhotoErrorCode } from "@/types/analyze";
import type { AnalyzeErrorBody } from "@/types/analyze";
import {
  SCAN_MAX_DURATION_MS,
  SCAN_MIN_DURATION_MS,
  SCAN_STAGES,
} from "@/constants/analysis";

const easing = [0.22, 1, 0.36, 1] as const;
const stages = [...SCAN_STAGES];

type ApiStatus = "loading" | "success" | "error";

function ScanSequenceView({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const { completedCount, progress } = useScanSequence({
    stageCount: stages.length,
    minDurationMs: SCAN_MIN_DURATION_MS,
    maxDurationMs: SCAN_MAX_DURATION_MS,
    onComplete: onAnimationComplete,
  });

  const isDone = completedCount >= stages.length;
  const currentStage = stages[Math.min(completedCount, stages.length - 1)];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: easing }}
        className="mt-10"
      >
        <AnalysisVisual />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: easing }}
        className="mt-10 w-full max-w-[380px]"
      >
        <ScanProgressBar progress={progress} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: easing }}
        className="mt-6 w-full max-w-[380px] rounded-card-sm border border-line bg-surface/60 px-6 py-2"
      >
        <ScanStageList stages={stages} completedCount={completedCount} />
      </motion.div>

      <p className="sr-only" role="status" aria-live="polite">
        {isDone ? "Analysis complete." : `Current step: ${currentStage}`}
      </p>
    </>
  );
}

export default function AnalysisPage() {
  return (
    <RequireAuth>
      <AnalysisPageContent />
    </RequireAuth>
  );
}

function AnalysisPageContent() {
  const router = useRouter();
  const { image } = useImage();
  const { setResult } = useAnalysisResult();

  const [attempt, setAttempt] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("loading");
  const [errorInfo, setErrorInfo] = useState<AnalyzeErrorBody | null>(null);

  const resultRef = useRef<AnalysisResult | null>(null);
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!image) {
      router.replace("/upload");
    }
  }, [image, router]);

  useEffect(() => {
    if (!image) return;

    let cancelled = false;
    setApiStatus("loading");
    setErrorInfo(null);
    resultRef.current = null;

    const runAnalysis = async () => {
      try {
        const formData = new FormData();
        formData.append("image", image);

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          // Prefer the structured error the API returns so we can show a
          // specific message and decide whether retrying will help.
          let body: AnalyzeErrorBody | null = null;
          try {
            body = (await response.json()) as AnalyzeErrorBody;
          } catch {
            body = null;
          }

          if (cancelled) return;

          setErrorInfo(
            body?.code
              ? body
              : {
                  code: "analysis-failed",
                  error:
                    "Something went wrong while reading your photo. Please try again.",
                }
          );
          setApiStatus("error");
          return;
        }

        const data = await response.json();

        if (cancelled) return;

        resultRef.current = data as AnalysisResult;
        setApiStatus("success");
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setErrorInfo({
          code: "analysis-failed",
          error:
            "We couldn't reach the analysis service. Please check your connection and try again.",
        });
        setApiStatus("error");
      }
    };

    runAnalysis();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, attempt]);

  const handleAnimationComplete = useCallback(() => {
    setAnimationComplete(true);
  }, []);

  useEffect(() => {
    if (
      animationComplete &&
      apiStatus === "success" &&
      resultRef.current &&
      !navigatedRef.current
    ) {
      navigatedRef.current = true;
      setResult(resultRef.current);
      router.push("/results");
    }
  }, [animationComplete, apiStatus, setResult, router]);

  const handleRetry = useCallback(() => {
    navigatedRef.current = false;
    resultRef.current = null;
    setAnimationComplete(false);
    setAttempt((count) => count + 1);
  }, []);

  if (!image) {
    return null;
  }

  if (apiStatus === "error") {
    // Photo problems (no face, too large, etc.) won't be fixed by retrying
    // the same image, so we send the user back to choose another. Transient
    // problems (server/network) keep an in-place Retry.
    const photoIssue = errorInfo ? isPhotoErrorCode(errorInfo.code) : false;
    const title = photoIssue ? "Let's try a different photo." : "Analysis failed.";
    const description =
      errorInfo?.error ??
      "Something went wrong while reading your photo. Please try again.";

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
                eyebrow="Step 2 of 3"
                title={title}
                description={description}
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
              {photoIssue ? (
                <Button href="/upload" size="lg">
                  Upload a different photo
                </Button>
              ) : (
                <Button size="lg" onClick={handleRetry}>
                  Retry
                </Button>
              )}
            </motion.div>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <FlowHeader backHref="/upload" />

      <main className="py-16 md:py-24">
        <Container className="flex max-w-[560px] flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing }}
          >
            <SectionHeading
              eyebrow="Step 2 of 3"
              title="Reading your features."
              description="AXL is analyzing your photo. This takes just a few quiet moments."
              align="center"
              className="items-center"
            />
          </motion.div>

          <ScanSequenceView key={attempt} onAnimationComplete={handleAnimationComplete} />
        </Container>
      </main>
    </>
  );
}