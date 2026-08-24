"use client";

import { motion } from "framer-motion";
import { springSoft } from "@/components/animations/variants";

interface ScanProgressBarProps {
  progress: number;
}

export function ScanProgressBar({ progress }: ScanProgressBarProps) {
  return (
    <div className="w-full">
      <div
        className="h-px w-full overflow-hidden bg-line"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Scan progress"
      >
        <motion.div
          className="h-full bg-gold-deep"
          animate={{ width: `${progress}%` }}
          transition={springSoft}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="eyebrow text-ink-faint">Analyzing</span>
        <motion.span
          key={Math.round(progress)}
          initial={{ opacity: 0.4, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-sm tabular-nums text-ink-muted"
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
}
