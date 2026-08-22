"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { FlowHeader } from "@/components/layout/FlowHeader";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";
import {
  POST_AUTH_NEXT_KEY,
  DEFAULT_POST_AUTH_PATH,
  sanitizeNext,
} from "@/constants/auth";

const easing = [0.22, 1, 0.36, 1] as const;

/**
 * Landing page for the OAuth redirect. Supabase sends the browser here with
 * the tokens in the URL fragment (#access_token=...). We hand the fragment to
 * the AuthContext to build a session, then bounce the user to wherever they
 * were headed before signing in.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { completeOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  // React 18 StrictMode double-invokes effects in dev; guard so we only
  // consume the one-time hash tokens once.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const hash = window.location.hash;

    let next = DEFAULT_POST_AUTH_PATH;
    try {
      next = sanitizeNext(window.sessionStorage.getItem(POST_AUTH_NEXT_KEY));
      window.sessionStorage.removeItem(POST_AUTH_NEXT_KEY);
    } catch {
      // Fall back to the default path.
    }

    void completeOAuth(hash).then((res) => {
      if (res.ok) {
        // Strip the token fragment from history, then continue.
        router.replace(next);
      } else {
        setError(res.message ?? "Sign-in didn't complete. Please try again.");
      }
    });
  }, [completeOAuth, router]);

  return (
    <>
      <FlowHeader backHref="/" />

      <main className="py-24 md:py-32">
        <Container className="flex max-w-[460px] flex-col items-center text-center">
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easing }}
              className="flex flex-col items-center gap-6"
            >
              <div className="flex flex-col gap-3">
                <span className="eyebrow justify-center gap-3">
                  <span className="eyebrow-dot" aria-hidden="true" />
                  Sign-in
                </span>
                <h1 className="text-3xl font-medium leading-[1.15] md:text-4xl">
                  We couldn&apos;t finish signing you in.
                </h1>
                <p className="mx-auto max-w-md font-body text-[15px] leading-relaxed text-ink-muted">
                  {error}
                </p>
              </div>
              <Button href="/signin" size="lg" showArrow>
                Back to sign in
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2
                className="h-8 w-8 animate-spin text-gold-deep"
                aria-hidden="true"
              />
              <p className="font-body text-[15px] text-ink-muted">
                Completing your sign-in…
              </p>
            </motion.div>
          )}
        </Container>
      </main>
    </>
  );
}
