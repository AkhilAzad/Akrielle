import type { Metadata } from "next";
import Link from "next/link";

import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy · AXL",
  description:
    "How AXL handles your photo, your analysis results, and your account data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains what happens to your photo and your data when you use AXL — what we process, what we store, and what we never keep."
      lastUpdated="August 21, 2026"
    >
      <LegalSection title="The short version">
        <p>
          Your photo is used to generate your beauty analysis. If you use
          AXL <strong>without an account</strong>, nothing is stored on our
          servers — your photo and results stay in your browser for the session
          only. If you <strong>create an account</strong>, we save your analysis
          results (your beauty profile and score) so you can revisit them. By
          default we also keep the scan photo alongside those results, stored
          privately in your account and visible only to you — you can turn photo
          saving off anytime with the &ldquo;Save my photos&rdquo; switch on
          your profile.
        </p>
      </LegalSection>

      <LegalSection title="Your photo">
        <p>
          When you upload or capture a photo for a beauty scan, it is sent
          securely to our AI provider to be analyzed. That analysis step is
          transient: the provider uses the image to produce your results and
          does not retain it afterward.
        </p>
        <p>
          Whether AXL itself keeps a copy depends on your account and
          settings. Signed out, the photo is held in your browser&apos;s memory
          only for the duration of your session and is cleared when you leave or
          refresh the flow. Signed in with &ldquo;Save my photos&rdquo; on (the
          default), a downscaled copy of each scan is saved to your account so
          you can revisit it; turn the setting off and new scans are not stored.
          Saved images live in a <strong>private</strong> storage area scoped to
          your account, are reachable only by you through short-lived signed
          links, and are deleted when you delete the associated analysis.
        </p>
      </LegalSection>

      <LegalSection title="What we store">
        <p>
          If you are signed in, we store the <strong>results</strong> of each
          analysis — the beauty profile fields, recommendations, and your
          overall score — linked to your account, so your history is available
          when you return. We also store the profile details and preferences you
          choose to enter on your profile page.
        </p>
        <p>
          Images — your scan photos, any photos you add to your portfolio, and
          your profile picture — are stored only while &ldquo;Save my
          photos&rdquo; is on, and always in a private storage area scoped to
          your account (never a public location). With the setting off, we keep
          your results but not the images.
        </p>
        <p>
          If you are not signed in, your results exist only in your current
          browser session, any portfolio photos stay on your own device, and
          nothing is sent to our servers.
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
          We rely on a small number of processors to run AXL:{" "}
          <strong>OpenAI</strong> analyzes your photo,{" "}
          <strong>Supabase</strong> provides authentication, the database that
          holds your saved results and profile, and the private storage for any
          images you choose to save, and <strong>Google</strong> is used only if
          you choose to sign in with it. Each processes data solely to provide
          these functions.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You control whether your photos are kept: the &ldquo;Save my
          photos&rdquo; switch on your profile turns image storage on or off at
          any time. You can delete any saved analysis from your{" "}
          <Link href="/account">account page</Link> — which also removes its
          stored photo — and you can sign out to clear your session from this
          device. To request deletion of your account and all associated data,
          contact us at{" "}
          <a href="mailto:privacy@alkline.com">privacy@alkline.com</a>.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this policy as AXL evolves. Material changes will be
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
