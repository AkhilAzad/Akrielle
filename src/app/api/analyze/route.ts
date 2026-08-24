import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/backend/api/rateLimit";
import { analyzeImage } from "@/backend/services/analysisService";
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

  // 3. Validate the image, run the AI analysis, and coerce to the app schema.
  const outcome = await analyzeImage(image);

  if (!outcome.ok) {
    return fail(outcome.code, outcome.message, outcome.status);
  }

  // 4. Return exactly the format the frontend already expects.
  return NextResponse.json(outcome.data);
}
