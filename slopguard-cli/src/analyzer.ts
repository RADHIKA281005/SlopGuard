import { checkNpmPackage } from "./registry.js";
import { getPackage } from "./contract.js";

export type Verdict =
    | "SAFE"
    | "CONFIRMED_HALLUCINATED"
    | "SUSPICIOUS";

export interface AnalysisResult {
    packageName: string;
    verdict: Verdict;
    npmExists: boolean;
    latestVersion: string | null;
    blockchainStatus: string;
    message: string;
}

export async function analyzePackage(
    packageName: string
): Promise<AnalysisResult> {

    const npmResult = await checkNpmPackage(packageName);

    const blockchainResult = await getPackage(packageName);

    const [
        ,
        status,
        ,
        ,
        existsOnBlockchain
    ] = blockchainResult;

    const packageStatus = Number(status);


    // 1. Confirmed hallucination on blockchain
    if (
        existsOnBlockchain &&
        packageStatus === 2
    ) {
        return {
            packageName,
            verdict: "CONFIRMED_HALLUCINATED",
            npmExists: npmResult.exists,
            latestVersion: npmResult.latestVersion,
            blockchainStatus: "CONFIRMED_HALLUCINATED",
            message:
                "This package has been confirmed as hallucinated."
        };
    }


    // 2. Package reported by community but not yet verified
    if (
        existsOnBlockchain &&
        packageStatus === 0
    ) {
        return {
            packageName,
            verdict: "SUSPICIOUS",
            npmExists: npmResult.exists,
            latestVersion: npmResult.latestVersion,
            blockchainStatus: "UNVERIFIED",
            message:
                npmResult.exists
                    ? "Package exists on npm but has been reported and is awaiting verification."
                    : "Package does not exist on npm and has been reported to SlopGuard."
        };
    }


    // 3. Package exists on npm
    if (npmResult.exists) {
        return {
            packageName,
            verdict: "SAFE",
            npmExists: true,
            latestVersion: npmResult.latestVersion,
            blockchainStatus:
                existsOnBlockchain && packageStatus === 1
                    ? "SAFE"
                    : "NOT_YET_VERIFIED",
            message:
                "Package exists in the official npm registry."
        };
    }


    // 4. Package doesn't exist and hasn't been reported
    return {
        packageName,
        verdict: "SUSPICIOUS",
        npmExists: false,
        latestVersion: null,
        blockchainStatus: "NOT_REPORTED",
        message:
            "Package does not exist in npm and may be hallucinated."
    };
}