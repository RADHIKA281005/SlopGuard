import { Command } from "commander";

import { scanProject } from "./scanner.js";
import { analyzePackage } from "./analyzer.js";

import {
    reportPackage,
    updatePackageStatus
} from "./contract.js";


const program = new Command();

program
    .name("slopguard")
    .description("AI package hallucination detection tool")
    .version("1.0.0");


// ==================================================
// CHECK COMMAND
// ==================================================

program
    .command("check <packageName>")
    .description("Check whether a package is real and trusted")
    .action(async (packageName) => {

        console.log(`\n🔍 Checking "${packageName}"...\n`);

        try {
            const result = await analyzePackage(packageName);

            if (result.verdict === "SAFE") {
                console.log("✅ PACKAGE VERIFIED");

            } else if (
                result.verdict === "CONFIRMED_HALLUCINATED"
            ) {
                console.log("🚨 SECURITY WARNING");

            } else {
                console.log("⚠️ SUSPICIOUS PACKAGE");
            }

            console.log("----------------------------");

            console.log(`Package: ${result.packageName}`);

            console.log(
                `Verdict: ${result.verdict}`
            );

            console.log(
                `npm Registry: ${
                    result.npmExists
                        ? "FOUND"
                        : "NOT FOUND"
                }`
            );

            if (result.latestVersion) {
                console.log(
                    `Latest Version: ${result.latestVersion}`
                );
            }

            console.log(
                `Blockchain: ${result.blockchainStatus}`
            );

            console.log(
                `\n${result.message}\n`
            );

        } catch (error) {

            console.error("\n❌ Error:");

            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error(error);
            }
        }
    });


// ==================================================
// REPORT COMMAND
// ==================================================

program
    .command("report <packageName>")
    .description("Report a suspicious package to SlopGuard")
    .action(async (packageName) => {

        console.log(
            `\n🚩 Reporting "${packageName}" to SlopGuard...\n`
        );

        try {

            const receipt =
                await reportPackage(packageName);

            console.log(
                "✅ Package reported successfully!"
            );

            console.log(
                "----------------------------"
            );

            console.log(
                `Package: ${packageName}`
            );

            console.log(
                "Status: UNVERIFIED"
            );

            console.log(
                `Transaction: ${receipt.transactionHash}`
            );

            console.log(
                `Block Number: ${receipt.blockNumber}`
            );

            console.log("");

        } catch (error) {

            console.error(
                "\n❌ Failed to report package:"
            );

            if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error(error);
            }
        }
    });


// ==================================================
// SCAN COMMAND
// ==================================================

