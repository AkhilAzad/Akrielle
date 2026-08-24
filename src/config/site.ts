import type { NavLink } from "@/types/landing";

export const SITE = {
  name: "AXL",
  tagline: "Beauty, Understood by Intelligence.",
  description:
    "An AI Beauty Intelligence Platform — one photo returns a premium, private facial analysis with personalized beauty recommendations.",
} as const;

// Product navigation shown in the header and the mobile overlay. Account
// access (profile / sign-in) is handled separately by the navbar's single
// account element, so it intentionally does NOT live in this list.
export const NAV_LINKS: NavLink[] = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Why AXL", href: "#why-alkline" },
  { label: "FAQ", href: "#faq" },
];

export const PRIMARY_CTA_LABEL = "Start Your Beauty Scan";
export const SECONDARY_CTA_LABEL = "See How It Works";
