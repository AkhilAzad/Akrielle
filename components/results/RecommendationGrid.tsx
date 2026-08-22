"use client";

import { motion } from "framer-motion";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { staggerContainer, viewportOnce } from "@/components/animations/variants";
import type { RecommendationItem } from "@/types/results";

interface RecommendationGridProps {
  items: RecommendationItem[];
}

export function RecommendationGrid({ items }: RecommendationGridProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer(0.06)}
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {items.map((item) => (
        <RecommendationCard key={item.id} item={item} />
      ))}
    </motion.div>
  );
}
