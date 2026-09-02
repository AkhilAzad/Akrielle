"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { FlowHeader } from "@/components/layout/FlowHeader";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { SignInStep } from "@/components/onboarding/steps/SignInStep";
import { DobStep } from "@/components/onboarding/steps/DobStep";
import { ProfileStep } from "@/components/onboarding/steps/ProfileStep";
import { DoneStep } from "@/components/onboarding/steps/DoneStep";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEFAULT_DOB,
  DEFAULT_ONBOARDING_NEXT,
  type OnboardingStepId,
} from "@/constants/onboarding";
import type { DobValue, OnboardingProfile } from "@/types/onboarding";

const easing = [0.22, 1, 0.36, 1] as const;

const STEP_IDS: readonly OnboardingStepId[] = [
  "signin",
  "dob",
  "profile",
  "done",
] as const;

/** Read a step id from the URL, defaulting to the first step. */
function sanitizeStep(raw: string | null): OnboardingStepId {
  if (raw && (STEP_IDS as readonly string[]).includes(raw)) {
    return raw as OnboardingStepId;
  }
  return "signin";
}

/** Only allow internal, absolute paths (mirrors auth's sanitizeNext rule). */
function sanitizeOnboardingNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return DEFAULT_ONBOARDING_NEXT;
}

const stepVariants = {
  enter: { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

/**
 * The onboarding wizard: a small client-side step machine over the shared
 * onboarding context. Order is Account → About you (DOB) → Profile → Done,
 * matching the product spec. Every step has an escape hatch (skip / continue
 * as guest) so the anonymous-first app never dead-ends, even when Supabase
 * accounts are unavailable.
 *
 * The Google round trip leaves and re-enters the app, so the "Continue with
 * Google" action stashes a resume URL (`/onboarding?step=dob&next=…`) that the
 * OAuth callback restores — dropping the user back at the DOB step, signed in.
 */
function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { data, hydrated, complete } = useOnboarding();

  const nextDest = useMemo(
    () => sanitizeOnboardingNext(searchParams.get("next")),
    [searchParams]
  );

  const [step, setStep] = useState<OnboardingStepId>(() =>
    sanitizeStep(searchParams.get("step"))
  );

  // Working copies of the data being collected; committed to the context on
  // finish. DOB always holds a concrete value (the picker needs one), so a
  // separate flag records whether the user actually confirmed it vs. skipped.
  const [dob, setDob] = useState<DobValue>(DEFAULT_DOB);
  const [profile, setProfile] = useState<OnboardingProfile>({ displayName: "" });
  const dobConfirmed = useRef(false);
  // The name actually committed on finish — what the Done screen greets by, so
  // it matches what the profile page later reads back (a skipped name is not
  // persisted, so it must not appear on the Done screen either).
  const [completedName, setCompletedName] = useState("");

  // Seed working state from any persisted record once hydration completes
  // (e.g. after returning from the OAuth round trip mid-flow).
  const seeded = useRef(false);
  useEffect(() => {
    if (!hydrated || seeded.current) return;
    seeded.current = true;
    if (data.dob) {
      setDob(data.dob);
      dobConfirmed.current = true;
    }
    if (data.profile) setProfile(data.profile);
  }, [hydrated, data.dob, data.profile]);

  const googleResumeHref = useMemo(
    () => `/onboarding?step=dob&next=${encodeURIComponent(nextDest)}`,
    [nextDest]
  );
  const emailSignInHref = useMemo(
    () => `/signin?next=${encodeURIComponent(googleResumeHref)}`,
    [googleResumeHref]
  );

  // A gentle prefill hint for the display-name field (local part of email).
  const emailHint = useMemo(() => {
    const email = user?.email;
    if (!email) return null;
    return email.split("@")[0] || null;
  }, [user?.email]);

  const finish = useCallback(
    (opts?: { withProfile: boolean }) => {
      const keepProfile = opts?.withProfile ?? true;
      const finalProfile =
        keepProfile && profile.displayName.trim()
          ? { displayName: profile.displayName.trim() }
          : null;
      setCompletedName(finalProfile?.displayName ?? "");
      complete({
        dob: dobConfirmed.current ? dob : null,
        profile: finalProfile,
      });
      setStep("done");
    },
    [complete, dob, profile]
  );

  const handleDobContinue = () => {
    dobConfirmed.current = true;
    setStep("profile");
  };
  const handleDobSkip = () => {
    dobConfirmed.current = false;
    setStep("profile");
  };

  const enterApp = () => router.push(nextDest);

  return (
    <>
      <FlowHeader backHref="/" />

      <main className="py-16 md:py-24">
        <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-5 sm:px-8">
          {step !== "done" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easing }}
              className="mb-12 w-full"
            >
              <OnboardingProgress current={step} />
            </motion.div>
          )}

          <div className="w-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: easing }}
              >
                {step === "signin" && (
                  <SignInStep
                    onContinue={() => setStep("dob")}
                    googleResumeHref={googleResumeHref}
                    emailSignInHref={emailSignInHref}
                  />
                )}

                {step === "dob" && (
                  <DobStep
                    value={dob}
                    onChange={setDob}
                    onContinue={handleDobContinue}
                    onBack={() => setStep("signin")}
                    onSkip={handleDobSkip}
                  />
                )}

                {step === "profile" && (
                  <ProfileStep
                    value={profile}
                    onChange={setProfile}
                    onComplete={() => finish({ withProfile: true })}
                    onBack={() => setStep("dob")}
                    onSkip={() => finish({ withProfile: false })}
                    emailHint={emailHint}
                  />
                )}

                {step === "done" && (
                  <DoneStep displayName={completedName} onEnter={enterApp} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </>
  );
}

export default function OnboardingPage() {
  // useSearchParams requires a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  );
}
