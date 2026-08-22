import {
  Square,
  Mountain,
  Sun,
  ArrowLeftRight,
  ArrowUpDown,
  Move,
  Scale,
  Wind,
  SmilePlus,
  Feather,
  Waves,
  Layers,
  Smile,
  Sparkle,
  Scissors,
  Droplet,
  Moon,
  User,
  Leaf,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Exact icon for each of the 14 fixed Complete Facial Analysis
 * features. Keyed by the exact "feature" string the model is
 * instructed to return.
 */
const FACIAL_FEATURE_ICONS: Record<string, LucideIcon> = {
  Jaw: Square,
  Cheekbones: Mountain,
  Forehead: Sun,
  "Face Width": ArrowLeftRight,
  "Face Length": ArrowUpDown,
  "Eye Distance": Move,
  "Eye Symmetry": Scale,
  "Nose Balance": Wind,
  "Lip Fullness": SmilePlus,
  Eyebrows: Feather,
  Hairline: Waves,
  "Hair Density": Layers,
  Smile: Smile,
  "Skin Quality": Sparkle,
};

/** Falls back gracefully if the model ever returns an unexpected label. */
export function getFacialFeatureIcon(feature: string): LucideIcon {
  return FACIAL_FEATURE_ICONS[feature] ?? Sparkles;
}

/**
 * Keyword-based icon lookup for Highest Impact Improvements. The
 * model chooses areas freely (within guidance), so this matches by
 * substring rather than an exact key.
 */
const IMPACT_AREA_KEYWORDS: Array<[string, LucideIcon]> = [
  ["hair", Scissors],
  ["skin", Droplet],
  ["eyebrow", Feather],
  ["beard", User],
  ["smile", Smile],
  ["sleep", Moon],
  ["jaw", Square],
  ["diet", Leaf],
  ["nutrition", Leaf],
  ["hydration", Droplet],
];

export function getImpactAreaIcon(area: string): LucideIcon {
  const lower = area.toLowerCase();
  const match = IMPACT_AREA_KEYWORDS.find(([keyword]) => lower.includes(keyword));
  return match ? match[1] : Sparkles;
}
