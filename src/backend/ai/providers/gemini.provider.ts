import { ANALYSIS_PROMPT } from "@/backend/ai/prompt";

const GEMINI_MODEL = "gemini-3.5-flash-lite";

export type GeminiOutcome =
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
): Promise<GeminiOutcome> {

  const apiKey = process.env.GEMINI_API_KEY;


  if (!apiKey) {

    console.error(
      "GEMINI_API_KEY is missing."
    );

    return {
      ok: false,
      code: "missing-api-key",
      status: 500,
      message:
        "AI configuration missing."
    };
  }


  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({

        contents: [
          {
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

    const errorText =
      await response.text();


    console.error(
      "Gemini API error:",
      response.status,
      errorText
    );


    throw new Error(
      `Gemini failed ${response.status}: ${errorText}`
    );
  }


  const data = await response.json();


  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;


  if (!text) {

    console.error(
      "Gemini returned no text:",
      data
    );


    return {
      ok: false,
      code: "empty-response",
      status: 502,
      message:
        "Gemini returned no analysis."
    };
  }


  console.log(
    "Gemini analysis received successfully."
  );


  return {
    ok: true,
    raw: text,
  };
}