import type { NavLink } from "@/types/landing";

export const SITE = {
  name: "AXL",
  tagline: "Beauty, Understood by Intelligence.",
  description:
    "An AI Beauty Intelligence Platform — one photo returns a premium, private facial analysis with personalized beauty recommendations.",
} as const;

export const NAV_LINKS: NavLink[] = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Why AXL", href: "#why-alkline" },
  { label: "FAQ", href: "#faq" },
  { label: "Profile", href: "/profile" },
];

export const PRIMARY_CTA_LABEL = "Start Your Beauty Scan";
export const SECONDARY_CTA_LABEL = "See How It Works";