program
    .command("scan <projectPath>")
    .description(
        "Scan all dependencies in a project's package.json"
    )
    .action(async (projectPath) => {

        try {

            console.log(
                `\n🛡️ Scanning project: ${projectPath}\n`
            );

            const results =
                await scanProject(projectPath);


            console.log(
                "\n========== SLOPGUARD REPORT ==========\n"
            );


            // ------------------------------------------
            // PRINT PACKAGE RESULTS
            // ------------------------------------------

            for (const result of results) {

                let verdictIcon = "⚠️";

                if (
                    result.verdict === "SAFE"
                ) {
                    verdictIcon = "✅";

                } else if (
                    result.verdict ===
                    "CONFIRMED_HALLUCINATED"
                ) {
                    verdictIcon = "🚨";
                }


                console.log(
                    `${verdictIcon} ${result.packageName}`
                );

                console.log(
                    `Verdict: ${result.verdict}`
                );

                console.log(
                    `npm Exists: ${
                        result.npmExists
                            ? "YES"
                            : "NO"
                    }`
                );

                console.log(
                    `Blockchain Status: ${result.blockchainStatus}`
                );

                if (result.latestVersion) {

                    console.log(
                        `Latest Version: ${result.latestVersion}`
                    );
                }

                console.log(
                    `Message: ${result.message}`
                );

                console.log(
                    "-----------------------------------"
                );
            }


            // ------------------------------------------
            // CALCULATE SUMMARY
            // ------------------------------------------

            const safeCount = results.filter(
                (result) =>
                    result.verdict === "SAFE"
            ).length;


            const suspiciousCount = results.filter(
                (result) =>
                    result.verdict === "SUSPICIOUS"
            ).length;


            const hallucinatedCount = results.filter(
                (result) =>
                    result.verdict ===
                    "CONFIRMED_HALLUCINATED"
            ).length;


            const total = results.length;


            // ------------------------------------------
            // SECURITY SCORE
            //
            // SAFE → no penalty
            // SUSPICIOUS → -25 points
            // CONFIRMED HALLUCINATED → -50 points
            // ------------------------------------------

            let securityScore = 100;

            securityScore -= suspiciousCount * 25;

            securityScore -= hallucinatedCount * 50;


            // Prevent score below 0

            securityScore = Math.max(
                0,
                securityScore
            );


            // ------------------------------------------
            // RISK LEVEL
            // ------------------------------------------

            let riskLevel: string;

            if (securityScore >= 90) {

                riskLevel = "LOW";

            } else if (securityScore >= 60) {

                riskLevel = "MEDIUM";

            } else if (securityScore >= 30) {

                riskLevel = "HIGH";

            } else {

                riskLevel = "CRITICAL";
            }


            // ------------------------------------------
            // PRINT SUMMARY
            // ------------------------------------------

            console.log(
                "\n========== SUMMARY ==========\n"
            );

            console.log(
                `📦 Total packages scanned: ${total}`
            );

            console.log(
                `\n✅ Safe: ${safeCount}`
            );

            console.log(
                `⚠️ Suspicious: ${suspiciousCount}`
            );

            console.log(
                `🚨 Confirmed hallucinated: ${hallucinatedCount}`
            );

            console.log(
                `\n🛡️ Security Score: ${securityScore}%`
            );

            console.log(
                `⚡ Risk Level: ${riskLevel}`
            );

            console.log(
                "\n================================\n"
            );


        } catch (error) {

            console.error(
                "\n❌ Scan failed:"
            );

            if (error instanceof Error) {

                console.error(error.message);

            } else {

                console.error(error);
            }
        }
    });


// ==================================================
// VERIFY COMMAND
// ==================================================

program
    .command("verify <packageName> <status>")
    .description(
        "Verify a reported package as safe or hallucinated"
    )
    .action(async (packageName, status) => {

        let statusCode: number;

        const normalizedStatus =
            status.toLowerCase();


        // SAFE = 1
        if (normalizedStatus === "safe") {

            statusCode = 1;

        }

        // CONFIRMED_HALLUCINATED = 2
        else if (
            normalizedStatus === "hallucinated"
        ) {

            statusCode = 2;

        }

        else {

            console.error(
                '\n❌ Invalid status. Use "safe" or "hallucinated".\n'
            );

            return;
        }


        console.log(
            `\n🔐 Verifying "${packageName}" as ${normalizedStatus.toUpperCase()}...\n`
        );


        try {

            const receipt =
                await updatePackageStatus(
                    packageName,
                    statusCode
                );


            console.log(
                "✅ Package status updated successfully!"
            );

            console.log(
                "----------------------------"
            );

            console.log(
                `Package: ${packageName}`
            );

            console.log(
                `New Status: ${normalizedStatus.toUpperCase()}`
            );

            console.log(
                `Transaction: ${receipt.transactionHash}`
            );

            console.log(
                `Block Number: ${receipt.blockNumber}`
            );

            console.log("");

        } catch (error) {

            console.error(
                "\n❌ Failed to verify package:"
            );

            if (error instanceof Error) {

                console.error(error.message);

            } else {

                console.error(error);
            }
        }
    });


// ==================================================
// PARSE COMMANDS
// ==================================================

program.parse();