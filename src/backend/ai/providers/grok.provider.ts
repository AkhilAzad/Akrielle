import { ANALYSIS_PROMPT } from "@/backend/ai/prompt";

const GROK_MODEL = "grok-4";


export type GrokOutcome =
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
): Promise<GrokOutcome> {


  const apiKey =
    process.env.XAI_API_KEY;



  if (!apiKey) {

    console.error(
      "XAI_API_KEY is missing."
    );


    return {
      ok: false,
      code: "missing-api-key",
      status: 500,
      message:
        "Grok API configuration missing.",
    };

  }



  try {


    const response =
      await fetch(
        "https://api.x.ai/v1/chat/completions",
        {

          method: "POST",


          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${apiKey}`,

          },


          body: JSON.stringify({

            model:
              GROK_MODEL,


            messages: [

              {

                role:
                  "user",


                content: [

                  {

                    type:
                      "text",

                    text:
                      ANALYSIS_PROMPT,

                  },


                  {

                    type:
                      "image_url",


                    image_url: {

                      url:
                        `data:${mimeType};base64,${base64}`,

                    },

                  },

                ],

              },

            ],



            temperature:
              0.2,


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
        "Grok API error:",
        response.status,
        errorText
      );



      return {

        ok: false,

        code:
          "provider-error",

        status:
          response.status,

        message:
          "Grok request failed.",

      };

    }





    const data =
      await response.json();





    const text =
      data?.choices?.[0]?.message?.content;





    if (!text) {


      console.error(
        "Grok returned no text:",
        data
      );



      return {

        ok: false,

        code:
          "empty-response",

        status:
          502,

        message:
          "Grok returned no analysis.",

      };

    }





    console.log(
      "Grok analysis received successfully."
    );



    return {

      ok: true,

      raw:
        text,

    };



  } catch(error) {


    console.error(
      "Grok request crashed:",
      error
    );



    return {

      ok: false,

      code:
        "provider-error",

      status:
        500,

      message:
        "Grok service unavailable.",

    };

  }

}