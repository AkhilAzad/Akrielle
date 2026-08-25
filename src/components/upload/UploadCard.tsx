"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, X, AlertCircle, Camera } from "lucide-react";
import { cn } from "@/utils/utils";
import { formatBytes } from "@/utils/file";
import {
  ACCEPTED_FILE_EXTENSIONS_LABEL,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_LABEL,
} from "@/constants/upload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { CameraCapture } from "@/components/upload/CameraCapture";
import { Button } from "@/components/common/Button";
import { springSoft } from "@/components/animations/variants";
import type { SelectedImage, UploadError } from "@/types/upload";

interface UploadCardProps {
  onImageChange: (image: SelectedImage | null) => void;
}

const easing = [0.22, 1, 0.36, 1] as const;

export function UploadCard({ onImageChange }: UploadCardProps) {
  const {
    selectedImage,
    error,
    isDragging,
    inputRef,
    openFileDialog,
    handleFile,
    handleFiles,
    removeImage,
    dragHandlers,
  } = useFileUpload();

  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  // Propagate the validated selection up to the page whenever it changes.
  useEffect(() => {
    onImageChange(selectedImage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage]);

  return (
    <div className="flex flex-col gap-5">
      <motion.div
        {...dragHandlers}
        onClick={!selectedImage ? openFileDialog : undefined}
        role={!selectedImage ? "button" : undefined}
        tabIndex={!selectedImage ? 0 : undefined}
        aria-label={!selectedImage ? "Upload a photo — click or drag and drop" : undefined}
        onKeyDown={(event) => {
          // Only respond to keys on the dropzone itself — not on nested
          // controls (e.g. the "Use camera" button) whose events bubble up.
          if (
            event.target === event.currentTarget &&
            !selectedImage &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            openFileDialog();
          }
        }}
        animate={{ scale: isDragging ? 1.015 : 1 }}
        transition={springSoft}
        className={cn(
          "relative flex min-h-[380px] w-full flex-col items-center justify-center overflow-hidden rounded-card border transition-colors duration-500 ease-signature",
          selectedImage
            ? "border-line bg-surface p-4"
            : cn(
                "cursor-pointer border-dashed bg-surface/60 p-10 text-center",
                isDragging ? "border-accent bg-accent/5" : "border-line hover:border-ink/30"
              )
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES.join(",")}
          onChange={handleInputChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />

        <AnimatePresence mode="wait">
          {selectedImage ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: easing }}
              className="relative flex w-full flex-col items-center gap-4"
            >
              <div className="relative aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-card-sm bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.previewUrl}
                  alt="Preview of your uploaded photo"
                  className="h-full w-full object-cover"
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeImage();
                  }}
                  aria-label="Remove photo"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/70 text-paper backdrop-blur-sm transition-colors duration-300 hover:bg-charcoal"
                >
                  <X className="h-4 w-4" strokeWidth={1.8} />
                </motion.button>
              </div>
              <div className="text-center">
                <p className="max-w-[240px] truncate font-body text-sm text-ink">
                  {selectedImage.file.name}
                </p>
                <p className="text-xs text-ink-faint">
                  {formatBytes(selectedImage.file.size)}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: easing }}
              className="flex flex-col items-center gap-5"
            >
              <motion.span
                animate={{ y: isDragging ? -3 : 0, scale: isDragging ? 1.08 : 1 }}
                transition={springSoft}
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full border transition-colors duration-500",
                  isDragging ? "border-accent text-accent" : "border-line text-ink-muted"
                )}
              >
                <ImagePlus className="h-6 w-6" strokeWidth={1.4} aria-hidden="true" />
              </motion.span>

              <div className="flex flex-col items-center gap-1.5">
                <p className="text-xl font-medium tracking-tightest text-ink">
                  Drag and drop your photo
                </p>
                <p className="text-sm text-ink-muted">
                  or <span className="text-gold-deep underline underline-offset-4">click to browse</span>
                </p>
              </div>

              <p className="eyebrow text-ink-faint">
                {ACCEPTED_FILE_EXTENSIONS_LABEL} · Up to {MAX_FILE_SIZE_LABEL}
              </p>

              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px w-8 bg-line" />
                <span className="eyebrow text-ink-faint">or</span>
                <span className="h-px w-8 bg-line" />
              </div>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={(event) => {
                  // Don't let the click bubble to the dropzone (which would
                  // also open the file dialog).
                  event.stopPropagation();
                  setIsCameraOpen(true);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Camera className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                  Use camera
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <UploadErrorMessage error={error} />

      <AnimatePresence>
        {isCameraOpen && (
          <CameraCapture
            onCapture={handleFile}
            onClose={() => setIsCameraOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadErrorMessage({ error }: { error: UploadError | null }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          role="alert"
          className="flex items-center justify-center gap-2 text-sm text-accent-from"
        >
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
          {error.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
