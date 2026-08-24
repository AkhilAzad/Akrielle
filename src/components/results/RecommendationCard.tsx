"use client";

import { motion } from "framer-motion";
import type { RecommendationItem } from "@/types/results";
import { springSoft, staggerItem } from "@/components/animations/variants";

interface RecommendationCardProps {
  item: RecommendationItem;
}

export function RecommendationCard({ item }: RecommendationCardProps) {
  const Icon = item.icon;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={springSoft}
      className="flex flex-col gap-3 rounded-card-sm border border-line bg-paper p-6 shadow-subtle transition-shadow duration-500 hover:shadow-lift"
    >
      <motion.span
        whileHover={{ scale: 1.1, rotate: -6 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-soft text-gold-deep"
      >
        <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      </motion.span>

      <p className="eyebrow text-ink-faint">{item.category}</p>
      <p className="text-xl font-medium leading-snug tracking-tightest text-ink">{item.value}</p>
      <p className="text-[13px] leading-relaxed text-ink-muted">{item.reason}</p>
    </motion.div>
  );
}
