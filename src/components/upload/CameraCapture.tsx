"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, RotateCcw, X, AlertCircle } from "lucide-react";
import { cn } from "@/utils/utils";
import { springSoft } from "@/components/animations/variants";
import { Button } from "@/components/common/Button";

interface CameraCaptureProps {
  /** Receives the captured photo as a normal File, ready for the existing
   * upload/validation/analysis pipeline. */
  onCapture: (file: File) => void;
  /** Close the camera without capturing. */
  onClose: () => void;
}

type CameraStatus = "initializing" | "ready" | "captured" | "error";

const easing = [0.22, 1, 0.36, 1] as const;

/**
 * Live camera capture as a lightweight modal. Streams the rear/environment
 * camera when available, lets the user snap a still, review it, and either
 * retake or confirm. Confirming hands a real image/jpeg File back to the
 * parent so it flows through the exact same path as a device upload.
 */
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedFileRef = useRef<File | null>(null);

  const [status, setStatus] = useState<CameraStatus>("initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  // Stop every track so the camera light turns off and the device is released.
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startStream = useCallback(async () => {
    // Unsupported browser / insecure context — getUserMedia unavailable.
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      setStatus("error");
      setErrorMessage(
        "Your browser doesn't support camera capture. Please upload a photo instead."
      );
      return;
    }

    setStatus("initializing");
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // Prefer the rear camera on phones; `ideal` still succeeds on
        // laptops/desktops that only have a front-facing webcam.
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // play() can reject if the element is interrupted; safe to ignore.
        await videoRef.current.play().catch(() => {});
      }

      setStatus("ready");
    } catch (err) {
      stopStream();

      const denied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError" ||
          err.name === "SecurityError");

      setStatus("error");
      setErrorMessage(
        denied
          ? "Camera access was blocked. Allow camera permission in your browser, or upload a photo instead."
          : "We couldn't start your camera. It may be in use by another app — please upload a photo instead."
      );
    }
  }, [stopStream]);

  // Start the camera on mount; always release it on unmount.
  useEffect(() => {
    startStream();
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke the captured preview URL when it's replaced or on unmount.
  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  const handleClose = useCallback(() => {
    stopStream();
    onClose();
  }, [stopStream, onClose]);

  // Close on Escape, consistent with a modal dialog.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The live preview is mirrored (CSS scaleX(-1)) for a natural selfie feel,
    // and the source frame reaches the canvas mirrored to match. Flip the
    // canvas horizontally so the captured pixels are un-mirrored — the saved
    // JPEG keeps correct real-world left/right orientation for analysis.
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setStatus("error");
          setErrorMessage("We couldn't capture that photo. Please try again.");
          return;
        }

        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        capturedFileRef.current = file;
        // Previous URL (if any) is revoked by the capturedUrl cleanup effect.
        setCapturedUrl(URL.createObjectURL(blob));
        stopStream();
        setStatus("captured");
      },
      "image/jpeg",
      0.92
    );
  }, [stopStream]);

  const handleRetake = useCallback(() => {
    capturedFileRef.current = null;
    setCapturedUrl(null);
    startStream();
  }, [startStream]);

  const handleConfirm = useCallback(() => {
    const file = capturedFileRef.current;
    if (!file) return;
    // Hand off to the parent's existing validation/preview/analysis pipeline.
    onCapture(file);
    onClose();
  }, [onCapture, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: easing }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Take a photo with your camera"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={springSoft}
        onClick={(event) => event.stopPropagation()}
        className="relative flex w-full max-w-md flex-col gap-5 rounded-card border border-line bg-surface p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <p className="text-lg font-medium tracking-tightest text-ink">
            Take a photo
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            onClick={handleClose}
            aria-label="Close camera"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-muted transition-colors duration-300 hover:border-ink/30 hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </motion.button>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card-sm bg-surface-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="Live camera preview"
            className={cn(
              // Mirror ONLY the live preview for a natural selfie experience.
              // This is a display-only CSS transform; it does NOT affect the
              // pixels canvas capture samples, so the saved image stays
              // correctly (non-)oriented left-to-right.
              "h-full w-full -scale-x-100 object-cover transition-opacity duration-300",
              status === "ready" ? "opacity-100" : "opacity-0"
            )}
          />

          {status === "captured" && capturedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedUrl}
              alt="The photo you just captured"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {status === "initializing" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-body text-sm text-ink-muted">Starting camera…</p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-6 text-center">
              <AlertCircle
                className="h-6 w-6 text-accent-from"
                strokeWidth={1.6}
                aria-hidden="true"
              />
              <p className="font-body text-sm text-ink-muted">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {status === "ready" && (
            <Button type="button" variant="primary" size="md" onClick={handleCapture}>
              <span className="inline-flex items-center gap-2">
                <Camera className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                Capture
              </span>
            </Button>
          )}

          {status === "captured" && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleRetake}
              >
                <span className="inline-flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                  Retake
                </span>
              </Button>
              <Button type="button" variant="primary" size="md" onClick={handleConfirm}>
                Use photo
              </Button>
            </>
          )}

          {(status === "initializing" || status === "error") && (
            <Button type="button" variant="secondary" size="md" onClick={handleClose}>
              {status === "error" ? "Close" : "Cancel"}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
