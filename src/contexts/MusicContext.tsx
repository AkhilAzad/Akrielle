"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Global background music for AXL.
 *
 * Mounted once in the root layout so the single <audio> element survives
 * client-side route changes — the track keeps playing seamlessly as the user
 * moves between pages instead of restarting on every navigation.
 *
 * Autoplay policy: browsers block sound until the user has interacted with the
 * page, so we never call play() on mount. Instead we listen for the first
 * meaningful interaction (pointer / key / touch) and start playback then,
 * retrying on subsequent interactions if the first gesture didn't grant an
 * autoplay activation. The user's mute choice is remembered in localStorage.
 *
 * This context owns presentation only — it touches no auth, data, or network
 * logic.
 */

// The file lives at public/audio/USE THIS SONG.mp3; spaces are URL-encoded so
// the browser requests the asset Next.js serves from /public.
const MUSIC_SRC = "/audio/USE%20THIS%20SONG.mp3";
const STORAGE_KEY = "axl:music-muted";
/** Kept gentle so the track sits behind the UI as ambiance, not a foreground. */
const VOLUME = 0.35;

interface MusicContextValue {
  /** True when the user has silenced the background track. */
  muted: boolean;
  /** Flip mute on/off (also (re)starts playback when unmuting). */
  toggleMuted: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  // Latest muted value for use inside stable event handlers without re-binding.
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // Whether playback has successfully begun (so we only wire up autoplay once).
  const startedRef = useRef(false);

  // Restore the saved mute preference after mount. Reading in an effect (rather
  // than during render) keeps the server and first client render identical.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "true") setMuted(true);
    } catch {
      /* localStorage may be unavailable (privacy mode) — default to unmuted. */
    }
  }, []);

  // Mirror the muted state onto the element whenever it changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, [muted]);

  // Begin playback on the first meaningful interaction (autoplay-safe).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = VOLUME;

    function tryStart() {
      const audioEl = audioRef.current;
      if (startedRef.current || !audioEl) return;
      audioEl.muted = mutedRef.current;
      const played = audioEl.play();
      if (played && typeof played.then === "function") {
        played
          .then(() => {
            startedRef.current = true;
            cleanup();
          })
          .catch(() => {
            /* Gesture didn't grant activation yet — try the next one. */
          });
      } else {
        startedRef.current = true;
        cleanup();
      }
    }

    function cleanup() {
      window.removeEventListener("pointerdown", tryStart);
      window.removeEventListener("keydown", tryStart);
      window.removeEventListener("touchstart", tryStart);
      window.removeEventListener("click", tryStart);
    }

    window.addEventListener("pointerdown", tryStart);
    window.addEventListener("keydown", tryStart);
    window.addEventListener("touchstart", tryStart, { passive: true });
    window.addEventListener("click", tryStart);

    return cleanup;
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      const audio = audioRef.current;
      if (audio) {
        audio.muted = next;
        // Unmuting is itself a user gesture, so this play() is always allowed —
        // covers the case where the very first interaction is this button.
        if (!next) {
          startedRef.current = true;
          void audio.play().catch(() => {});
        }
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* Persistence is best-effort; ignore quota/privacy errors. */
      }
      return next;
    });
  }, []);

  return (
    <MusicContext.Provider value={{ muted, toggleMuted }}>
      {children}
      {/* Decorative background track; hidden from assistive tech and layout. */}
      <audio
        ref={audioRef}
        src={MUSIC_SRC}
        loop
        preload="auto"
        aria-hidden="true"
      />
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return ctx;
}
