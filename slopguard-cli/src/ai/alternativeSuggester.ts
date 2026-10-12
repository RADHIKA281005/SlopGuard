import { GoogleGenAI } from "@google/genai";

import { GEMINI_API_KEY } from "../config";
import { ALTERNATIVE_PACKAGE_SYSTEM_PROMPT } from "./prompts";
import { AIAlternativeResponse } from "./types";

const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
});


export async function suggestAlternatives(
    packageName: string
): Promise<AIAlternativeResponse> {

    try {

        const prompt = `
${ALTERNATIVE_PACKAGE_SYSTEM_PROMPT}

Analyze the following suspicious npm package:

Package name: ${packageName}

Infer what functionality the package name may represent
and suggest legitimate npm packages that could serve as
alternatives.

Remember:

- These are only candidate suggestions.
- Do not claim that the suggested packages are safe.
- Do not claim that they exist.
- SlopGuard will independently verify every suggestion.

Return ONLY valid JSON in this format:

{
  "inferredPurpose": "short description",
  "alternatives": [
    {
      "name": "package-name",
      "reason": "why this could be an alternative"
    }
  ]
}
`;


        const response =
            await ai.models.generateContent({
                model: "gemini-3.5-flash-lite",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                },
            });


        const content =
            response.text;


        if (!content) {

            throw new Error(
                "AI returned an empty response"
            );
        }


        const parsed:
            AIAlternativeResponse =
            JSON.parse(content);


        if (
            typeof parsed.inferredPurpose !==
                "string" ||
            !Array.isArray(
                parsed.alternatives
            )
        ) {

            throw new Error(
                "Invalid AI response format"
            );
        }


        return parsed;


    } catch (error) {

        console.error(
            "AI alternative suggestion failed:",
            error
        );


        throw new Error(
            "Unable to generate alternative package suggestions."
        );
    }
}