export const SCAN_STAGES = [
  "Initializing Beauty Intelligence",
  "Scanning Facial Geometry",
  "Detecting Face Shape",
  "Analyzing Skin Tone",
  "Estimating Undertone",
  "Mapping Facial Landmarks",
  "Calculating Facial Harmony",
  "Generating Beauty Profile",
] as const;

/** Total scan duration is randomized within this window on each run. */
export const SCAN_MIN_DURATION_MS = 5000;
export const SCAN_MAX_DURATION_MS = 8000;

/** Pause after the final stage completes, before navigating to /results. */
export const SCAN_COMPLETION_PAUSE_MS = 600;
