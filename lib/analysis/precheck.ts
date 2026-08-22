import { openai } from "@/lib/openai";
import { FACE_PRECHECK_PROMPT } from "@/lib/analysis/prompt";
import { extractJsonObject, isRecord } from "@/lib/analysis/schema";
import type { AnalyzeErrorCode } from "@/types/analyze";

export interface PrecheckVerdict {
  ok: boolean;
  code?: Extract<AnalyzeErrorCode, "no-face" | "multiple-faces" | "low-quality">;
  message?: string;
}

/**
 * A cheap, best-effort gate that runs before the full analysis. It asks the
 * vision model (at low image detail, with a tiny token budget) only whether
 * the image is a usable photo of a single human face.
 *
 * Fail-open by design: if the pre-check errors, times out, or returns
 * something we can't parse, we do NOT block the user — the main analysis
 * proceeds. Only a confident, explicit negative verdict stops the flow, so
 * the safeguard can never make the product less reliable than before.
 */
export async function runFacePrecheck(dataUrl: string): Promise<PrecheckVerdict> {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      max_output_tokens: 200,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: FACE_PRECHECK_PROMPT },
            { type: "input_image", image_url: dataUrl, detail: "low" },
          ],
        },
      ],
    });

    const raw = response.output_text?.trim();
    if (!raw) return { ok: true };

    const parsed = extractJsonObject(raw);
    if (!isRecord(parsed)) return { ok: true };

    const facePresent = parsed.facePresent === true;
    const faceCount = Number(parsed.faceCount);
    const quality = typeof parsed.quality === "string" ? parsed.quality : "";

    if (!facePresent || faceCount === 0) {
      return {
        ok: false,
        code: "no-face",
        message:
          "We couldn't find a clear face in this photo. Please upload a well-lit photo showing your face.",
      };
    }

    if (Number.isFinite(faceCount) && faceCount > 1) {
      return {
        ok: false,
        code: "multiple-faces",
        message:
          "We found more than one face. Please upload a photo of just you, facing the camera.",
      };
    }

    if (quality === "poor") {
      return {
        ok: false,
        code: "low-quality",
        message:
          "This photo is a little too blurry or dark to analyze. Please try a clearer, well-lit photo.",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("Face pre-check failed (continuing):", error);
    return { ok: true };
  }
}
