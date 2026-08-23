"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { validateImageFile, validateImageDimensions } from "@/utils/file";
import type { SelectedImage, UploadError } from "@/types/upload";

interface UseFileUploadResult {
  selectedImage: SelectedImage | null;
  error: UploadError | null;
  isDragging: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  openFileDialog: () => void;
  handleFile: (file: File) => void;
  handleFiles: (files: FileList | null) => void;
  removeImage: () => void;
  dragHandlers: {
    onDragOver: (event: React.DragEvent<HTMLElement>) => void;
    onDragLeave: (event: React.DragEvent<HTMLElement>) => void;
    onDrop: (event: React.DragEvent<HTMLElement>) => void;
  };
}

export function useFileUpload(): UseFileUploadResult {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [error, setError] = useState<UploadError | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Monotonic token so a slow image decode from an earlier pick can't
  // overwrite a newer selection (or one the user has since removed).
  const requestIdRef = useRef(0);

  // Revoke the object URL when it's replaced or the component unmounts,
  // so previews don't leak memory across selections.
  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage.previewUrl);
    };
  }, [selectedImage]);

  // Validate + preview a single File. This is the shared entry point used by
  // both device uploads (via handleFiles) and camera captures, so a photo from
  // the camera goes through the exact same checks as one picked from disk.
  const handleFile = useCallback((file: File) => {
    // Fast, synchronous checks first (type + size).
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const token = (requestIdRef.current += 1);
    setError(null);

    // Then confirm the file actually decodes to a usable image.
    validateImageDimensions(file).then((dimensionError) => {
      // Ignore if a newer selection (or a removal) has since happened.
      if (token !== requestIdRef.current) return;

      if (dimensionError) {
        setError(dimensionError);
        return;
      }

      setSelectedImage((prev) => {
        if (prev) URL.revokeObjectURL(prev.previewUrl);
        return { file, previewUrl: URL.createObjectURL(file) };
      });
    });
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      handleFile(file);
    },
    [handleFile]
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const removeImage = useCallback(() => {
    // Invalidate any in-flight decode so it can't repopulate the preview.
    requestIdRef.current += 1;
    setSelectedImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  return {
    selectedImage,
    error,
    isDragging,
    inputRef,
    openFileDialog,
    handleFile,
    handleFiles,
    removeImage,
    dragHandlers: { onDragOver, onDragLeave, onDrop },
  };
}
