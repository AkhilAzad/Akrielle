"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/utils";

/**
 * Live local-time readout used in the header and the nav overlay — one of
 * Lumora's small "studio" signatures. Renders empty on the server and fills
 * in on mount, so there's no hydration mismatch from clock drift.
 */
export function Clock({
  className,
  withLabel = false,
}: {
  className?: string;
  withLabel?: boolean;
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    setTime(format());
    const id = window.setInterval(() => setTime(format()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      className={cn("inline-flex items-center gap-2 tabular-nums", className)}
      suppressHydrationWarning
    >
      {withLabel && (
        <span className="text-ink-faint">Local</span>
      )}
      <span aria-hidden={time === ""}>{time || "--:--:--"}</span>
    </span>
  );
}
