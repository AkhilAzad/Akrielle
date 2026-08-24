"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, LogOut, Trash2, ArrowRight } from "lucide-react";

import { FlowHeader } from "@/components/layout/FlowHeader";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalysisResult } from "@/contexts/AnalysisResultContext";
import type { SavedAnalysis } from "@/types/account";

const easing = [0.22, 1, 0.36, 1] as const;

function formatWhen(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  return {
    date: d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

interface HistoryCardProps {
  item: SavedAnalysis;
  deleting: boolean;
  onView: () => void;
  onDelete: () => void;
}

function HistoryCard({ item, deleting, onView, onDelete }: HistoryCardProps) {
  const when = formatWhen(item.createdAt);
  return (
    <li className="flex flex-col gap-4 rounded-card-sm border border-line bg-surface p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-control border border-line bg-paper">
          <span className="font-display text-2xl leading-none tracking-tightest text-ink">
            {Math.round(item.beautyScore)}
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-widest2 text-ink-faint">
            Score
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-medium text-ink">{when.date}</span>
          {when.time && (
            <span className="font-mono text-xs text-ink-muted">{when.time}</span>
          )}
          <span className="text-xs text-ink-muted">
            {item.result.faceShape} · {item.result.skinTone}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={onView}
          className="group inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors duration-300 hover:border-ink/50 focus-visible:outline-none"
        >
          View
          <ArrowRight
            className="h-4 w-4 transition-transform duration-500 ease-signature group-hover:translate-x-1"
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label="Delete this analysis"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-faint transition-colors duration-300 hover:bg-surface hover:text-ink focus-visible:outline-none disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
          )}
        </button>
      </div>
    </li>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { status, user, signOut, listHistory, removeHistory } = useAuth();
  const { setResult } = useAnalysisResult();

  // null = still loading history; [] = loaded, empty.
  const [items, setItems] = useState<SavedAnalysis[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const signOutRef = useRef(false);

  // Gate the page: send anonymous visitors to sign in (and remember to come
  // back here). After an intentional sign-out, go home instead.
  useEffect(() => {
    if (status === "signed-out") {
      if (signOutRef.current) router.replace("/");
      else router.replace(`/signin?next=${encodeURIComponent("/account")}`);
    }
  }, [status, router]);

  // Load history once signed in.
  useEffect(() => {
    if (status !== "signed-in") return;
    let active = true;
    setItems(null);
    void listHistory().then((rows) => {
      if (active) setItems(rows);
    });
    return () => {
      active = false;
    };
  }, [status, listHistory]);

  const handleView = (item: SavedAnalysis) => {
    // Already in the user's history — mark persisted so the results page
    // doesn't save a duplicate.
    setResult(item.result, { persisted: true });
    router.push("/results");
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const ok = await removeHistory(id);
    setDeletingId(null);
    if (ok) {
      setItems((prev) => (prev ? prev.filter((x) => x.id !== id) : prev));
    }
  };

  const handleSignOut = async () => {
    signOutRef.current = true;
    await signOut();
  };

  // While restoring the session, or mid-redirect for anonymous visitors.
  if (status !== "signed-in") {
    return (
      <>
        <FlowHeader backHref="/" />
        <main className="py-24 md:py-32">
          <Container className="flex flex-col items-center gap-4 text-center">
            <Loader2
              className="h-8 w-8 animate-spin text-gold-deep"
              aria-hidden="true"
            />
            <p className="font-body text-[15px] text-ink-muted">Loading…</p>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <FlowHeader backHref="/" />

      <main className="py-16 md:py-24">
        <Container className="flex max-w-[720px] flex-col">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing }}
            className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
          >
            <SectionHeading
              eyebrow="Your account"
              title="Your beauty history."
              description={
                user?.email
                  ? `Signed in as ${user.email}.`
                  : "Your saved analyses, all in one place."
              }
            />
            <button
              type="button"
              onClick={handleSignOut}
              className="group inline-flex shrink-0 items-center gap-2 self-start text-sm text-ink-muted transition-colors duration-300 hover:text-ink focus-visible:outline-none sm:self-auto"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
              Sign out
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: easing }}
            className="mt-12"
          >
            {items === null ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <Loader2
                  className="h-6 w-6 animate-spin text-gold-deep"
                  aria-hidden="true"
                />
                <p className="text-sm text-ink-muted">
                  Loading your saved analyses…
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-6 rounded-card border border-dashed border-line bg-surface/60 py-16 text-center">
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-2xl text-ink">
                    No saved analyses yet.
                  </h3>
                  <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-ink-muted">
                    Run a beauty scan and it&apos;ll be saved here automatically,
                    ready to revisit anytime.
                  </p>
                </div>
                <Button href="/upload" size="lg" showArrow>
                  Start a beauty scan
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    deleting={deletingId === item.id}
                    onView={() => handleView(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </ul>
            )}
          </motion.div>
        </Container>
      </main>
    </>
  );
}
