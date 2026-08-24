import { NextResponse } from "next/server";
import { ANALYSIS_PROMPT } from "@/backend/ai/prompt";
import {
  coerceAnalysisResult,
  extractJsonObject,
} from "@/backend/ai/schema";
import { clientIp, rateLimit } from "@/backend/api/rateLimit";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from "@/constants/upload";
import type { AnalyzeErrorBody, AnalyzeErrorCode } from "@/types/analyze";

export const runtime = "nodejs";

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60_000;

function fail(
  code: AnalyzeErrorCode,
  error: string,
  status: number,
  retryAfter?: number
) {
  const body: AnalyzeErrorBody = { code, error };

  if (typeof retryAfter === "number") {
    body.retryAfter = retryAfter;
  }

  const res = NextResponse.json(body, { status });

  if (typeof retryAfter === "number") {
    res.headers.set("Retry-After", String(retryAfter));
  }

  return res;
}

export async function POST(req: Request) {
  // 1. Rate limit
  const limit = rateLimit(clientIp(req), RATE_LIMIT, RATE_WINDOW_MS);

  if (!limit.ok) {
    return fail(
      "rate-limited",
      "You're analyzing photos a little too quickly. Please wait a moment and try again.",
      429,
      limit.retryAfter
    );
  }

  // 2. Parse upload
  let image: File;

  try {
    const formData = await req.formData();
    const value = formData.get("image");

    if (!(value instanceof File)) {
      return fail("no-image", "No image was uploaded.", 400);
    }

    image = value;
  } catch {
    return fail(
      "no-image",
      "We couldn't read the uploaded file. Please try again.",
      400
    );
  }

  // 3. Validate image
  if (image.size === 0) {
    return fail(
      "empty-file",
      "That file appears to be empty. Please choose another photo.",
      400
    );
  }

  if (!(ACCEPTED_FILE_TYPES as readonly string[]).includes(image.type)) {
    return fail(
      "invalid-type",
      "Please upload a JPG, PNG, or WEBP image.",
      400
    );
  }

  if (image.size > MAX_FILE_SIZE_BYTES) {
    return fail(
      "too-large",
      `That image is larger than ${MAX_FILE_SIZE_LABEL}. Please choose a smaller file.`,
      400
    );
  }

  // 4. Convert image to base64
  const bytes = await image.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  // 5. Gemini API key
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing.");

    return fail(
      "analysis-failed",
      "The AI analysis service is not configured.",
      500
    );
  }

  // 6. Gemini request
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(
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
                    mimeType: image.type,
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

      return fail(
        "analysis-failed",
        "The AI analysis service could not process your photo. Please try again.",
        502
      );
    }

    const data = await response.json();

    // 7. Extract Gemini text response
    const raw =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim() ?? "";

    if (!raw) {
      console.error("Gemini returned no text:", data);

      return fail(
        "model-unreadable",
        "The analysis came back empty. Please try again.",
        502
      );
    }

    console.log("Gemini analysis received successfully.");

    // 8. Parse JSON
    const parsed = extractJsonObject(raw);

    if (parsed === null) {
      console.error("Could not extract JSON from Gemini response:", raw);

      return fail(
        "model-unreadable",
        "We couldn't read the analysis result. Please try again.",
        502
      );
    }

    // 9. Validate/coerce existing application schema
    const outcome = coerceAnalysisResult(parsed);

    if (!outcome.ok) {
      console.error("Gemini result failed schema validation:", parsed);

      return fail(
        "model-invalid",
        "The analysis result was incomplete. Please try again.",
        502
      );
    }

    // 10. Return exactly the format your frontend already expects
    return NextResponse.json(outcome.data);
  } catch (error) {
    console.error("Analysis failed:", error);

    return fail(
      "analysis-failed",
      "Failed to analyze image. Please try again.",
      500
    );
  }
}