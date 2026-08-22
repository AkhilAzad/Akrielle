"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { springSoft } from "@/components/animations/variants";
import type { FAQItem } from "@/types/landing";

interface FAQItemAccordionProps {
  item: FAQItem;
  /** Row position, used to stagger the scroll-reveal entrance. */
  index?: number;
}

export function FAQItemAccordion({ item, index }: FAQItemAccordionProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div
      className="reveal-up border-b border-line py-6 first:pt-0 last:border-none"
      data-delay={index != null ? `${index * 80}` : undefined}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="group flex w-full items-center justify-between gap-6 text-left"
      >
        <span className="text-lg font-medium tracking-tightest text-ink transition-colors duration-300 group-hover:text-accent md:text-xl">
          {item.question}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={springSoft}
          className="shrink-0 text-accent"
        >
          <Plus className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <motion.p
              initial={{ y: -6 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              className="max-w-xl pt-4 text-[0.95rem] leading-relaxed text-ink-muted"
            >
              {item.answer}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
