"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, UserRound } from "lucide-react";
import { Container } from "@/components/common/Container";
import { SITE } from "@/config/site";
import { useAuth } from "@/context/AuthContext";

interface FlowHeaderProps {
  /** Where "Back" should go. Falls back to browser history when omitted. */
  backHref?: string;
  backLabel?: string;
}

const backArrow =
  "h-4 w-4 transition-transform duration-500 ease-signature group-hover:-translate-x-1";

export function FlowHeader({ backHref, backLabel = "Back" }: FlowHeaderProps) {
  const router = useRouter();
  const { status, configured } = useAuth();
  const showAccount = configured && status === "signed-in";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-line bg-paper/90 backdrop-blur-sm"
    >
      <Container className="flex h-20 items-center justify-between">
        {backHref ? (
          <Link
            href={backHref}
            className="group inline-flex items-center gap-2 text-sm text-ink-muted transition-colors duration-300 hover:text-ink"
          >
            <ArrowLeft className={backArrow} strokeWidth={1.6} aria-hidden="true" />
            {backLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 text-sm text-ink-muted transition-colors duration-300 hover:text-ink"
          >
            <ArrowLeft className={backArrow} strokeWidth={1.6} aria-hidden="true" />
            {backLabel}
          </button>
        )}

        <Link href="/" className="text-lg font-semibold tracking-tightest text-ink">
          {SITE.name}
        </Link>

        {/* Right slot — fixed width to keep the logo centered. Shows an
            account shortcut once signed in, otherwise stays empty. */}
        <div className="flex w-[64px] justify-end">
          {showAccount && (
            <Link
              href="/account"
              aria-label="Your account"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors duration-300 hover:bg-surface hover:text-ink"
            >
              <UserRound className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
            </Link>
          )}
        </div>
      </Container>
    </motion.header>
  );
}
