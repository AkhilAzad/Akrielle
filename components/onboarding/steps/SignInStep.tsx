"use client";

import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/common/Button";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useAuth } from "@/context/AuthContext";
import { POST_AUTH_NEXT_KEY } from "@/constants/auth";

interface SignInStepProps {
  /** Proceed to the next onboarding step (continues anonymously). */
  onContinue: () => void;
  /**
   * Where the OAuth round-trip should return to (an onboarding URL that
   * resumes at the DOB step). Stashed for the callback page to restore.
   */
  googleResumeHref: string;
  /** Link target for the email option — the existing /signin, set to return here. */
  emailSignInHref: string;
}

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

/**
 * Step 1 — account. Google sign-in is the headline action, mirroring the
 * spec ("Google Sign-In first"). Because the app is anonymous-first and
 * Supabase may be dormant, there's always a way forward:
 *  - configured + signed-out → Google (primary), email (/signin), or skip
 *  - configured + signed-in  → confirm identity, continue
 *  - not configured          → a plain "Continue" (accounts unavailable)
 */
export function SignInStep({
  onContinue,
  googleResumeHref,
  emailSignInHref,
}: SignInStepProps) {
  const { status, configured, user, signInWithGoogle } = useAuth();

  const handleGoogle = () => {
    // Stash the return path so /auth/callback resumes onboarding at the DOB
    // step after the full-page OAuth round trip (same-tab sessionStorage).
    try {
      window.sessionStorage.setItem(POST_AUTH_NEXT_KEY, googleResumeHref);
    } catch {
      // If storage is blocked the callback falls back to its default path.
    }
    signInWithGoogle();
  };

  const signedIn = configured && status === "signed-in";

  return (
    <div className="flex flex-col items-center">
      <SectionHeading
        eyebrow="Your account"
        title={signedIn ? "You're signed in." : "Create your account."}
        description={
          signedIn
            ? "Continue setting up your beauty profile."
            : "Sign in to save your analyses and revisit them anytime — or continue as a guest."
        }
        align="center"
        className="items-center"
      />

      <div className="mt-10 w-full rounded-card-sm border border-line bg-surface p-6 shadow-subtle sm:p-8">
        {!configured ? (
          <div className="flex flex-col gap-6 text-center">
            <p className="text-[15px] leading-relaxed text-ink-muted">
              Accounts aren&apos;t available right now. You can still set up
              your beauty profile and run a full scan — no sign-in required.
            </p>
            <Button size="lg" showArrow onClick={onContinue} className="w-full">
              Continue
            </Button>
          </div>
        ) : signedIn ? (
          <div className="flex flex-col gap-6 text-center">
            <span className="inline-flex items-center justify-center gap-2 text-[15px] text-ink">
              <CheckCircle2
                className="h-5 w-5 text-success"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              Signed in{user?.email ? ` as ${user.email}` : ""}
            </span>
            <Button size="lg" showArrow onClick={onContinue} className="w-full">
              Continue
            </Button>
          </div>
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

            <div className="flex flex-col items-center gap-4">
              <Button
                href={emailSignInHref}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Continue with email
              </Button>
              <button
                type="button"
                onClick={onContinue}
                className="text-sm font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-none"
              >
                Continue without an account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
