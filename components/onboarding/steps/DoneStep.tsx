"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { Button } from "@/components/common/Button";

interface DoneStepProps {
  /** Personalized greeting name, if the user provided one. */
  displayName?: string | null;
  /** Enter the main app (→ the scan flow). */
  onEnter: () => void;
}

/**
 * Terminal step — a brief confirmation before handing off to the scan flow.
 * The name is optional; without it the copy stays warm but generic.
 */
export function DoneStep({ displayName, onEnter }: DoneStepProps) {
  const name = displayName?.trim();

  return (
    <div className="flex flex-col items-center text-center">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white"
      >
        <Check className="h-8 w-8" strokeWidth={2.2} aria-hidden="true" />
      </motion.span>

      <h2 className="mt-8 max-w-md text-4xl font-medium leading-[1.05] tracking-tightest md:text-5xl">
        {name ? `You're all set, ${name}.` : "You're all set."}
      </h2>
      <p className="mt-4 max-w-md font-body text-[0.95rem] leading-relaxed text-ink-muted">
        Your profile is ready. Take your first scan to see your personalized
        beauty analysis.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4">
        <Button size="lg" showArrow onClick={onEnter}>
          Start your scan
        </Button>
        <Button href="/" variant="ghost">
          Go to home
        </Button>
      </div>
    </div>
  );
}
