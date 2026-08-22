import type { ReportModel } from "@/lib/report/model";

/**
 * A print-optimized Beauty Report. Rendered on the /report route and
 * designed to be saved as a PDF via the browser's native print dialog.
 * Uses Alkline's Lumora palette and type system directly, so the exported
 * PDF carries the same editorial character as the site — a light paper
 * canvas, ink text, and a single burnt-orange accent used sparingly. It is
 * set entirely in Onest: headings read as tight-tracked weights, and the
 * small uppercase instrument labels stand in for Lumora's eyebrow style.
 *
 * Layout is tuned for print: sections and cards use break-inside-avoid
 * so a card is never split across a page boundary, and colors are
 * forced on via print-color-adjust (set globally for .report-sheet).
 */

const priorityTone: Record<string, string> = {
  High: "border-gold/40 bg-gold/10 text-gold-deep",
  Medium: "border-ink-faint/40 bg-ink-faint/10 text-ink-muted",
  Low: "border-line bg-surface text-ink-faint",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
      {children}
    </p>
  );
}

export function PrintableReport({
  model,
  generatedAt,
}: {
  model: ReportModel;
  generatedAt: string;
}) {
  return (
    <article className="report-sheet mx-auto w-full max-w-[820px] bg-paper px-10 py-12 text-ink md:px-14">
      {/* Masthead */}
      <header className="flex items-end justify-between border-b border-ink/15 pb-6">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-widest3 text-ink">
            Alkline
          </p>
          <p className="mt-1 font-body text-[11px] text-ink-muted">
            Beauty, Understood by Intelligence.
          </p>
        </div>
        <div className="text-right">
          <h1 className="font-display text-2xl font-medium leading-none">
            Beauty Report
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
            {generatedAt}
          </p>
        </div>
      </header>

      {/* Score + Glow-up */}
      <section className="mt-10 grid grid-cols-2 gap-6 break-inside-avoid">
        <div className="rounded-card-sm border border-line bg-surface px-7 py-6">
          <Label>Beauty Harmony Score</Label>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-5xl font-semibold leading-none tracking-tightest text-ink">
              {model.score}
            </span>
            <span className="font-mono text-sm text-ink-faint">/ 100</span>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest2 text-gold-deep">
            AI Confidence · {model.confidence}%
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
            {model.scoreDescription}
          </p>
        </div>

        <div className="rounded-card-sm border border-line bg-surface px-7 py-6">
          <Label>Glow-Up Potential</Label>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold tracking-tightest text-ink-muted">
              {model.glowUp.current}
            </span>
            <span className="font-mono text-lg text-gold">→</span>
            <span className="font-display text-3xl font-semibold tracking-tightest text-ink">
              {model.glowUp.potential}
            </span>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
            {model.glowUp.reason}
          </p>
        </div>
      </section>

      {/* Beauty Profile */}
      <section className="mt-10 break-inside-avoid">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-medium">Beauty Profile</h2>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5">
          {model.profile.map((item) => (
            <div key={item.label} className="break-inside-avoid">
              <div className="flex items-baseline justify-between">
                <Label>{item.label}</Label>
                <span className="font-mono text-[10px] text-ink-faint">
                  {item.confidence}%
                </span>
              </div>
              <p className="mt-1 font-display text-lg font-medium tracking-tightest text-ink">
                {item.value}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Complete Facial Analysis */}
      <section className="mt-10">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-medium">
            Complete Facial Analysis
          </h2>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4">
          {model.facial.map((item, index) => (
            <div
              key={`${item.feature}-${index}`}
              className="flex break-inside-avoid flex-col border-l border-gold/30 pl-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-body text-[13px] font-semibold text-ink">
                  {item.feature}
                </span>
                <span className="font-mono text-[10px] text-ink-faint">
                  {item.confidence}%
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest2 text-gold-deep">
                {item.status}
              </span>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Highest-Impact Improvements */}
      <section className="mt-10">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-medium">
            Highest-Impact Improvements
          </h2>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>
        <div className="mt-5 flex flex-col gap-4">
          {model.improvements.map((item) => (
            <div
              key={item.rank}
              className="flex break-inside-avoid gap-4 rounded-control border border-line bg-surface px-5 py-4"
            >
              <span className="font-display text-2xl font-semibold tracking-tightest text-gold-deep">
                {String(item.rank).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-body text-[14px] font-semibold text-ink">
                    {item.area}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 ${
                      priorityTone[item.priority] ?? priorityTone.Low
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
                  {item.explanation}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-ink">
                  <span className="font-semibold">Expected improvement: </span>
                  {item.expectedImprovement}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section className="mt-10">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-medium">Recommendations</h2>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5">
          {model.recommendations.map((item) => (
            <div key={item.category} className="break-inside-avoid">
              <Label>{item.category}</Label>
              <p className="mt-1 font-body text-[13px] font-semibold leading-snug text-ink">
                {item.value}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-ink/15 pt-5">
        <p className="font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">
          Generated by Alkline AI from your uploaded photo · {generatedAt}
        </p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-ink-faint">
          This report reflects an AI reading of a single photo and is intended
          as cosmetic guidance, not a medical or dermatological assessment.
        </p>
      </footer>
    </article>
  );
}
