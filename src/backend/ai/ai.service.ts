import { requestAnalysis as requestOpenRouter } from "./providers/openrouter.provider";
import { requestAnalysis as requestGrok } from "./providers/grok.provider";
import { requestAnalysis as requestGemini } from "./providers/gemini.provider";

import type { AnalyzeErrorCode } from "@/types/analyze";


export type AIOutcome =
  | {
      ok: true;
      raw: string;
    }
  | {
      ok: false;
      code: AnalyzeErrorCode;
      status: number;
      message: string;
    };



export async function requestAIAnalysis(
  base64: string,
  mimeType: string
): Promise<AIOutcome> {


  /*
   * Primary AI Gateway:
   * OpenRouter Vision (model configurable via OPENROUTER_MODEL)
   */

  try {

    console.log(
      "Trying OpenRouter AI..."
    );


    const openRouterResult =
      await requestOpenRouter(
        base64,
        mimeType
      );


    if (openRouterResult.ok) {

      return {
        ok: true,
        raw: openRouterResult.raw,
      };

    }


    console.warn(
      "OpenRouter failed:",
      openRouterResult.message
    );


  } catch (error) {

    console.error(
      "OpenRouter crashed:",
      error
    );

  }



  /*
   * Fallback AI Provider:
   * Grok Vision
   */

  try {

    console.log(
      "Switching to Grok AI..."
    );


    const grokResult =
      await requestGrok(
        base64,
        mimeType
      );


    if (grokResult.ok) {

      return {
        ok: true,
        raw: grokResult.raw,
      };

    }


    console.warn(
      "Grok failed:",
      grokResult.message
    );


  } catch (error) {

    console.error(
      "Grok crashed:",
      error
    );

  }



  /*
   * Fallback AI Provider:
   * Gemini Vision
   */

  try {

    console.log(
      "Switching to Gemini AI..."
    );


    const geminiResult =
      await requestGemini(
        base64,
        mimeType
      );



    if (geminiResult.ok) {

      return {
        ok: true,
        raw: geminiResult.raw,
      };

    }



    return {
      ok: false,
      code: geminiResult.code as AnalyzeErrorCode,
      status: geminiResult.status,
      message: geminiResult.message,
    };



  } catch (error) {


    console.error(
      "Gemini crashed:",
      error
    );


    return {

      ok: false,

      code:
        "analysis-failed",

      status:
        502,

      message:
        "AI analysis service unavailable.",

    };

  }

}