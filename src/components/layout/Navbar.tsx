"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, UserRound } from "lucide-react";
import { NAV_LINKS, PRIMARY_CTA_LABEL, SITE } from "@/config/site";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { Clock } from "@/components/layout/Clock";
import { NavMenu } from "@/components/layout/NavMenu";
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
 * Account entry point for the landing header. Reflects auth state: a link to
 * the profile page when signed in, a sign-in link otherwise. Renders nothing
 * while the session is still restoring, or when accounts aren't configured.
 */
function AccountLink() {
  const { status, configured } = useAuth();
  if (!configured || status === "initializing") return null;
  const signedIn = status === "signed-in";
  return (
    <Link
      href={signedIn ? "/profile" : "/signin"}
      className="hidden items-center gap-2 font-body text-sm text-ink-muted transition-colors duration-300 hover:text-ink lg:inline-flex"
    >
      <UserRound className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
      {signedIn ? "Profile" : "Sign in"}
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
          scrolled ? "border-b border-line bg-paper/85 backdrop-blur-md" : "border-b border-transparent bg-transparent"
        )}
      >
        <Container className="flex h-20 items-center justify-between gap-6">
          <a href="#" className="group inline-flex items-center gap-2.5">
            <BrandMark />
            <span className="text-lg font-semibold tracking-tightest text-ink">
              {SITE.name}
            </span>
          </a>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const linkClass =
                "group relative font-body text-sm text-ink-muted transition-colors duration-300 hover:text-ink";
              const inner = (
                <>
                  {link.label}
                  <span
                    className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-300 ease-signature group-hover:w-full"
                    aria-hidden="true"
                  />
                </>
              );
              // In-page anchors keep native <a> for smooth scrolling; real
              // routes use <Link> so navigation stays client-side (and keeps
              // the app's page transitions) like everywhere else.
              return link.href.startsWith("/") ? (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {inner}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className={linkClass}>
                  {inner}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-5">
            <Clock className="hidden text-[0.75rem] text-ink-muted xl:inline-flex" />
            <AccountLink />
            <Button
              href="/upload"
              size="md"
              variant="primary"
              showArrow
              className="hidden lg:inline-flex"
            >
              {PRIMARY_CTA_LABEL}
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="group inline-flex items-center gap-2 rounded-pill border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-500 ease-signature hover:border-ink"
            >
              <Menu className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </Container>
      </motion.header>

      <NavMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
