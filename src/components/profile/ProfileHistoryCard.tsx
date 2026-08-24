"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { springSoft, staggerItem } from "@/components/animations/variants";
import type { SavedAnalysis } from "@/types/account";

interface ProfileHistoryCardProps {
  item: SavedAnalysis;
  /** Open this saved scan on the results page. */
  onView: () => void;
}

function formatWhen(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  return {
    date: d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

/**
 * A single row in the Profile scan-history list. Mirrors the card used on
 * the account page (score badge + date + a short feature summary) but is
 * read-only here — tapping "View" restores that saved analysis and opens
 * the full results page. All values come straight from the saved row.
 */
export function ProfileHistoryCard({ item, onView }: ProfileHistoryCardProps) {
  const when = formatWhen(item.createdAt);

  return (
    <motion.li
      variants={staggerItem}
      whileHover={{ y: -3 }}
      transition={springSoft}
      className="flex flex-col gap-4 rounded-card-sm border border-line bg-surface p-5 shadow-subtle transition-shadow duration-500 hover:shadow-lift sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-control border border-line bg-paper">
          <span className="font-display text-2xl leading-none tracking-tightest text-ink">
            {Math.round(item.beautyScore)}
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-widest2 text-ink-faint">
            Score
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-medium text-ink">{when.date}</span>
          {when.time && (
            <span className="font-mono text-xs text-ink-muted">{when.time}</span>
          )}
          <span className="text-xs text-ink-muted">
            {item.result.faceShape} · {item.result.skinTone}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onView}
        className="group inline-flex items-center gap-2 self-start rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors duration-300 hover:border-ink/50 focus-visible:outline-none sm:self-auto"
      >
        View
        <ArrowRight
          className="h-4 w-4 transition-transform duration-500 ease-signature group-hover:translate-x-1"
          aria-hidden="true"
        />
      </button>
    </motion.li>
  );
}
