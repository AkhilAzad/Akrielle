"use client";

import { motion } from "framer-motion";
import { ProfileCard } from "@/components/results/ProfileCard";
import { staggerContainer, viewportOnce } from "@/components/animations/variants";
import type { BeautyProfileAttribute } from "@/types/results";

interface ProfileGridProps {
  attributes: BeautyProfileAttribute[];
}

export function ProfileGrid({ attributes }: ProfileGridProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer(0.07)}
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {attributes.map((attribute) => (
        <ProfileCard key={attribute.id} attribute={attribute} />
      ))}
    </motion.div>
  );
}
