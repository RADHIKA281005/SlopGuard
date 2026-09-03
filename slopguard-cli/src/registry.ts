export async function checkNpmPackage(packageName: string) {
    try {
        const response = await fetch(
            `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
        );

        if (response.status === 200) {
            const data = await response.json();

            return {
                exists: true,
                name: data.name,
                latestVersion: data["dist-tags"]?.latest || "unknown"
            };
        }

        if (response.status === 404) {
            return {
                exists: false,
                name: packageName,
                latestVersion: null
            };
        }

        throw new Error(
            `npm registry returned status ${response.status}`
        );

    } catch (error) {
        throw new Error(
            `Failed to verify package on npm registry: ${error}`
        );
    }
}