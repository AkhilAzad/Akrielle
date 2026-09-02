import { ANALYSIS_PROMPT } from "@/backend/ai/prompt";

/**
 * OpenRouter vision provider.
 *
 * OpenRouter is an OpenAI-compatible gateway that fronts many model vendors
 * behind a single endpoint and API key, so this provider follows the exact
 * same request/response contract as the other providers in this folder
 * (grok.provider, gemini.provider): it takes the image as base64 + mimeType,
 * sends ANALYSIS_PROMPT, and returns the model's raw text response.
 *
 * The model is configurable via the OPENROUTER_MODEL environment variable so
 * the gateway can point at any vision-capable model without code changes. A
 * vision-capable default is used when the variable is unset.
 *
 * Reads the secret OPENROUTER_API_KEY and is therefore server-only — it must
 * never be imported by a Client Component.
 */

const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";

const OPENROUTER_ENDPOINT =
  "https://openrouter.ai/api/v1/chat/completions";

export type OpenRouterOutcome =
  | {
      ok: true;
      raw: string;
    }
  | {
      ok: false;
      code: string;
      status: number;
      message: string;
    };

export async function requestAnalysis(
  base64: string,
  mimeType: string
): Promise<OpenRouterOutcome> {

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {

    console.error(
      "OPENROUTER_API_KEY is missing."
    );

    return {
      ok: false,
      code: "missing-api-key",
      status: 500,
      message:
        "OpenRouter API configuration missing.",
    };

  }

  const model =
    process.env.OPENROUTER_MODEL ||
    DEFAULT_OPENROUTER_MODEL;

  /*
   * Optional attribution headers OpenRouter uses for ranking/analytics.
   * Sent only when configured, so they never affect the request otherwise.
   */
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (process.env.OPENROUTER_SITE_URL) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
  }

  if (process.env.OPENROUTER_APP_NAME) {
    headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
  }

  try {

    const response = await fetch(
      OPENROUTER_ENDPOINT,
      {
        method: "POST",

        headers,

        body: JSON.stringify({

          model,

          messages: [
            {
              role: "user",

              content: [
                {
                  type: "text",
                  text: ANALYSIS_PROMPT,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                  },
                },
              ],
            },
          ],

          temperature: 0.2,

          response_format: {
            type: "json_object",
          },

        }),
      }
    );

    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "OpenRouter API error:",
        response.status,
        errorText
      );

      return {
        ok: false,
        code: "provider-error",
        status: response.status,
        message:
          "OpenRouter request failed.",
      };

    }

    const data =
      await response.json();

    const text =
      data?.choices?.[0]?.message?.content;

    if (!text) {

      console.error(
        "OpenRouter returned no text:",
        data
      );

      return {
        ok: false,
        code: "empty-response",
        status: 502,
        message:
          "OpenRouter returned no analysis.",
      };

    }

    console.log(
      "OpenRouter analysis received successfully."
    );

    return {
      ok: true,
      raw: text,
    };

  } catch (error) {

    console.error(
      "OpenRouter request crashed:",
      error
    );

    return {
      ok: false,
      code: "provider-error",
      status: 500,
      message:
        "OpenRouter service unavailable.",
    };

  }

}
