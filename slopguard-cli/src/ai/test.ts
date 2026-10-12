import { suggestAlternatives } from "./alternativeSuggester";
import { verifyAlternatives } from "./alternativeVerifier";

async function main() {
    console.log(
        "🧠 Testing SlopGuard AI Alternative Suggester...\n"
    );

    const packageName = "some-imaginary-ai-package";

    console.log(`Package: ${packageName}`);
    console.log(
        "Asking GenAI for possible alternatives...\n"
    );

    try {
        // -----------------------------------------
        // STEP 1: Generate AI suggestions
        // -----------------------------------------

        const aiResult =
            await suggestAlternatives(packageName);

        console.log("✅ AI Response:\n");

        console.log("Inferred Purpose:");
        console.log(aiResult.inferredPurpose);

        console.log("\nPossible Alternatives:");

        aiResult.alternatives.forEach(
            (alternative, index) => {
                console.log(
                    `${index + 1}. ${alternative.name} - ${alternative.reason}`
                );
            }
        );

        // -----------------------------------------
        // STEP 2: Verify AI suggestions
        // -----------------------------------------

        console.log(
            "\n🔐 Verifying AI suggestions using SlopGuard...\n"
        );

        const verifiedResult =
            await verifyAlternatives(aiResult);

        // -----------------------------------------
        // STEP 3: Display SAFE alternatives
        // -----------------------------------------

        console.log(
            "\n🛡️ Verified Alternative Packages:\n"
        );

        if (
            verifiedResult.safeAlternatives.length === 0
        ) {
            console.log(
                "No SAFE alternatives were verified."
            );
        } else {
            verifiedResult.safeAlternatives.forEach(
                (alternative, index) => {
                    console.log(
                        `${index + 1}. ${alternative.name}`
                    );

                    console.log(
                        `   Reason: ${alternative.reason}`
                    );

                    console.log(
                        `   Verdict: ${alternative.analysis.verdict}`
                    );

                    console.log(
                        `   npm: ${
                            alternative.analysis.npmExists
                                ? "FOUND"
                                : "NOT FOUND"
                        }`
                    );

                    console.log(
                        `   Latest Version: ${
                            alternative.analysis
                                .latestVersion ?? "N/A"
                        }`
                    );

                    console.log(
                        `   Blockchain: ${alternative.analysis.blockchainStatus}`
                    );

                    console.log(
                        "-----------------------------------"
                    );
                }
            );
        }

        // -----------------------------------------
        // STEP 4: Display SUSPICIOUS alternatives
        // -----------------------------------------

        console.log(
            "\n⚠️ Suspicious Alternative Packages:\n"
        );

        if (
            verifiedResult
                .suspiciousAlternatives.length === 0
        ) {
            console.log("None.");
        } else {
            verifiedResult.suspiciousAlternatives.forEach(
                (alternative, index) => {
                    console.log(
                        `${index + 1}. ${alternative.name}`
                    );

                    console.log(
                        `   Reason: ${alternative.reason}`
                    );

                    console.log(
                        `   Verdict: ${alternative.analysis.verdict}`
                    );

                    console.log(
                        `   npm: ${
                            alternative.analysis.npmExists
                                ? "FOUND"
                                : "NOT FOUND"
                        }`
                    );

                    console.log(
                        `   Blockchain: ${alternative.analysis.blockchainStatus}`
                    );

                    console.log(
                        `   ⚠️ ${alternative.analysis.message}`
                    );

                    console.log(
                        "-----------------------------------"
                    );
                }
            );
        }

        // -----------------------------------------
        // STEP 5: Display CONFIRMED HALLUCINATED
        // -----------------------------------------

        console.log(
            "\n🚨 Confirmed Hallucinated Alternatives:\n"
        );

        if (
            verifiedResult
                .hallucinatedAlternatives.length === 0
        ) {
            console.log("None.");
        } else {
            verifiedResult.hallucinatedAlternatives.forEach(
                (alternative, index) => {
                    console.log(
                        `${index + 1}. ${alternative.name}`
                    );

                    console.log(
                        `   Reason: ${alternative.reason}`
                    );

                    console.log(
                        `   Verdict: ${alternative.analysis.verdict}`
                    );

                    console.log(
                        `   npm: ${
                            alternative.analysis.npmExists
                                ? "FOUND"
                                : "NOT FOUND"
                        }`
                    );

                    console.log(
                        `   Blockchain: ${alternative.analysis.blockchainStatus}`
                    );

                    console.log(
                        `   🚨 ${alternative.analysis.message}`
                    );

                    console.log(
                        "-----------------------------------"
                    );
                }
            );
        }

        console.log(
            "\n✅ SlopGuard independently verified every AI suggestion."
        );

        console.log(
            "⚠️ AI suggestions are candidates only; SlopGuard verification is authoritative.\n"
        );

    } catch (error) {
        console.error(
            "\n❌ AI test failed:"
        );

        console.error(error);
    }
}

main();