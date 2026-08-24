"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { NAV_LINKS, PRIMARY_CTA_LABEL, SITE } from "@/config/site";
import { useAuth } from "@/contexts/AuthContext";
import { Clock } from "@/components/layout/Clock";
import { easeSignature } from "@/components/animations/variants";

interface NavMenuProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Lumora's full-screen navigation overlay. A dark sheet with large, staggered
 * link targets, a live clock, and a scan CTA. Locks body scroll (and pauses
 * Lenis, if active) while open; closes on Escape.
 */
export function NavMenu({ open, onClose }: NavMenuProps) {
  const { status, configured } = useAuth();
  const showAccount = configured && status !== "initializing";
  const signedIn = status === "signed-in";

  useEffect(() => {
    if (!open) return;

    const lenis = (window as unknown as { __lenis?: { stop?: () => void; start?: () => void } }).__lenis;
    document.body.style.overflow = "hidden";
    lenis?.stop?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      lenis?.start?.();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const items = [
    ...NAV_LINKS,
    { label: PRIMARY_CTA_LABEL, href: "/upload" },
  ];

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
    exit: {},
  };
  const item = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeSignature } },
    exit: { opacity: 0, y: 12, transition: { duration: 0.25, ease: easeSignature } },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="nav-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: easeSignature }}
          className="fixed inset-0 z-[80] flex flex-col bg-[#0a0a0a] text-ivory"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="flex items-center justify-between px-5 py-6 sm:px-8">
            <span className="text-lg font-semibold tracking-tightest">{SITE.name}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="group inline-flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-widest2 text-ivory-muted transition-colors duration-300 hover:text-ivory"
            >
              Close
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition-colors duration-500 ease-signature group-hover:border-white/40">
                <X className="h-4 w-4" strokeWidth={1.6} />
              </span>
            </button>
          </div>

          <motion.nav
            variants={container}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-1 flex-col justify-center gap-1 px-5 sm:px-8"
            aria-label="Primary"
          >
            {items.map((link, i) => (
              <motion.div key={link.href} variants={item} className="overflow-hidden">
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="group flex items-baseline gap-5 py-2 text-[2.75rem] font-medium leading-[1.05] tracking-tightest text-ivory transition-colors duration-500 ease-signature hover:text-accent sm:text-[3.5rem]"
                >
                  <span className="text-[0.8rem] font-normal text-ivory-faint tabular-nums">
                    0{i + 1}
                  </span>
                  <span className="transition-transform duration-500 ease-signature group-hover:translate-x-2">
                    {link.label}
                  </span>
                </Link>
              </motion.div>
            ))}

            {showAccount && (
              <motion.div variants={item} className="mt-4">
                <Link
                  href={signedIn ? "/profile" : "/signin"}
                  onClick={onClose}
                  className="text-sm text-ivory-muted underline-offset-4 transition-colors duration-300 hover:text-ivory hover:underline"
                >
                  {signedIn ? "Your profile" : "Sign in"}
                </Link>
              </motion.div>
            )}
          </motion.nav>

          <div className="flex items-center justify-between border-t border-white/10 px-5 py-6 text-[0.6875rem] uppercase tracking-widest2 text-ivory-faint sm:px-8">
            <Clock withLabel />
            <span>{SITE.tagline}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
