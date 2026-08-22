import type { Config } from "tailwindcss";

/**
 * Alkline Design Tokens — Lumora visual system
 * ------------------------------------------------------------------
 * Re-skinned to match the original Lumora studio design. The palette
 * is a warm off-white canvas, near-black ink, and a single burnt-
 * orange accent used sparingly. A dark register (charcoal / onyx)
 * powers the cinematic moments: hero watermark, work cards, the
 * stats panel, the nav overlay, and the footer.
 *
 * IMPORTANT: the token *names* below are kept stable on purpose — the
 * whole app references `paper` / `ink` / `line` / `gold` etc. Only the
 * *values* were remapped to Lumora, so the entire UI adopts Lumora's
 * colours without every file being rewritten. Structural Lumora
 * details (pills, dark cards, liquid hero, loader) are layered on top
 * component-by-component.
 *
 * Lumora reference values:
 *   --background #ffffff  --foreground #111111  --ink #0a0a0a
 *   --muted #8d8d8d  --subtle #b6b6b6  --line #e6e5e2
 *   --surface #f1f0ee --surface-2 #e3e2df
 *   --accent #b15f2c  --accent-from #cf8047  --accent-to #97501f
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Page canvas + light surfaces (Lumora --background / --surface). */
        paper: "#FFFFFF",
        surface: {
          DEFAULT: "#F1F0EE",
          2: "#E3E2DF",
        },
        /* Ink + its tints (Lumora --foreground / --muted / --subtle). */
        ink: {
          DEFAULT: "#111111",
          muted: "#8D8D8D",
          faint: "#B6B6B6",
        },
        /* The single accent. Kept under the `gold` key so existing
           `text-gold-deep` / `bg-gold` usages become burnt-orange for
           free. `accent` is the canonical name for new components. */
        gold: {
          DEFAULT: "#B15F2C",
          soft: "#CF8047",
          deep: "#97501F",
          bright: "#CF8047",
        },
        accent: {
          DEFAULT: "#B15F2C",
          from: "#CF8047",
          to: "#97501F",
        },
        /* Neutralised (Lumora has no pink) — mapped to warm greys so any
           lingering blush usage reads as a quiet surface, not pink. */
        blush: {
          DEFAULT: "#E3E2DF",
          soft: "#F1F0EE",
        },
        success: "#5F8D6B",
        line: "#E6E5E2",

        /* Dark register — the near-black used for hero watermark, work
           cards, stats panel, nav overlay and footer. */
        charcoal: "#0A0A0A",
        void: "#0A0A0A",
        onyx: "#151515",
        ivory: {
          DEFAULT: "#F4F3F1",
          muted: "#A8A8A8",
          faint: "#6F6F6F",
        },

        /* Hero gradient stops (Lumora --hero-from / --hero-to). */
        hero: {
          from: "#ECEBE9",
          to: "#C9C9C9",
        },
      },
      fontFamily: {
        /* Lumora is set entirely in Onest — no serif, no separate mono. */
        display: ["var(--font-onest)", "system-ui", "sans-serif"],
        body: ["var(--font-onest)", "system-ui", "sans-serif"],
        mono: ["var(--font-onest)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.02em",
        widest2: "0.18em",
        widest3: "0.26em",
      },
      borderRadius: {
        pill: "9999px",
        card: "2rem",
        "card-sm": "1.25rem",
        control: "0.875rem",
      },
      maxWidth: {
        /* Lumora --container-shell. Kept under `content` so the shared
           Container widens to Lumora's shell automatically. */
        content: "88rem",
        shell: "88rem",
      },
      fontSize: {
        watermark: "13rem",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(10,10,10,0.04), 0 8px 24px rgba(10,10,10,0.05)",
        lift: "0 24px 60px -24px rgba(10,10,10,0.28)",
        card: "0 20px 50px -28px rgba(10,10,10,0.35)",
        "gold-glow": "0 0 1px rgba(207,128,71,0.4), 0 0 48px -8px rgba(177,95,44,0.35)",
      },
      transitionTimingFunction: {
        signature: "cubic-bezier(0.22, 1, 0.36, 1)",
        reveal: "cubic-bezier(0.215, 0.61, 0.355, 1)",
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "pulse-ring": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.75", transform: "scale(1.03)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "orbit-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "orbit-reverse": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        "scan-sweep": {
          "0%": { transform: "translateY(-52%)", opacity: "0" },
          "12%": { opacity: "0.9" },
          "88%": { opacity: "0.9" },
          "100%": { transform: "translateY(52%)", opacity: "0" },
        },
        "particle-drift": {
          "0%, 100%": { transform: "translate3d(0,0,0)", opacity: "0.15" },
          "50%": { transform: "translate3d(var(--drift-x, 6px), var(--drift-y, -10px), 0)", opacity: "0.65" },
        },
        "chip-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 4s ease-in-out infinite",
        "fade-up": "fade-up 0.8s cubic-bezier(0.22,1,0.36,1) forwards",
        "orbit-slow": "orbit-slow 46s linear infinite",
        "orbit-reverse": "orbit-reverse 64s linear infinite",
        "scan-sweep": "scan-sweep 4.2s cubic-bezier(0.45,0,0.55,1) infinite",
        "particle-drift": "particle-drift 8s ease-in-out infinite",
        "chip-float": "chip-float 5.5s ease-in-out infinite",
        shimmer: "shimmer 3.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
