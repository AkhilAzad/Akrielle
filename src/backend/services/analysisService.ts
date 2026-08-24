import { requestAnalysis } from "@/backend/ai/gemini";
import { coerceAnalysisResult, extractJsonObject } from "@/backend/ai/schema";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from "@/constants/upload";
import type { AnalysisResult } from "@/types/analysis";
import type { AnalyzeErrorCode } from "@/types/analyze";

/**
 * Server-only orchestration for the beauty analysis. Composes the validation,
 * the Gemini vision call, and the schema repair into a single behavior — the
 * exact sequence that previously lived inline in the /api/analyze route.
 *
 * Returns a typed outcome carrying the same error `code`, `message`, and HTTP
 * `status` the route produced before, so the HTTP adapter only has to serialize
 * the result. Called only from Route Handlers / Server Components — never from a
 * Client Component (it reaches secret-bearing server code via the Gemini client).
 *
 * Note: `coerceAnalysisResult` / `extractJsonObject` come from `ai/schema.ts`,
 * which is intentionally left in place because it is also imported by client
 * code; this service depends on those pure helpers rather than absorbing them.
 */

export type AnalyzeOutcome =
  | { ok: true; data: AnalysisResult }
  | { ok: false; code: AnalyzeErrorCode; status: number; message: string };

export async function analyzeImage(image: File): Promise<AnalyzeOutcome> {
  // Validate image
  if (image.size === 0) {
    return {
      ok: false,
      code: "empty-file",
      status: 400,
      message: "That file appears to be empty. Please choose another photo.",
    };
  }

  if (!(ACCEPTED_FILE_TYPES as readonly string[]).includes(image.type)) {
    return {
      ok: false,
      code: "invalid-type",
      status: 400,
      message: "Please upload a JPG, PNG, or WEBP image.",
    };
  }

  if (image.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      code: "too-large",
      status: 400,
      message: `That image is larger than ${MAX_FILE_SIZE_LABEL}. Please choose a smaller file.`,
    };
  }

  // Convert image to base64. Kept outside the try below to preserve the route's
  // original control flow (this conversion sat before its try/catch).
  const bytes = await image.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  try {
    // Gemini request (model, prompt, endpoint unchanged — see ai/gemini.ts)
    const gemini = await requestAnalysis(base64, image.type);

    if (!gemini.ok) {
      return gemini;
    }

    // Parse JSON
    const parsed = extractJsonObject(gemini.raw);

    if (parsed === null) {
      console.error("Could not extract JSON from Gemini response:", gemini.raw);

      return {
        ok: false,
        code: "model-unreadable",
        status: 502,
        message: "We couldn't read the analysis result. Please try again.",
      };
    }

    // Validate/coerce existing application schema
    const outcome = coerceAnalysisResult(parsed);

    if (!outcome.ok) {
      console.error("Gemini result failed schema validation:", parsed);

      return {
        ok: false,
        code: "model-invalid",
        status: 502,
        message: "The analysis result was incomplete. Please try again.",
      };
    }

    return { ok: true, data: outcome.data };
  } catch (error) {
    console.error("Analysis failed:", error);

    return {
      ok: false,
      code: "analysis-failed",
      status: 500,
      message: "Failed to analyze image. Please try again.",
    };
  }
}
