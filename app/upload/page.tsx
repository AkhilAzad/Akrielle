
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { UploadCard } from "@/components/upload/UploadCard";
import { PrivacyNotice } from "@/components/upload/PrivacyNotice";
import { useImage } from "@/context/ImageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import type { SelectedImage } from "@/types/upload";
 
const easing = [0.22, 1, 0.36, 1] as const;
 
export default function UploadPage() {
  return (
    <RequireAuth>
      <UploadPageContent />
    </RequireAuth>
  );
}

function UploadPageContent() {
  const router = useRouter();
  const { image, setImage } = useImage();
  const { hydrated, hasCompleted } = useOnboarding();

  // First-run guard: newcomers are routed through onboarding before the scan
  // flow. Anonymous users who've completed (or skipped) onboarding pass freely.
  useEffect(() => {
    if (hydrated && !hasCompleted) {
      router.replace(`/onboarding?next=${encodeURIComponent("/upload")}`);
    }
  }, [hydrated, hasCompleted, router]);
 
  const handleImageChange = (selected: SelectedImage | null) => {
    setImage(selected ? selected.file : null);
  };
 
  const handleContinue = () => {
    if (!image) return;
    // The image is now preserved across navigation via ImageContext;
    // no backend/storage is wired up here by design.
    router.push("/analysis");
  };

  // While the onboarding decision is pending, or during the redirect for a
  // first-time visitor, show a minimal loader instead of flashing the form.
  if (!hydrated || !hasCompleted) {
    return (
      <>
        <FlowHeader backHref="/" />
        <main className="flex min-h-[60vh] items-center justify-center py-24">
          <Loader2
            className="h-8 w-8 animate-spin text-gold-deep"
            aria-hidden="true"
          />
        </main>
      </>
    );
  }
 
  return (
    <>
      <FlowHeader backHref="/" />
 
      <main className="py-16 md:py-24">
        <Container className="flex max-w-[640px] flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing }}
          >
            <SectionHeading
              eyebrow="Step 1 of 3"
              title="Upload your photo."
              description="A single, well-lit photo is all AXL needs to begin your beauty analysis."
              align="center"
              className="items-center"
            />
          </motion.div>
 
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: easing }}
            className="mt-12 w-full"
          >
            <UploadCard onImageChange={handleImageChange} />
          </motion.div>
 
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            <PrivacyNotice />
          </motion.div>
 
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: easing }}
            className="mt-10 flex w-full flex-col-reverse gap-4 sm:flex-row sm:justify-center"
          >
            <Button href="/" variant="secondary" size="lg" className="sm:w-auto">
              Back
            </Button>
            <Button
              size="lg"
              showArrow
              disabled={!image}
              onClick={handleContinue}
              className="sm:w-auto"
            >
              Continue
            </Button>
          </motion.div>
        </Container>
      </main>
    </>
  );
}