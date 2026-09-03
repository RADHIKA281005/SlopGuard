import fs from "fs";
import path from "path";
import { analyzePackage, AnalysisResult } from "./analyzer.js";

export async function scanProject(
    projectPath: string
): Promise<AnalysisResult[]> {

    const packageJsonPath = path.join(
        projectPath,
        "package.json"
    );

    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(
            `package.json not found in: ${projectPath}`
        );
    }

    const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, "utf-8")
    );

    const dependencies = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {})
    };

    const packageNames = Object.keys(dependencies);

    console.log(
        `\n🔍 Found ${packageNames.length} dependencies.`
    );

    const results: AnalysisResult[] = [];

    for (const packageName of packageNames) {
        console.log(`Checking ${packageName}...`);

        const result = await analyzePackage(packageName);

        results.push(result);
    }

    return results;
}