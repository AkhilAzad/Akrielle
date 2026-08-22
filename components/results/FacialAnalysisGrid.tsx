"use client";

import { motion } from "framer-motion";
import { FacialAnalysisCard } from "@/components/results/FacialAnalysisCard";
import { staggerContainer, viewportOnce } from "@/components/animations/variants";
import type { FacialAnalysisCardData } from "@/types/results";

interface FacialAnalysisGridProps {
  items: FacialAnalysisCardData[];
}

export function FacialAnalysisGrid({ items }: FacialAnalysisGridProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer(0.05)}
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((item) => (
        <FacialAnalysisCard key={item.id} item={item} />
      ))}
    </motion.div>
  );
}
