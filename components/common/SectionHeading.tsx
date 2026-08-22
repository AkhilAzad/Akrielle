"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeUpBlur, viewportOnce } from "@/components/animations/variants";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.09 } },
      }}
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <motion.span variants={fadeUpBlur} className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        variants={fadeUpBlur}
        className="max-w-2xl text-4xl font-medium leading-[1.05] tracking-tightest md:text-5xl"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          variants={fadeUpBlur}
          className="max-w-md font-body text-[0.95rem] leading-relaxed text-ink-muted"
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
