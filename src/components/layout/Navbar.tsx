"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, UserRound } from "lucide-react";
import { NAV_LINKS, PRIMARY_CTA_LABEL, SITE } from "@/config/site";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { NavMenu } from "@/components/layout/NavMenu";
import { MusicToggle } from "@/components/layout/MusicToggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/utils";

const easeSignature = [0.22, 1, 0.36, 1] as const;

/** Small brand glyph — a charcoal tile with an accent dot. */
function BrandMark() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-[0.5rem] bg-charcoal transition-transform duration-500 ease-signature group-hover:rotate-6">
      <span className="h-[0.4rem] w-[0.4rem] rounded-full bg-accent" aria-hidden="true" />
    </span>
  );
}

/**
 * The single account entry point — deliberately kept distinct from the primary
 * scan CTA, and reduced to one clean element per auth state:
 *   - signed in  → one avatar icon linking to the profile
 *   - signed out → a single quiet "Log in" link
 * Renders nothing while the session is still restoring, or when accounts
 * aren't configured. Desktop only; the mobile overlay carries its own account
 * row.
 */
function AccountAction() {
  const { status, configured } = useAuth();
  if (!configured || status === "initializing") return null;

  if (status === "signed-in") {
    return (
      <Link
        href="/profile"
        aria-label="Your account"
        className="hidden h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted transition-colors duration-300 ease-signature hover:border-ink/40 hover:text-ink lg:inline-flex"
      >
        <UserRound className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.6} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      href="/signin"
      className="hidden text-sm font-medium text-ink-muted transition-colors duration-300 ease-signature hover:text-ink lg:inline-flex"
    >
      Log in
    </Link>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const lastY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 12);

    const delta = latest - lastY.current;
    // Only react to intentional scroll motion, and never hide near the top.
    if (latest > 160 && delta > 4) {
      setHidden(true);
    } else if (delta < -4 || latest < 160) {
      setHidden(false);
    }
    lastY.current = latest;
  });

  // Keep initial state correct on mount (e.g. reload mid-page).
  useEffect(() => {
    setScrolled(window.scrollY > 12);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const navLinkClass =
    "group relative py-1 text-sm font-medium text-ink-muted transition-colors duration-300 ease-signature hover:text-ink";

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16, filter: "blur(6px)" }}
        animate={{
          opacity: 1,
          y: hidden ? "-100%" : 0,
          filter: "blur(0px)",
        }}
        transition={{
          y: { duration: 0.6, ease: easeSignature },
          opacity: { duration: 0.9, ease: easeSignature, delay: 0.1 },
          filter: { duration: 0.9, ease: easeSignature, delay: 0.1 },
        }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-signature",
          scrolled
            ? "border-b border-line bg-paper/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        {/* Balanced three-zone layout on desktop (logo · centered nav · actions);
            collapses to logo + menu below lg. */}
        <Container className="flex h-16 items-center justify-between gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          {/* Zone 1 — brand */}
          <a
            href="#"
            className="group inline-flex items-center gap-2.5 lg:justify-self-start"
            aria-label={`${SITE.name} — back to top`}
          >
            <BrandMark />
            <span className="text-lg font-semibold tracking-tightest text-ink">
              {SITE.name}
            </span>
          </a>

          {/* Zone 2 — product navigation, centered */}
          <nav
            className="hidden items-center gap-8 lg:flex lg:justify-self-center"
            aria-label="Primary"
          >
            {NAV_LINKS.map((link) => {
              const inner = (
                <>
                  {link.label}
                  <span
                    className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 ease-signature group-hover:w-full"
                    aria-hidden="true"
                  />
                </>
              );
              // In-page anchors keep native <a> for smooth scrolling; real
              // routes use <Link> so navigation stays client-side.
              return link.href.startsWith("/") ? (
                <Link key={link.href} href={link.href} className={navLinkClass}>
                  {inner}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className={navLinkClass}>
                  {inner}
                </a>
              );
            })}
          </nav>

          {/* Zone 3 — primary CTA + single account element (desktop); menu (mobile) */}
          <div className="flex items-center gap-3 lg:justify-self-end">
            <MusicToggle />
            <Button
              href="/onboarding"
              size="md"
              variant="primary"
              showArrow
              className="hidden lg:inline-flex"
            >
              {PRIMARY_CTA_LABEL}
            </Button>
            <AccountAction />
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors duration-500 ease-signature hover:border-ink lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </Container>
      </motion.header>

      <NavMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
