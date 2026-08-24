export interface SelectedImage {
  file: File;
  previewUrl: string;
}

export type UploadErrorReason =
  | "invalid-type"
  | "too-large"
  | "too-small"
  | "unreadable";

export interface UploadError {
  reason: UploadErrorReason;
  message: string;
}
