"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { PrintableReport } from "@/components/report/PrintableReport";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAnalysisResult } from "@/contexts/AnalysisResultContext";
import { buildReportModel } from "@/lib/report/model";

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ReportPage() {
  return (
    <RequireAuth>
      <ReportPageContent />
    </RequireAuth>
  );
}

function ReportPageContent() {
  const { result } = useAnalysisResult();

  // Compute the date after mount so server and client markup agree.
  const [generatedAt, setGeneratedAt] = useState("");
  useEffect(() => {
    setGeneratedAt(formatToday());
  }, []);

  const model = useMemo(
    () => (result ? buildReportModel(result) : null),
    [result]
  );

  // No analysis in this session (direct visit / refresh) — friendly empty state.
  if (!model) {
    return (
      <>
        <FlowHeader backHref="/upload" />
        <main className="py-16 md:py-24">
          <Container className="flex max-w-[480px] flex-col items-center text-center">
            <SectionHeading
              eyebrow="Beauty Report"
              title="No report to export."
              description="We couldn't find a completed analysis for this session. Upload a photo to generate your beauty profile first."
              align="center"
              className="items-center"
            />
            <div className="mt-10">
              <Button href="/upload" size="lg">
                Upload a Photo
              </Button>
            </div>
          </Container>
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface/50">
      {/* On-screen action bar — hidden when printing. */}
      <div className="no-print sticky top-0 z-10 border-b border-line bg-paper/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-[820px] items-center justify-between px-6 py-3">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest2 text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden="true" />
            Back to Results
          </Link>
          <Button size="md" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
            Save as PDF
          </Button>
        </div>
      </div>

      {/* Hint line — screen only. */}
      <p className="no-print mx-auto max-w-[820px] px-6 pt-6 text-center font-body text-[12px] text-ink-muted print:hidden">
        Preview of your Beauty Report. Choose{" "}
        <span className="font-semibold text-ink">Save as PDF</span> to download,
        or select &ldquo;Save as PDF&rdquo; as the destination in the print dialog.
      </p>

      {/* The printable document. On screen it sits on a soft backdrop as a
          document card; in print it fills the page (see globals.css). */}
      <div className="px-4 py-6 md:py-8">
        <div className="mx-auto max-w-[820px] overflow-hidden rounded-card shadow-lift print:rounded-none print:shadow-none">
          <PrintableReport model={model} generatedAt={generatedAt} />
        </div>
      </div>
    </div>
  );
}
