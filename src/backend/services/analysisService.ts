import { requestAIAnalysis } from "@/backend/ai/ai.service";
import { coerceAnalysisResult, extractJsonObject } from "@/backend/ai/schema";

import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  MIN_IMAGE_DIMENSION,
} from "@/constants/upload";

import {
  applyImageConfidence,
  imageQualityFactor,
  readImageDimensions,
} from "@/backend/ai/scoring";

import type { AnalysisResult } from "@/types/analysis";
import type { AnalyzeErrorCode } from "@/types/analyze";


/**
 * Server-only orchestration for beauty analysis.
 *
 * Flow:
 *
 * Upload Image
 *      ↓
 * Validate Image
 *      ↓
 * AI Service
 *      ↓
 * Grok Provider
 *      ↓
 * Gemini Fallback
 *      ↓
 * Extract JSON
 *      ↓
 * Validate Schema
 *      ↓
 * Return AnalysisResult
 *
 */


export type AnalyzeOutcome =
  | {
      ok: true;
      data: AnalysisResult;
    }
  | {
      ok: false;
      code: AnalyzeErrorCode;
      status: number;
      message: string;
    };



export async function analyzeImage(
  image: File
): Promise<AnalyzeOutcome> {


  /*
   * Image validation
   */

  if (image.size === 0) {

    return {
      ok: false,
      code: "empty-file",
      status: 400,
      message:
        "That file appears to be empty. Please choose another photo.",
    };

  }



  if (
    !(ACCEPTED_FILE_TYPES as readonly string[])
      .includes(image.type)
  ) {

    return {
      ok: false,
      code: "invalid-type",
      status: 400,
      message:
        "Please upload a JPG, PNG, or WEBP image.",
    };

  }



  if (image.size > MAX_FILE_SIZE_BYTES) {

    return {
      ok: false,
      code: "too-large",
      status: 400,
      message:
        `That image is larger than ${MAX_FILE_SIZE_LABEL}. Please choose a smaller file.`,
    };

  }



  /*
   * Decode the image bytes once, then run a basic image-quality check
   * before spending an AI call.
   */

  const bytes = await image.arrayBuffer();

  const buffer = Buffer.from(bytes);


  const dimensions =
    readImageDimensions(buffer, image.type);


  /*
   * Reject images too small on the shorter side to support a meaningful
   * analysis (icons, thumbnails, corrupt files). Only block when the
   * dimensions parse confidently — otherwise fail open.
   */
  if (
    dimensions &&
    Math.min(dimensions.width, dimensions.height) < MIN_IMAGE_DIMENSION
  ) {

    return {
      ok: false,
      code: "low-quality",
      status: 400,
      message:
        `That photo is too small for an accurate analysis. Please upload an image at least ${MIN_IMAGE_DIMENSION}px on its shorter side.`,
    };

  }


  const base64 =
    buffer.toString("base64");



  try {


    /*
     * AI Request
     *
     * Provider switching handled by:
     * src/backend/ai/ai.service.ts
     *
     * Grok → Gemini fallback
     */

    const aiResponse =
      await requestAIAnalysis(
        base64,
        image.type
      );



    if (!aiResponse.ok) {

      return aiResponse;

    }



    /*
     * Extract JSON from model response
     */

    const parsed =
      extractJsonObject(
        aiResponse.raw
      );



    if (parsed === null) {


      console.error(
        "Could not extract JSON from AI response:",
        aiResponse.raw
      );


      return {

        ok: false,

        code:
          "model-unreadable",

        status:
          502,

        message:
          "We couldn't read the analysis result. Please try again.",

      };

    }



    /*
     * Validate application schema
     */

    const outcome =
      coerceAnalysisResult(
        parsed
      );



    if (!outcome.ok) {


      console.error(
        "AI result failed schema validation:",
        parsed
      );


      return {

        ok: false,

        code:
          "model-invalid",

        status:
          502,

        message:
          "The analysis result was incomplete. Please try again.",

      };


    }



    /*
     * Success — lower the reported confidence for borderline-resolution
     * images so a barely-acceptable photo doesn't claim full certainty.
     */

    const qualityFactor =
      dimensions
        ? imageQualityFactor(
            Math.min(dimensions.width, dimensions.height),
            MIN_IMAGE_DIMENSION
          )
        : 1;


    return {

      ok: true,

      data:
        applyImageConfidence(
          outcome.data,
          qualityFactor
        ),

    };



  } catch(error) {


    console.error(
      "Analysis failed:",
      error
    );



    return {

      ok: false,

      code:
        "analysis-failed",

      status:
        500,

      message:
        "Failed to analyze image. Please try again.",

    };


  }


}