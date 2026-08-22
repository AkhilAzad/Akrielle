import type { LucideIcon } from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
}

export interface FeatureItem {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface DifferentiatorItem {
  id: string;
  title: string;
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ScanLandmark {
  id: string;
  label: string;
  value: string;
  /** position as a percentage of the visualization frame */
  x: number;
  y: number;
  delay: number;
}

/**
 * A single mote in the hero's ambient particle field. Positions and
 * drift are pre-seeded (not Math.random at render) so server and
 * client markup match exactly — no hydration flicker.
 */
export interface HeroParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
}
