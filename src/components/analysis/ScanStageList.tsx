"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/utils/utils";
import { springSoft } from "@/components/animations/variants";

interface ScanStageListProps {
  stages: string[];
  completedCount: number;
}

export function ScanStageList({ stages, completedCount }: ScanStageListProps) {
  return (
    <ol className="flex flex-col">
      {stages.map((stage, index) => {
        const isComplete = index < completedCount;
        const isActive = index === completedCount;

        return (
          <motion.li
            key={stage}
            animate={{ opacity: isComplete ? 0.7 : 1, x: isActive ? 2 : 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 py-2.5"
          >
            <motion.span
              animate={{ scale: isComplete ? 1 : isActive ? 1.1 : 1 }}
              transition={springSoft}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-500",
                isComplete
                  ? "border-success/60 bg-success/10 text-success"
                  : isActive
                  ? "border-gold-deep text-gold-deep"
                  : "border-line"
              )}
            >
              {isComplete ? (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={springSoft}
                >
                  <Check className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
                </motion.span>
              ) : isActive ? (
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-gold-deep"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden="true"
                />
              ) : null}
            </motion.span>

            <span
              className={cn(
                "font-body text-[15px] transition-colors duration-500",
                isComplete ? "text-ink-muted" : isActive ? "text-ink" : "text-ink-faint"
              )}
            >
              {stage}
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}
