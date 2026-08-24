"use client";

import { useEffect, useRef, useState } from "react";
import {
  SCAN_COMPLETION_PAUSE_MS,
  SCAN_MAX_DURATION_MS,
  SCAN_MIN_DURATION_MS,
} from "@/constants/analysis";

interface UseScanSequenceOptions {
  stageCount: number;
  minDurationMs?: number;
  maxDurationMs?: number;
  onComplete: () => void;
}

interface ScanSequenceState {
  /** Number of stages that have finished. The stage at this index (if any) is the active one. */
  completedCount: number;
  /** 0–100 */
  progress: number;
}

/**
 * Drives a mocked, sequential analysis timeline. No real AI runs here —
 * this only orchestrates timing so the UI can feel like a genuine,
 * unhurried analysis rather than a fixed spinner.
 */
export function useScanSequence({
  stageCount,
  minDurationMs = SCAN_MIN_DURATION_MS,
  maxDurationMs = SCAN_MAX_DURATION_MS,
  onComplete,
}: UseScanSequenceOptions): ScanSequenceState {
  const [completedCount, setCompletedCount] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const totalDuration =
      minDurationMs + Math.random() * (maxDurationMs - minDurationMs);
    const baseStageDuration = totalDuration / stageCount;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    for (let i = 0; i < stageCount; i += 1) {
      // organic per-stage variance so the pacing doesn't feel mechanical
      const variance = 0.75 + Math.random() * 0.5;
      elapsed += baseStageDuration * variance;

      const stageTimeout = setTimeout(() => {
        setCompletedCount(i + 1);
        if (i === stageCount - 1) {
          const finalTimeout = setTimeout(
            () => onCompleteRef.current(),
            SCAN_COMPLETION_PAUSE_MS
          );
          timeouts.push(finalTimeout);
        }
      }, elapsed);

      timeouts.push(stageTimeout);
    }

    return () => timeouts.forEach(clearTimeout);
    // Sequence is intentionally computed once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageCount, minDurationMs, maxDurationMs]);

  return {
    completedCount,
    progress: Math.min(100, (completedCount / stageCount) * 100),
  };
}
