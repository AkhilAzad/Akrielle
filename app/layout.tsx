import type { Metadata } from "next";
import { Onest } from "next/font/google";

import { AuthProvider } from "@/context/AuthContext";
import { ImageProvider } from "@/context/ImageContext";
import { AnalysisResultProvider } from "@/context/AnalysisResultContext";
import { PageTransition } from "@/components/animations/PageTransition";
import { Loader } from "@/components/layout/Loader";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { AdaptiveGrid } from "@/components/layout/AdaptiveGrid";
import { RevealObserver } from "@/components/layout/RevealObserver";

import "./globals.css";

/**
 * Lumora is set entirely in Onest. A single family across the whole
 * app (display, body, and numeric readouts) — the range of weights
 * carries the hierarchy that a serif/mono pairing used to.
 */
const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alkline — Beauty, Understood by Intelligence.",
  description:
    "Alkline is an AI Beauty Intelligence Platform. One photo, and a premium, private facial analysis returns a personalized beauty profile.",
  metadataBase: new URL("https://alkline.com"),
  openGraph: {
    title: "Alkline — Beauty, Understood by Intelligence.",
    description:
      "One photo. AI-powered facial analysis with personalized beauty recommendations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={onest.variable}>
      <body>
        <AdaptiveGrid />
        <SmoothScroll />
        <RevealObserver />
        <Loader />
        <AuthProvider>
          <ImageProvider>
            <AnalysisResultProvider>
              <PageTransition>{children}</PageTransition>
            </AnalysisResultProvider>
          </ImageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
