import {
    analyzePackage,
    AnalysisResult
} from "../analyzer.js";

import {
    AIAlternativeResponse
} from "./types";


export interface VerifiedAlternative {
    name: string;
    reason: string;
    analysis: AnalysisResult;
}


export interface VerifiedAlternativeResponse {
    inferredPurpose: string;

    safeAlternatives: VerifiedAlternative[];

    suspiciousAlternatives: VerifiedAlternative[];

    hallucinatedAlternatives: VerifiedAlternative[];
}


export async function verifyAlternatives(
    aiResponse: AIAlternativeResponse
): Promise<VerifiedAlternativeResponse> {

    const safeAlternatives:
        VerifiedAlternative[] = [];

    const suspiciousAlternatives:
        VerifiedAlternative[] = [];

    const hallucinatedAlternatives:
        VerifiedAlternative[] = [];


    for (
        const alternative of
        aiResponse.alternatives
    ) {

        console.log(
            `🔍 Verifying suggested package: ${alternative.name}`
        );


        try {

            const analysis =
                await analyzePackage(
                    alternative.name
                );


            const verifiedAlternative:
                VerifiedAlternative = {

                name: alternative.name,

                reason: alternative.reason,

                analysis
            };


            // ------------------------------------------
            // SAFE
            // ------------------------------------------

            if (
                analysis.verdict ===
                "SAFE"
            ) {

                safeAlternatives.push(
                    verifiedAlternative
                );
            }


            // ------------------------------------------
            // SUSPICIOUS
            // ------------------------------------------

            else if (
                analysis.verdict ===
                "SUSPICIOUS"
            ) {

                suspiciousAlternatives.push(
                    verifiedAlternative
                );
            }


            // ------------------------------------------
            // CONFIRMED HALLUCINATED
            // ------------------------------------------

            else if (
                analysis.verdict ===
                "CONFIRMED_HALLUCINATED"
            ) {

                hallucinatedAlternatives.push(
                    verifiedAlternative
                );
            }


        } catch (error) {

            console.error(
                `⚠️ Failed to verify ${alternative.name}:`,
                error
            );
        }
    }


    return {

        inferredPurpose:
            aiResponse.inferredPurpose,

        safeAlternatives,

        suspiciousAlternatives,

        hallucinatedAlternatives
    };
}