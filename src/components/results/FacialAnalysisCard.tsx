"use client";

import { motion } from "framer-motion";
import type { FacialAnalysisCardData } from "@/types/results";
import { easeSignature, springSoft, staggerItem } from "@/components/animations/variants";

interface FacialAnalysisCardProps {
  item: FacialAnalysisCardData;
}

export function FacialAnalysisCard({ item }: FacialAnalysisCardProps) {
  const Icon = item.icon;

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
          {item.confidence}% confidence
        </span>
      </div>

      <div>
        <p className="eyebrow text-ink-faint">{item.feature}</p>
        <p className="mt-1 text-2xl font-medium tracking-tightest text-ink">{item.status}</p>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full bg-gold"
          initial={{ width: 0 }}
          whileInView={{ width: `${item.confidence}%` }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, delay: 0.15, ease: easeSignature }}
        />
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">{item.explanation}</p>
    </motion.div>
  );
}
