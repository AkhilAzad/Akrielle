import type { Metadata } from "next";

import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";
import { Button } from "@/components/common/Button";

export const metadata: Metadata = {
  title: "Contact · AXL",
  description: "Get in touch with the AXL team.",
};

export default function ContactPage() {
  return (
    <LegalLayout
      eyebrow="Company"
      title="Contact us"
      intro="We'd love to hear from you — whether it's a question, a piece of feedback, or a request about your data."
    >
      <LegalSection title="Email">
        <p>
          The fastest way to reach us is by email. We read everything and aim to
          reply within a couple of business days.
        </p>
        <p>
          <a
            href="mailto:hello@alkline.com"
            className="text-2xl font-medium tracking-tightest text-ink transition-colors hover:text-accent"
          >
            hello@alkline.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Privacy &amp; your data">
        <p>
          For anything related to your account, saved results, or data deletion,
          write to{" "}
          <a href="mailto:privacy@alkline.com">privacy@alkline.com</a> and we
          &apos;ll take care of it.
        </p>
      </LegalSection>

      <div className="pt-2">
        <Button href="/upload" size="lg" showArrow>
          Start your beauty scan
        </Button>
      </div>
    </LegalLayout>
  );
}
