"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useMusic } from "@/contexts/MusicContext";
import { cn } from "@/utils/utils";

/**
 * Minimal mute / unmute control for AXL's global background music.
 *
 * Styled to sit in the navbar alongside the account icon: a hairline circle on
 * the black canvas that warms to the crimson accent on hover/active. Purely a
 * view over the MusicProvider state.
 */
export function MusicToggle({ className }: { className?: string }) {
  const { muted, toggleMuted } = useMusic();

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-pressed={!muted}
      aria-label={muted ? "Unmute background music" : "Mute background music"}
      title={muted ? "Unmute music" : "Mute music"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted transition-colors duration-300 ease-signature hover:border-accent/50 hover:text-accent focus-visible:outline-none",
        // When playing, the icon carries the accent so the "on" state reads at a glance.
        !muted && "text-accent",
        className
      )}
    >
      {muted ? (
        <VolumeX className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.6} aria-hidden="true" />
      ) : (
        <Volume2 className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.6} aria-hidden="true" />
      )}
    </button>
  );
}
