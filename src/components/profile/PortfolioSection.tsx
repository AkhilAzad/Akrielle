"use client";

import { useRef, useState } from "react";
import { Camera, Images, ImagePlus, Trash2, X } from "lucide-react";

import { ProfileSection } from "@/components/profile/ProfileSection";
import { ghostPillClass, solidPillClass } from "@/components/profile/fields";
import { usePortfolio } from "@/contexts/PortfolioContext";
import type { PortfolioAddReason } from "@/contexts/PortfolioContext";
import { useImage } from "@/contexts/ImageContext";
import { useProfile } from "@/contexts/ProfileContext";
import { PORTFOLIO_MAX_ITEMS } from "@/constants/profile";
import { ACCEPTED_FILE_TYPES } from "@/constants/upload";

function messageFor(reason: PortfolioAddReason | undefined): string {
  switch (reason) {
    case "full":
      return `Your portfolio is full — remove one to add another (max ${PORTFOLIO_MAX_ITEMS}).`;
    case "invalid":
      return "That file couldn't be read as an image.";
    case "storage":
      return "Couldn't save — this device's storage may be full.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/**
 * Uploads / portfolio — a small, local gallery of recent photos.
 *
 * Self-contained so it never touches the upload page: it owns its own file
 * input, downscales + stores photos locally via the portfolio context (capped
 * and privacy-aware), and can also snapshot the current in-session photo. When
 * the "save photos" preference is off, adding is disabled but existing photos
 * remain visible and removable.
 */
export function PortfolioSection() {
  const { items, hydrated, count, isFull, addFromFile, remove, clearAll } =
    usePortfolio();
  const { image } = useImage();
  const { data: profile } = useProfile();
  const savePhotos = profile.app.savePhotos;

  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = hydrated && savePhotos && !isFull && !busy;

  const addFile = async (file: File) => {
    setError(null);
    setBusy(true);
    const res = await addFromFile(file);
    if (!res.ok) setError(messageFor(res.reason));
    setBusy(false);
  };

  const handleInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    // Reset the input so re-picking the same file still fires onChange.
    event.target.value = "";
    if (file) await addFile(file);
  };

  const openPicker = () => inputRef.current?.click();

  const clearAllPill = count > 0 && (
    <button type="button" onClick={clearAll} className={ghostPillClass}>
      <Trash2 className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
      Clear all
    </button>
  );

  return (
    <ProfileSection
      eyebrow="Portfolio"
      title="Your recent photos."
      description={`A private gallery kept on this device — up to ${PORTFOLIO_MAX_ITEMS} photos.`}
      action={clearAllPill || undefined}
    >
      {/* Shared hidden file input for both add controls. */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES.join(",")}
        onChange={handleInputChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {!hydrated ? (
        <p className="text-[15px] text-ink-muted">Loading your photos…</p>
      ) : count > 0 ? (
        <div className="flex flex-col gap-6">
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {items.map((item) => (
              <li
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-control border border-line bg-surface-2"
              >
                {/* Stored JPEG data URL — plain img keeps next/image config out. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.dataUrl}
                  alt={item.name || "Saved portfolio photo"}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label="Remove photo"
                  className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-charcoal/70 text-ivory opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:bg-charcoal focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <PortfolioControls
            canAdd={canAdd}
            busy={busy}
            hasSessionImage={Boolean(image)}
            onAdd={openPicker}
            onSaveCurrent={() => image && addFile(image)}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 rounded-card-sm border border-dashed border-line bg-paper/60 px-6 py-12 text-center">
          <Images
            className="h-8 w-8 text-ink-faint"
            strokeWidth={1.4}
            aria-hidden="true"
          />
          <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-ink-muted">
            No photos yet. Add a few to keep a private, on-device gallery of your
            recent looks.
          </p>
          <PortfolioControls
            canAdd={canAdd}
            busy={busy}
            hasSessionImage={Boolean(image)}
            onAdd={openPicker}
            onSaveCurrent={() => image && addFile(image)}
          />
        </div>
      )}

      {/* Status line — errors first, then contextual notes. */}
      {error ? (
        <p className="mt-4 text-sm text-accent" role="alert">
          {error}
        </p>
      ) : hydrated && !savePhotos ? (
        <p className="mt-4 text-sm text-ink-muted">
          Photo saving is off. Enable it in Preferences to add photos.
        </p>
      ) : hydrated && savePhotos && isFull ? (
        <p className="mt-4 text-sm text-ink-muted">
          You&apos;ve reached the {PORTFOLIO_MAX_ITEMS}-photo limit. Remove one to
          add another.
        </p>
      ) : null}
    </ProfileSection>
  );
}

/** The add-photo / save-current controls, shared by the empty and filled states. */
function PortfolioControls({
  canAdd,
  busy,
  hasSessionImage,
  onAdd,
  onSaveCurrent,
}: {
  canAdd: boolean;
  busy: boolean;
  hasSessionImage: boolean;
  onAdd: () => void;
  onSaveCurrent: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className={solidPillClass}
      >
        <ImagePlus className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        {busy ? "Adding…" : "Add photo"}
      </button>
      {hasSessionImage && (
        <button
          type="button"
          onClick={onSaveCurrent}
          disabled={!canAdd}
          className={ghostPillClass}
        >
          <Camera className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
          Save current photo
        </button>
      )}
    </div>
  );
}
