"use client";

import { motion } from "framer-motion";
import type { ImpactImprovementCardData } from "@/types/results";
import { springSoft, staggerItem } from "@/components/animations/variants";

interface ImpactImprovementCardProps {
  item: ImpactImprovementCardData;
}

const priorityStyles: Record<ImpactImprovementCardData["priority"], string> = {
  High: "border-gold/40 bg-gold/10 text-gold-deep",
  Medium: "border-line bg-surface text-ink-muted",
  Low: "border-line bg-surface text-ink-faint",
};

export function ImpactImprovementCard({ item }: ImpactImprovementCardProps) {
  const Icon = item.icon;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={springSoft}
      className="flex flex-col gap-5 rounded-card-sm border border-line bg-surface p-7 shadow-subtle transition-shadow duration-500 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-medium tabular-nums tracking-tightest text-ink-faint">
            {String(item.rank).padStart(2, "0")}
          </span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-gold-deep">
            <Icon className="h-5 w-5" strokeWidth={1.4} aria-hidden="true" />
          </span>
        </div>
        <span
          className={`eyebrow shrink-0 rounded-full border px-2.5 py-1 ${priorityStyles[item.priority]}`}
        >
          {item.priority} priority
        </span>
      </div>

      <div>
        <p className="text-2xl font-medium tracking-tightest text-ink">{item.area}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.explanation}</p>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
        <span className="eyebrow text-ink-faint">Expected improvement</span>
      </div>
      <p className="-mt-3 text-[13px] font-medium leading-relaxed text-gold-deep">
        {item.expectedImprovement}
      </p>
    </motion.div>
  );
}
