import {
  ScanFace,
  Palette,
  Droplet,
  Eye,
  Smile,
  Aperture,
  Layers,
  Heart,
  Sparkles,
  Scissors,
  Gem,
  Leaf,
} from "lucide-react";
import type {
  BeautyProfileAttribute,
  BeautyScoreData,
  RecommendationItem,
} from "@/types/results";

export const BEAUTY_SCORE: BeautyScoreData = {
  score: 92,
  headline: "Beauty Harmony Score",
  description:
    "Your features show strong facial symmetry and balanced proportions, with a warm, even-toned complexion that reads consistently across the face.",
  breakdown: [
    { id: "symmetry", label: "Symmetry", value: 94 },
    { id: "proportion", label: "Proportion", value: 91 },
    { id: "clarity", label: "Skin Clarity", value: 90 },
  ],
};

export const BEAUTY_PROFILE_ATTRIBUTES: BeautyProfileAttribute[] = [
  {
    id: "face-shape",
    icon: ScanFace,
    label: "Face Shape",
    value: "Oval",
    confidence: 96,
    explanation:
      "Balanced proportions between forehead, cheekbones, and jawline, with a gently tapered chin.",
  },
  {
    id: "skin-tone",
    icon: Palette,
    label: "Skin Tone",
    value: "Medium Warm",
    confidence: 94,
    explanation:
      "An even, golden-beige complexion with consistent depth across the forehead, cheeks, and jaw.",
  },
  {
    id: "undertone",
    icon: Droplet,
    label: "Undertone",
    value: "Warm",
    confidence: 92,
    explanation:
      "Yellow-gold undertones detected beneath the surface tone — the calibration that guides every colour match below.",
  },
  {
    id: "eye-shape",
    icon: Eye,
    label: "Eye Shape",
    value: "Almond",
    confidence: 95,
    explanation:
      "Balanced width-to-height ratio with a slightly upturned outer corner, ideal for a broad range of eye techniques.",
  },
  {
    id: "lip-shape",
    icon: Smile,
    label: "Lip Shape",
    value: "Full, Balanced",
    confidence: 90,
    explanation:
      "Even upper-to-lower lip ratio with a well-defined cupid's bow and soft outer contour.",
  },
  {
    id: "facial-harmony",
    icon: Aperture,
    label: "Facial Harmony",
    value: "High Symmetry",
    confidence: 93,
    explanation:
      "Left-right facial landmarks align closely, and feature spacing sits close to classical proportion guidelines.",
  },
];

export const RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: "foundation",
    icon: Layers,
    category: "Foundation",
    value: "Warm Medium, Satin Finish",
    reason:
      "Matched to your Medium Warm skin tone and Warm undertone — a satin finish keeps clarity without flattening natural depth.",
  },
  {
    id: "lipstick",
    icon: Droplet,
    category: "Lipstick",
    value: "Warm Terracotta",
    reason:
      "Terracotta's golden base echoes your warm undertone, while its depth suits the fullness of your lip shape.",
  },
  {
    id: "blush",
    icon: Heart,
    category: "Blush",
    value: "Soft Apricot",
    reason:
      "A warm apricot flush follows your Oval face shape's natural contour, lifting the cheekbone without narrowing it.",
  },
  {
    id: "eyeshadow",
    icon: Eye,
    category: "Eyeshadow",
    value: "Bronze & Copper",
    reason:
      "Warm metallics complement your Almond eye shape's natural lift and harmonize with your undertone.",
  },
  {
    id: "highlighter",
    icon: Sparkles,
    category: "Highlighter",
    value: "Champagne Gold",
    reason:
      "A gold-based glow sits naturally against Medium Warm skin, enhancing your face's high symmetry without overpowering it.",
  },
  {
    id: "hairstyle",
    icon: Scissors,
    category: "Hairstyle",
    value: "Soft Layers, Side Part",
    reason:
      "Soft layering frames an Oval face shape at its most flattering angles while a side part adds gentle asymmetry.",
  },
  {
    id: "accessories",
    icon: Gem,
    category: "Accessories",
    value: "Gold-Tone, Angular Shapes",
    reason:
      "Gold tones align with your warm undertone, and angular silhouettes contrast pleasingly with your face's soft curves.",
  },
  {
    id: "skincare",
    icon: Leaf,
    category: "Skincare Focus",
    value: "Hydration & Even Tone",
    reason:
      "Your skin reads clear and consistent overall — the priority is maintaining hydration to keep that evenness long-term.",
  },
];
