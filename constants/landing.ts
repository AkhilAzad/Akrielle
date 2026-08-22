import {
  ScanFace,
  Sparkles,
  ShieldCheck,
  Gem,
  Aperture,
  Palette,
} from "lucide-react";
import type {
  ProcessStep,
  FeatureItem,
  DifferentiatorItem,
  FAQItem,
  ScanLandmark,
  HeroParticle,
} from "@/types/landing";

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "capture",
    title: "Capture",
    description:
      "Take a single, well-lit selfie — no filters, no special equipment. Alkline only needs a moment of clarity.",
  },
  {
    id: "analyze",
    title: "Analyze",
    description:
      "Our intelligence engine maps your facial structure, skin tone, undertone, and features with clinical precision.",
  },
  {
    id: "profile",
    title: "Profile",
    description:
      "Your findings are translated into a private Beauty Profile — the language your features already speak.",
  },
  {
    id: "recommend",
    title: "Recommend",
    description:
      "Receive a curated set of recommendations, each with the reasoning behind it — never a guess, always a fit.",
  },
];

export const FEATURES: FeatureItem[] = [
  {
    id: "facial-mapping",
    icon: ScanFace,
    title: "Precision Facial Mapping",
    description:
      "Advanced landmark detection reads face shape, proportions, and symmetry the way a master consultant would — instantly.",
  },
  {
    id: "undertone",
    icon: Palette,
    title: "True Undertone Detection",
    description:
      "Beyond warm or cool — Alkline identifies the subtle calibration of your skin's undertone for exact-match recommendations.",
  },
  {
    id: "reasoned",
    icon: Sparkles,
    title: "Reasoned Recommendations",
    description:
      "Every suggestion arrives with its rationale. You'll always understand why something suits you — not just that it does.",
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    title: "Private by Design",
    description:
      "Your image is analyzed, not archived. Alkline was built on the principle that beauty intelligence should never compromise privacy.",
  },
];

export const DIFFERENTIATORS: DifferentiatorItem[] = [
  {
    id: "consultation",
    title: "A Consultation, Not a Catalogue",
    description:
      "Alkline doesn't push products. It listens to your features first, the way a trusted beauty consultant would, and recommends only what genuinely suits you.",
  },
  {
    id: "intelligence",
    title: "Built on Real Intelligence",
    description:
      "Every recommendation is grounded in facial analysis, colour theory, and feature mapping — not trends, and not guesswork.",
  },
  {
    id: "craft",
    title: "Designed Like It Matters",
    description:
      "From the interface to the interaction, Alkline is crafted with the same care as the beauty houses it draws inspiration from.",
  },
];

export const FAQS: FAQItem[] = [
  {
    id: "how-accurate",
    question: "How accurate is the analysis?",
    answer:
      "Alkline's facial intelligence engine is trained to identify structural and tonal features with a high degree of precision, refined continuously against expert consultation standards.",
  },
  {
    id: "data-privacy",
    question: "What happens to my photo?",
    answer:
      "Your photo is used only to generate your Beauty Profile. Alkline is built to analyze, not to store or share your image.",
  },
  {
    id: "cost",
    question: "Is Alkline free to use?",
    answer:
      "Your first Beauty Scan is complimentary. We'll always be transparent before any part of the experience requires payment.",
  },
  {
    id: "skin-tones",
    question: "Does Alkline work for every skin tone?",
    answer:
      "Yes. Alkline's undertone detection is calibrated across the full spectrum of skin tones, not a narrow band of them.",
  },
  {
    id: "devices",
    question: "What do I need to get started?",
    answer:
      "Just a phone or computer with a camera. A single clear, well-lit photo is all Alkline needs to begin.",
  },
];

/**
 * Landmark annotations for the hero's face-scan visualization.
 * Positions are percentages within the visualization frame, balanced
 * 3-right/2-left so the reading order stays calm rather than crowding
 * one side. Order here also drives the reveal sequence (via `delay`).
 */
export const SCAN_LANDMARKS: ScanLandmark[] = [
  { id: "face-shape", label: "Face Shape", value: "Oval", x: 80, y: 20, delay: 1.5 },
  { id: "undertone", label: "Undertone", value: "Warm", x: 10, y: 38, delay: 1.9 },
  { id: "eye-shape", label: "Eye Shape", value: "Almond", x: 84, y: 50, delay: 2.3 },
  { id: "skin-tone", label: "Skin Tone", value: "Medium", x: 8, y: 66, delay: 2.7 },
  { id: "symmetry", label: "Symmetry", value: "98%", x: 76, y: 80, delay: 3.1 },
];

/**
 * Seeded particle positions for the hero's ambient dust field — fixed
 * values so server-rendered and client-hydrated markup match exactly.
 */
export const HERO_PARTICLES: HeroParticle[] = [
  { id: "p1", x: 8, y: 15, size: 2, driftX: 8, driftY: -14, duration: 7, delay: 0 },
  { id: "p2", x: 22, y: 72, size: 1.5, driftX: -6, driftY: -10, duration: 9, delay: 0.6 },
  { id: "p3", x: 92, y: 30, size: 2.5, driftX: -10, driftY: 8, duration: 8, delay: 1.1 },
  { id: "p4", x: 65, y: 8, size: 1.5, driftX: 6, driftY: 12, duration: 6.5, delay: 0.3 },
  { id: "p5", x: 5, y: 48, size: 2, driftX: 10, driftY: 6, duration: 10, delay: 1.6 },
  { id: "p6", x: 96, y: 62, size: 1.5, driftX: -8, driftY: -8, duration: 7.5, delay: 0.9 },
  { id: "p7", x: 38, y: 92, size: 2, driftX: 6, driftY: -10, duration: 8.5, delay: 2.1 },
  { id: "p8", x: 78, y: 95, size: 1.5, driftX: -6, driftY: -12, duration: 9.5, delay: 1.4 },
  { id: "p9", x: 15, y: 5, size: 1.5, driftX: 8, driftY: 10, duration: 6, delay: 2.4 },
  { id: "p10", x: 50, y: 4, size: 1, driftX: -4, driftY: 8, duration: 7, delay: 1.8 },
  { id: "p11", x: 90, y: 85, size: 1.5, driftX: -8, driftY: 6, duration: 8, delay: 0.4 },
  { id: "p12", x: 2, y: 82, size: 2, driftX: 6, driftY: -8, duration: 9, delay: 2.8 },
];

export { Gem, Aperture };
