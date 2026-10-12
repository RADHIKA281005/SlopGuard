export interface PackageAlternative {
    name: string;
    reason: string;
}

export interface AIAlternativeResponse {
    inferredPurpose: string;
    alternatives: PackageAlternative[];
}