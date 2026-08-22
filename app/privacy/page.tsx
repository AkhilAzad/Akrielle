import type { Metadata } from "next";
import Link from "next/link";

import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy · Alkline",
  description:
    "How Alkline handles your photo, your analysis results, and your account data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains what happens to your photo and your data when you use Alkline — what we process, what we store, and what we never keep."
      lastUpdated="August 21, 2026"
    >
      <LegalSection title="The short version">
        <p>
          Your photo is used only to generate your beauty analysis and is{" "}
          <strong>never stored on our servers</strong>. If you create an
          account, we save the resulting analysis (your beauty profile and
          score) so you can revisit it — but not the image itself. If you use
          Alkline without an account, nothing is stored on our servers at all.
        </p>
      </LegalSection>

      <LegalSection title="Your photo">
        <p>
          When you upload or capture a photo for a beauty scan, it is sent
          securely to our AI provider (OpenAI) to be analyzed. This processing
          is transient: the image is used to produce your analysis and is{" "}
          <strong>not saved to Alkline&apos;s database or file storage</strong>.
          We do not retain, share, or reuse your photo after the analysis
          completes.
        </p>
        <p>
          The photo is held in your browser&apos;s memory only for the duration
          of your session so it can be previewed and submitted. It is cleared
          when you leave or refresh the flow.
        </p>
      </LegalSection>

      <LegalSection title="What we store">
        <p>
          If you are signed in, we store the <strong>results</strong> of each
          analysis — the beauty profile fields, recommendations, and your
          overall score — linked to your account, so your history is available
          when you return. We do not store the underlying photo.
        </p>
        <p>
          If you are not signed in, your results exist only in your current
          browser session and are not sent to our servers.
        </p>
      </LegalSection>

      <LegalSection title="Account &amp; authentication data">
        <p>
          If you create an account, we store your email address and
          authentication details through our identity provider (Supabase). If
          you sign in with Google, we receive basic profile information from
          Google to establish your account. Your active session is kept in your
          browser&apos;s local storage so you stay signed in, and is removed
          when you sign out.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>
          We rely on a small number of processors to run Alkline:{" "}
          <strong>OpenAI</strong> analyzes your photo,{" "}
          <strong>Supabase</strong> provides authentication and the database
          that holds your saved results, and <strong>Google</strong> is used
          only if you choose to sign in with it. Each processes data solely to
          provide these functions.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can delete any saved analysis at any time from your{" "}
          <Link href="/account">account page</Link>, and you can sign out to
          clear your session from this device. To request deletion of your
          account and all associated results, contact us at{" "}
          <a href="mailto:privacy@alkline.com">privacy@alkline.com</a>.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this policy as Alkline evolves. Material changes will be
          reflected by the &ldquo;last updated&rdquo; date above.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about privacy? Reach us at{" "}
          <a href="mailto:privacy@alkline.com">privacy@alkline.com</a> or visit
          our <Link href="/contact">contact page</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
