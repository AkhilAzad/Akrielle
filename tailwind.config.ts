import type { Config } from "tailwindcss";

/**
 * AXL Design Tokens — Noir Crimson visual system
 * ------------------------------------------------------------------
 * A pure-black, premium, minimal AI beauty-tech identity. The canvas
 * is true black (#000000); surfaces are near-black (#050505 / #0A0A0A)
 * separated by hairline white-8% borders. Text is warm white. The
 * single brand hue is RED — a vivid, sophisticated crimson for
 * interactive elements (buttons, active states, highlights, data
 * strokes) and a deep blood-crimson for secondary tones, severity,
 * and ambient depth. There is NO orange / copper / amber / gold in
 * the palette.
 *
 * IMPORTANT: the token *names* below are kept stable on purpose — the
 * whole app references `paper` / `ink` / `line` / `gold` / `accent`
 * etc. Only the *values* are remapped, so the entire UI adopts the
 * dark theme without every file being rewritten. The legacy `gold`
 * key is intentionally remapped to the red accent so any lingering
 * `text-gold-*` / `bg-gold` / `shadow-gold-glow` usage becomes red
 * (never copper) for free.
 *
 * Reference values:
 *   --background #000000  --foreground #F5F3F0  --ink #F5F3F0
 *   --muted #9A928B  --subtle #6B6560  --line rgba(255,255,255,0.08)
 *   --surface #050505 --surface-2 #0A0A0A
 *   --accent #DE1F35  --accent-from #F24858  --accent-to #B0182A
 *   crimson: deep #5E0D16 / mid #8E1420 / bright #B31E2C
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Page canvas is TRUE black; surfaces are the near-black
           elevated layers (brief: #050505 / #0A0A0A). */
        paper: "#000000",
        surface: {
          DEFAULT: "#050505",
          2: "#0A0A0A",
        },
        /* Text: warm white primary, muted warm-grey secondary, faint
           for small labels. (Formerly the near-black `ink` scale —
           inverted so the 231 `text-ink*` usages read on black.) */
        ink: {
          DEFAULT: "#F5F3F0",
          muted: "#9A928B",
          faint: "#6B6560",
        },
        /* Primary brand accent — a vivid, sophisticated RED. Kept under
           the `gold` key too so existing `text-gold-deep` / `bg-gold`
           usages become red (NOT copper). `accent` is canonical. */
        gold: {
          DEFAULT: "#DE1F35",
          soft: "#F24858",
          deep: "#B0182A",
          bright: "#F24858",
        },
        accent: {
          DEFAULT: "#DE1F35",
          from: "#F24858",
          to: "#B0182A",
        },
        /* Secondary — deep blood crimson. Used for data viz, severity,
           ambient depth glows, and quiet accents. */
        crimson: {
          DEFAULT: "#8E1420",
          deep: "#5E0D16",
          bright: "#B31E2C",
          soft: "#3A0910",
        },
        /* Neutralised (no pink) — mapped to near-black surfaces so any
           lingering blush usage reads as a quiet dark surface. */
        blush: {
          DEFAULT: "#0A0A0A",
          soft: "#050505",
        },
        success: "#5F8D6B",
        line: "rgba(255,255,255,0.08)",

        /* Dark register — elevated near-black surfaces (premium cards,
           nav overlay, footer, loader). Sit just above the #000 canvas
           and are separated from it by hairline borders. */
        charcoal: "#080808",
        void: "#050505",
        onyx: "#121212",
        ivory: {
          DEFAULT: "#F4F3F1",
          muted: "#A8A8A8",
          faint: "#6F6F6F",
        },

        /* Hero gradient stops — near-black with the faintest crimson
           warmth for atmosphere (was light grey). */
        hero: {
          from: "#0A0406",
          to: "#000000",
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
        subtle: "0 1px 2px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.45)",
        lift: "0 24px 60px -24px rgba(0,0,0,0.75)",
        card: "0 24px 60px -28px rgba(0,0,0,0.8)",
        /* Legacy `gold-glow` key remapped to a RED glow. */
        "gold-glow": "0 0 1px rgba(242,72,88,0.5), 0 0 48px -8px rgba(222,31,53,0.4)",
        "crimson-glow": "0 0 1px rgba(179,30,44,0.5), 0 0 60px -10px rgba(94,13,22,0.6)",
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
