"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/utils/utils";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { springSnappy } from "@/components/animations/variants";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "outlineLight";
type ButtonSize = "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  showArrow?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// framer-motion's MotionProps redefines a handful of DOM event handlers
// (onAnimationStart, onDrag, etc.) with animation-specific signatures, so
// the native HTML attribute versions are omitted here to avoid a type
// clash when spreading `...props` onto the motion-wrapped elements below.
type ConflictingHandlers =
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd";

interface ButtonAsButton
  extends BaseProps,
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      ConflictingHandlers | "children"
    > {
  href?: undefined;
}

interface ButtonAsLink
  extends BaseProps,
    Omit<
      React.AnchorHTMLAttributes<HTMLAnchorElement>,
      ConflictingHandlers | "children"
    > {
  href: string;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

/*
 * AXL pill buttons. The variant *names* are unchanged so existing callers
 * keep working; only the look changed for the Noir Crimson theme:
 *   primary  → solid red accent pill (the per-screen primary action)
 *   gold     → solid red accent pill + red glow (marquee/hero CTAs)
 *   secondary→ hairline outline pill (quiet, on the black canvas)
 *   outlineLight → translucent light pill (for dark/photo surfaces)
 *   ghost    → inline text link (no pill)
 * With `showArrow`, non-ghost variants grow a circular badge on the right
 * that nudges on hover — the signature `.with-arrow` treatment.
 */
const base =
  "group relative inline-flex items-center justify-center font-body font-medium leading-none rounded-pill " +
  "transition-all duration-500 ease-signature focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Exclude<ButtonVariant, "ghost">, string> = {
  primary: "bg-accent text-white hover:bg-accent-to",
  gold: "bg-accent text-white shadow-gold-glow hover:bg-accent-to",
  secondary: "border border-line bg-transparent text-ink hover:border-ink",
  outlineLight:
    "border border-white/30 bg-white/10 text-ivory backdrop-blur-sm hover:bg-white/20",
};

const badgeVariants: Record<Exclude<ButtonVariant, "ghost">, string> = {
  primary: "bg-white/20 text-white",
  gold: "bg-white/20 text-white",
  secondary: "bg-white/10 text-ivory",
  outlineLight: "bg-charcoal text-ivory",
};

// Even padding when there's no badge.
const sizes: Record<ButtonSize, string> = {
  md: "gap-2 px-7 py-3.5 text-sm",
  lg: "gap-2 px-8 py-4 text-[0.95rem]",
};

// Tighter right padding when a badge is present, so it nests in the pill.
const arrowSizes: Record<ButtonSize, string> = {
  md: "gap-3 py-2 pl-6 pr-2 text-sm",
  lg: "gap-3 py-2.5 pl-7 pr-2.5 text-[0.95rem]",
};

const badgeSizes: Record<ButtonSize, string> = {
  md: "h-9 w-9",
  lg: "h-10 w-10",
};

const ghostBase =
  "group inline-flex items-center gap-1.5 font-body font-medium text-sm text-ink " +
  "transition-colors duration-500 ease-signature hover:text-accent focus-visible:outline-none " +
  "disabled:opacity-50 disabled:pointer-events-none";

const MotionLink = motion.create(Link);
const MotionButton = motion.create("button");

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = "primary", size = "md", showArrow, className, children, href, ...props }, ref) => {
    const isGhost = variant === "ghost";
    const withBadge = Boolean(showArrow) && !isGhost;

    const classes = isGhost
      ? cn(ghostBase, className)
      : cn(
          base,
          variants[variant],
          withBadge ? arrowSizes[size] : sizes[size],
          className
        );

    const content = (
      <>
        <span>{children}</span>
        {withBadge && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full transition-transform duration-500 ease-signature group-hover:translate-x-0.5",
              badgeVariants[variant as Exclude<ButtonVariant, "ghost">],
              badgeSizes[size]
            )}
            aria-hidden="true"
          >
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
          </span>
        )}
        {showArrow && isGhost && (
          <ArrowRight
            className="h-4 w-4 transition-transform duration-500 ease-signature group-hover:translate-x-1"
            aria-hidden="true"
          />
        )}
      </>
    );

    const interaction = {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: springSnappy,
    };

    if (href) {
      return (
        <MotionLink
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          {...interaction}
          {...(props as Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, ConflictingHandlers>)}
        >
          {content}
        </MotionLink>
      );
    }

    return (
      <MotionButton
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        {...interaction}
        {...(props as Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, ConflictingHandlers>)}
      >
        {content}
      </MotionButton>
    );
  }
);

Button.displayName = "Button";
