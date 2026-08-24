"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { Clock } from "@/components/layout/Clock";
import { PRIMARY_CTA_LABEL, SITE } from "@/config/site";
import { staggerContainer, staggerItem, viewportOnceTight } from "@/components/animations/variants";

const FOOTER_LINKS = [
  {
    heading: "Platform",
    links: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "Start Your Beauty Scan", href: "/upload" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Why AXL", href: "#why-alkline" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

/**
 * Lumora's closing footer — a dark, rounded-top slab with a large CTA line, a
 * brand column, three link columns, a legal bar, and a giant wordmark
 * watermark clipped by the bottom edge.
 */
export function Footer() {
  return (
    <footer className="relative overflow-hidden rounded-t-[2.5rem] bg-charcoal text-ivory">
      <Container className="relative z-10 pt-20 md:pt-28">
        {/* CTA row */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnceTight}
          variants={staggerContainer(0.1)}
          className="flex flex-col gap-8 border-b border-white/10 pb-16 md:flex-row md:items-end md:justify-between"
        >
          <motion.h2
            variants={staggerItem}
            className="max-w-[16ch] text-4xl font-medium leading-[1.02] tracking-tightest text-ivory md:text-6xl"
          >
            Beauty, understood by intelligence.
          </motion.h2>
          <motion.div variants={staggerItem}>
            <Button href="/upload" size="lg" variant="gold" showArrow>
              {PRIMARY_CTA_LABEL}
            </Button>
          </motion.div>
        </motion.div>

        {/* Columns */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnceTight}
          variants={staggerContainer(0.07)}
          className="grid grid-cols-2 gap-12 py-16 md:grid-cols-4"
        >
          <motion.div variants={staggerItem} className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <span className="text-2xl font-semibold tracking-tightest text-ivory">{SITE.name}</span>
            <p className="max-w-[220px] text-sm leading-relaxed text-ivory-muted">
              {SITE.tagline}
            </p>
          </motion.div>

          {FOOTER_LINKS.map((group) => (
            <motion.div key={group.heading} variants={staggerItem} className="flex flex-col gap-4">
              <span className="eyebrow eyebrow-on-dark">
                <span className="eyebrow-dot" aria-hidden="true" />
                {group.heading}
              </span>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group relative inline-block text-sm text-ivory-muted transition-colors duration-300 hover:text-ivory"
                    >
                      {link.label}
                      <span
                        className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 ease-signature group-hover:w-full"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Legal bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-xs text-ivory-faint md:flex-row">
          <span>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          <Clock withLabel className="uppercase tracking-widest2" />
        </div>
      </Container>

      {/* Wordmark watermark, clipped by the bottom edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden"
      >
        <span className="watermark watermark-light translate-y-[28%] text-[24vw] leading-none md:text-[22vw]">
          {SITE.name}
        </span>
      </div>
    </footer>
  );
}
