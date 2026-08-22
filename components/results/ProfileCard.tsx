"use client";

import { motion } from "framer-motion";
import type { BeautyProfileAttribute } from "@/types/results";
import { springSoft, staggerItem } from "@/components/animations/variants";

interface ProfileCardProps {
  attribute: BeautyProfileAttribute;
}

export function ProfileCard({ attribute }: ProfileCardProps) {
  const Icon = attribute.icon;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={springSoft}
      className="flex flex-col gap-5 rounded-card-sm border border-line bg-surface p-7 shadow-subtle transition-shadow duration-500 hover:shadow-lift"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-gold-deep">
          <Icon className="h-5 w-5" strokeWidth={1.4} aria-hidden="true" />
        </span>
        <span className="eyebrow rounded-full border border-line px-2.5 py-1 text-ink-faint">
          {attribute.confidence}% match
        </span>
      </div>

      <div>
        <p className="eyebrow text-ink-faint">{attribute.label}</p>
        <p className="mt-1 text-2xl font-medium tracking-tightest text-ink">{attribute.value}</p>
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">{attribute.explanation}</p>
    </motion.div>
  );
}
