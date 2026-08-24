"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { FlowHeader } from "@/components/layout/FlowHeader";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/contexts/AuthContext";
import {
  POST_AUTH_NEXT_KEY,
  sanitizeNext,
} from "@/auth/constants";

const easing = [0.22, 1, 0.36, 1] as const;

type Mode = "signin" | "signup";

const fieldClass =
  "w-full rounded-control border border-line bg-paper px-4 py-3 text-[15px] text-ink " +
  "placeholder:text-ink-faint transition-colors duration-300 " +
  "focus:border-accent focus-visible:outline-none";

/** Google's multi-color "G" mark, inlined so no external asset is needed. */
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function SignInInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, configured, signIn, signUp, signInWithGoogle } = useAuth();

  const next = sanitizeNext(searchParams.get("next"));

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Already signed in → nothing to do here.
  useEffect(() => {
    if (status === "signed-in") router.replace(next);
  }, [status, next, router]);

  const switchMode = (target: Mode) => {
    setMode(target);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    setPending(true);
    if (mode === "signin") {
      const res = await signIn(email, password);
      setPending(false);
      if (res.ok) {
        router.replace(next);
        return;
      }
      setError(res.message);
    } else {
      const res = await signUp(email, password);
      setPending(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      if (res.needsConfirmation) {
        setNotice(
          "Almost there — check your email to confirm your account, then sign in."
        );
        setMode("signin");
        return;
      }
      router.replace(next);
    }
  };

  const handleGoogle = () => {
    // Stash the return path so the OAuth callback can restore it after the
    // full-page round trip (survives in sessionStorage within this tab).
    try {
      window.sessionStorage.setItem(POST_AUTH_NEXT_KEY, next);
    } catch {
      // If storage is unavailable the callback simply falls back to /account.
    }
    signInWithGoogle();
  };

  const isSignIn = mode === "signin";

  return (
    <>
      <FlowHeader backHref="/" />

      <main className="py-16 md:py-24">
        <Container className="flex max-w-[460px] flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing }}
          >
            <SectionHeading
              eyebrow="Your AXL account"
              title={isSignIn ? "Welcome back." : "Create your account."}
              description={
                isSignIn
                  ? "Sign in to save your beauty analyses and revisit them anytime."
                  : "Save your beauty analyses and revisit your history whenever you like."
              }
              align="center"
              className="items-center"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: easing }}
            className="mt-10 w-full rounded-card-sm border border-line bg-surface p-6 shadow-subtle sm:p-8"
          >
            {!configured ? (
              <p className="text-center text-[15px] leading-relaxed text-ink-muted">
                Accounts aren&apos;t available right now. You can still run a
                full beauty scan — no sign-in required.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="group flex w-full items-center justify-center gap-3 rounded-full border border-ink/20 bg-white px-6 py-3 text-[15px] font-medium text-ink transition-colors duration-300 hover:border-ink/50 focus-visible:outline-none"
                >
                  <GoogleGlyph />
                  Continue with Google
                </button>

                <div className="my-6 flex items-center gap-4">
                  <span className="hairline" />
                  <span className="whitespace-nowrap text-[11px] uppercase tracking-widest2 text-ink-faint">
                    or
                  </span>
                  <span className="hairline" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-ink">Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={fieldClass}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-ink">Password</span>
                    <input
                      type="password"
                      autoComplete={isSignIn ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignIn ? "Your password" : "At least 6 characters"}
                      className={fieldClass}
                    />
                  </label>

                  {error && (
                    <p
                      role="alert"
                      className="text-sm leading-relaxed text-ink"
                    >
                      <span className="font-medium text-gold-deep">
                        Couldn&apos;t continue.
                      </span>{" "}
                      {error}
                    </p>
                  )}
                  {notice && (
                    <p className="text-sm leading-relaxed text-ink-muted">
                      {notice}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={pending}
                    className="mt-2 w-full"
                  >
                    {pending ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        {isSignIn ? "Signing in…" : "Creating account…"}
                      </span>
                    ) : isSignIn ? (
                      "Sign in"
                    ) : (
                      "Create account"
                    )}
                  </Button>
                </form>
              </>
            )}
          </motion.div>

          {configured && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-6 text-sm text-ink-muted"
            >
              {isSignIn ? "New to AXL? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(isSignIn ? "signup" : "signin")}
                className="font-medium text-gold-deep underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {isSignIn ? "Create an account" : "Sign in"}
              </button>
            </motion.p>
          )}
        </Container>
      </main>
    </>
  );
}

export default function SignInPage() {
  // useSearchParams requires a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
