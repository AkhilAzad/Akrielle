"use client";

import { motion } from "framer-motion";
import { ImpactImprovementCard } from "@/components/results/ImpactImprovementCard";
import { staggerContainer, viewportOnce } from "@/components/animations/variants";
import type { ImpactImprovementCardData } from "@/types/results";

interface ImpactImprovementListProps {
  items: ImpactImprovementCardData[];
}

export function ImpactImprovementList({ items }: ImpactImprovementListProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer(0.06)}
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((item) => (
        <ImpactImprovementCard key={item.id} item={item} />
      ))}
    </motion.div>
  );
}
