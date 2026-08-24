import { ANALYSIS_PROMPT } from "@/backend/ai/prompt";
import type { AnalyzeErrorCode } from "@/types/analyze";

/**
 * Live vision client for the beauty analysis. Sends the image (as base64) plus
 * ANALYSIS_PROMPT to Google Gemini and returns the model's raw text response.
 *
 * This is the server-only integration extracted verbatim from the /api/analyze
 * route: the model, endpoint, request body, and every failure code/message/
 * status are unchanged. It reads the secret GEMINI_API_KEY and therefore must
 * never be imported by a Client Component.
 *
 * Graceful failures (missing key, non-OK HTTP, empty response) are returned as
 * a typed { ok: false } outcome. Unexpected throws (network error, malformed
 * JSON body) propagate to the caller, mirroring the route's original behavior
 * where such errors fell through to the surrounding try/catch.
 */

const GEMINI_MODEL = "gemini-3.6-flash";

export type GeminiOutcome =
  | { ok: true; raw: string }
  | { ok: false; code: AnalyzeErrorCode; status: number; message: string };

export async function requestAnalysis(
  base64: string,
  mimeType: string
): Promise<GeminiOutcome> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing.");

    return {
      ok: false,
      code: "analysis-failed",
      status: 500,
      message: "The AI analysis service is not configured.",
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: ANALYSIS_PROMPT,
              },
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error("Gemini API error:", response.status, errorText);

    return {
      ok: false,
      code: "analysis-failed",
      status: 502,
      message:
        "The AI analysis service could not process your photo. Please try again.",
    };
  }

  const data = await response.json();

  // Extract Gemini text response
  const raw =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!raw) {
    console.error("Gemini returned no text:", data);

    return {
      ok: false,
      code: "model-unreadable",
      status: 502,
      message: "The analysis came back empty. Please try again.",
    };
  }

  console.log("Gemini analysis received successfully.");

  return { ok: true, raw };
}
