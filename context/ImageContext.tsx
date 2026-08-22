"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";

/**
 * Shape of the image state exposed to consumers.
 */
export interface ImageState {
  /** The currently uploaded image file, or null if none has been set. */
  image: File | null;
  /** Object URL generated for previewing the uploaded image, or null if none. */
  imagePreviewUrl: string | null;
}

/**
 * Shape of the full context value, including state and actions.
 */
export interface ImageContextValue extends ImageState {
  /** Store a new uploaded image and generate its preview URL. */
  setImage: (file: File | null) => void;
  /** Clear the currently uploaded image and revoke its preview URL. */
  clearImage: () => void;
}

export interface ImageProviderProps {
  children: React.ReactNode;
}

const ImageContext = createContext<ImageContextValue | undefined>(undefined);

/**
 * Provides application-wide state for the currently uploaded image,
 * including a generated preview URL. Does not perform any AI processing.
 */
export const ImageProvider: React.FC<ImageProviderProps> = ({ children }) => {
  const [image, setImageState] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Keep track of the current object URL so we can revoke it reliably,
  // even across rapid state updates.
  const previewUrlRef = useRef<string | null>(null);

  const setImage = useCallback((file: File | null) => {
    // Revoke any previous object URL to avoid memory leaks.
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (file) {
      const newPreviewUrl = URL.createObjectURL(file);
      previewUrlRef.current = newPreviewUrl;
      setImageState(file);
      setImagePreviewUrl(newPreviewUrl);
    } else {
      setImageState(null);
      setImagePreviewUrl(null);
    }
  }, []);

  const clearImage = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setImageState(null);
    setImagePreviewUrl(null);
  }, []);

  // Revoke the object URL on unmount to avoid leaking memory.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const value = useMemo<ImageContextValue>(
    () => ({
      image,
      imagePreviewUrl,
      setImage,
      clearImage,
    }),
    [image, imagePreviewUrl, setImage, clearImage]
  );

  return (
    <ImageContext.Provider value={value}>{children}</ImageContext.Provider>
  );
};

/**
 * Hook for accessing the uploaded image state and actions.
 * Must be used within an ImageProvider.
 */
export const useImage = (): ImageContextValue => {
  const context = useContext(ImageContext);
  if (context === undefined) {
    throw new Error("useImage must be used within an ImageProvider");
  }
  return context;
};

export default ImageContext;
